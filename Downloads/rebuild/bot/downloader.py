"""
FuckingFast Cloudflare Turnstile bypass downloader using Playwright.

Public API:
    async resolve_one(ff_url, browser_ctx) -> str
    async download_file(ff_url, output_dir='./temp') -> str

Only accepts URLs from fuckingfast.co / dl.fuckingfast.co.
"""

import asyncio
import os
import re
from urllib.parse import urlparse

import aiohttp
import aiofiles
from playwright.async_api import BrowserContext, Page, async_playwright

try:
    from playwright_stealth import stealth_async  # type: ignore
except ImportError:
    async def stealth_async(page: Page) -> None:  # type: ignore
        """Fallback no-op when playwright-stealth is not installed."""
        pass


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_DOMAINS = {"fuckingfast.co", "dl.fuckingfast.co"}

# Selectors that FuckingFast uses for the download button (may change over time;
# listed in priority order).
DOWNLOAD_BUTTON_SELECTORS = [
    "a#downloadButton",
    "a.download-btn",
    "a[href*='dl.fuckingfast.co']",
    "button#downloadButton",
    "a:has-text('Download')",
    "a:has-text('DOWNLOAD')",
]

# Turnstile iframe is gone once the challenge is solved
TURNSTILE_IFRAME_SELECTOR = "iframe[src*='challenges.cloudflare.com']"

NAVIGATION_TIMEOUT_MS = 60_000   # 60 s for page navigation
TURNSTILE_POLL_MS = 1_000        # 1 s between Turnstile checks
TURNSTILE_MAX_WAIT_S = 90        # 90 s max wait for challenge to clear


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    host = parsed.netloc.lower().lstrip("www.")
    if host not in ALLOWED_DOMAINS:
        raise ValueError(
            f"Unsupported domain '{parsed.netloc}'. "
            f"Only {', '.join(sorted(ALLOWED_DOMAINS))} are accepted."
        )


# ---------------------------------------------------------------------------
# Core resolver
# ---------------------------------------------------------------------------

async def resolve_one(ff_url: str, browser_ctx: BrowserContext) -> str:
    """
    Resolve a fuckingfast.co URL to a direct download link.

    Uses playwright-stealth to bypass Cloudflare Turnstile.
    Returns the direct download URL as a string.

    Parameters
    ----------
    ff_url      : The FuckingFast page URL.
    browser_ctx : An existing Playwright BrowserContext to open a new page in.
    """
    _validate_url(ff_url)

    page: Page = await browser_ctx.new_page()
    direct_url_holder: list[str] = []

    # ---- Intercept requests to catch the actual file download URL ----------
    async def _on_request(request):
        url = request.url
        # Direct file download URLs or dl.fuckingfast.co requests
        if re.search(
            r"\.(mkv|mp4|avi|rar|zip|7z|iso|exe|bin)(\?|$)",
            url, re.I
        ) or "dl.fuckingfast.co" in url:
            if not direct_url_holder:
                direct_url_holder.append(url)

    page.on("request", _on_request)

    try:
        # Apply stealth patches before navigation
        await stealth_async(page)

        # Navigate to the FuckingFast page
        await page.goto(ff_url, wait_until="networkidle", timeout=NAVIGATION_TIMEOUT_MS)

        # ---- Wait for Turnstile to clear -------------------------------------
        elapsed = 0
        while elapsed < TURNSTILE_MAX_WAIT_S:
            # Check whether the Turnstile iframe is still present
            iframe = await page.query_selector(TURNSTILE_IFRAME_SELECTOR)
            if iframe is None:
                break  # Challenge cleared
            await asyncio.sleep(TURNSTILE_POLL_MS / 1000)
            elapsed += TURNSTILE_POLL_MS / 1000

        # ---- Find and click the download button ----------------------------
        download_href: str | None = None
        for selector in DOWNLOAD_BUTTON_SELECTORS:
            try:
                btn = await page.wait_for_selector(selector, timeout=10_000, state="visible")
                if btn:
                    # Try to get href before clicking (avoids navigation away)
                    download_href = await btn.get_attribute("href")
                    if download_href:
                        break
                    # Click and wait for navigation / download event
                    async with page.expect_navigation(timeout=15_000):
                        await btn.click()
                    download_href = page.url
                    break
            except Exception:
                continue

        # ---- Determine the final URL ----------------------------------------
        if direct_url_holder:
            return direct_url_holder[0]

        if download_href:
            if not download_href.startswith("http"):
                from urllib.parse import urljoin
                download_href = urljoin(ff_url, download_href)
            return download_href

        # Last resort: scan page content for direct file links
        html = await page.content()
        dl_match = re.search(
            r'(https://dl\.fuckingfast\.co/[^\s"\'<>]+)',
            html
        )
        if dl_match:
            return dl_match.group(1)

        raise RuntimeError(
            f"Could not locate a direct download URL on page: {ff_url}"
        )

    finally:
        await page.close()


# ---------------------------------------------------------------------------
# High-level downloader
# ---------------------------------------------------------------------------

async def download_file(ff_url: str, output_dir: str = "./temp") -> str:
    """
    Resolve a fuckingfast.co URL and download the file to output_dir.

    Returns the local file path.
    """
    _validate_url(ff_url)
    os.makedirs(output_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            java_script_enabled=True,
        )
        try:
            direct_url = await resolve_one(ff_url, ctx)
        finally:
            await browser.close()

    # Derive filename from URL
    filename = direct_url.split("?")[0].split("/")[-1] or "download.rar"
    # Sanitize filename
    filename = re.sub(r'[\\/:*?"<>|]', "_", filename)
    out_path = os.path.join(output_dir, filename)

    # Stream download via aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(
            direct_url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            },
            timeout=aiohttp.ClientTimeout(total=None, connect=30),
        ) as resp:
            resp.raise_for_status()
            async with aiofiles.open(out_path, "wb") as f:
                async for chunk in resp.content.iter_chunked(64 * 1024):
                    await f.write(chunk)

    return out_path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 downloader.py <fuckingfast_url> [output_dir]", file=sys.stderr)
        sys.exit(1)

    _url = sys.argv[1]
    _out_dir = sys.argv[2] if len(sys.argv) > 2 else "./temp"

    try:
        path = asyncio.run(download_file(_url, _out_dir))
        print(path)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
