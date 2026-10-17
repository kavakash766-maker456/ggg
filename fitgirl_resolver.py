"""
FitGirl Repacks scraper.

Usage:
    python3 fitgirl_resolver.py "<fitgirl-url>" <start_part> <end_part>

Outputs one JSON line per part:
    {"part": 1, "url": "https://fuckingfast.co/...", "filename": "game-slug-part-1.rar"}
"""

import json
import re
import sys
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://fitgirl-repacks.site/",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

FUCKINGFAST_PATTERN = re.compile(
    r"https?://(?:www\.)?fuckingfast\.co/[^\s\"'<>]+",
    re.I,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    """Convert a page title to a URL-friendly slug."""
    text = text.lower().strip()
    # Remove common suffixes like 'v1.0' or '(FitGirl Repack)'
    text = re.sub(r"\s*[\(\[].*?[\)\]]", "", text)
    # Keep only alphanumeric and spaces
    text = re.sub(r"[^a-z0-9\s]", "", text)
    # Collapse whitespace and replace with hyphens
    text = re.sub(r"\s+", "-", text).strip("-")
    return text


def _extract_game_slug(soup: BeautifulSoup, page_url: str) -> str:
    """
    Try to get a clean slug from the page <title> or <h1>.
    Falls back to the URL path slug.
    """
    # Try <h1> first (most reliable on FitGirl)
    h1 = soup.find("h1", class_=re.compile(r"entry-title|post-title", re.I))
    if not h1:
        h1 = soup.find("h1")
    if h1:
        return _slugify(h1.get_text(strip=True))

    # Try <title>
    title_tag = soup.find("title")
    if title_tag:
        # FitGirl titles look like "Game Name – FitGirl Repacks"
        raw = title_tag.get_text(strip=True)
        raw = raw.split("–")[0].split("|")[0].strip()
        return _slugify(raw)

    # Fallback: use URL path
    parsed = urlparse(page_url)
    segments = [s for s in parsed.path.strip("/").split("/") if s]
    return segments[-1] if segments else "game"


def _extract_fuckingfast_links(soup: BeautifulSoup) -> list[str]:
    """
    Extract all fuckingfast.co hrefs from <a> tags on the page.
    Preserves document order and de-duplicates.
    """
    seen: set[str] = set()
    links: list[str] = []

    for tag in soup.find_all("a", href=True):
        href: str = tag["href"]
        if "fuckingfast.co" in href.lower():
            # Normalise
            href = href.strip()
            if href not in seen:
                seen.add(href)
                links.append(href)

    # Also scan raw text for any links that might be in onclick/data attrs
    for match in FUCKINGFAST_PATTERN.findall(str(soup)):
        if match not in seen:
            seen.add(match)
            links.append(match)

    return links


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def resolve_game(fitgirl_url: str, start_part: int, end_part: int) -> None:
    """
    Scrape FitGirl Repacks page and output JSON lines for each requested part.

    Parameters
    ----------
    fitgirl_url : URL of the FitGirl Repacks post.
    start_part  : First part number to include (1-indexed).
    end_part    : Last part number to include (inclusive).
    """
    # Fetch page
    try:
        resp = SESSION.get(fitgirl_url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(json.dumps({"status": "error", "message": f"fetch failed: {exc}"}))
        sys.exit(1)

    soup = BeautifulSoup(resp.text, "html.parser")
    slug = _extract_game_slug(soup, fitgirl_url)
    all_links = _extract_fuckingfast_links(soup)

    if not all_links:
        print(json.dumps({"status": "error", "message": "No fuckingfast.co links found on page"}))
        sys.exit(1)

    # Slice to requested range (1-indexed → 0-indexed)
    start_idx = max(start_part - 1, 0)
    end_idx = end_part  # slicing is exclusive at end, so this gives [start_part, end_part] inclusive
    selected = all_links[start_idx:end_idx]

    if not selected:
        print(json.dumps({
            "status": "error",
            "message": (
                f"Requested parts {start_part}–{end_part} not available. "
                f"Page has {len(all_links)} part(s)."
            ),
        }))
        sys.exit(1)

    for i, link_url in enumerate(selected, start=start_part):
        filename = f"{slug}-part-{i}.rar"
        print(json.dumps({"part": i, "url": link_url, "filename": filename}))


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(
            "Usage: python3 fitgirl_resolver.py <fitgirl-url> <start_part> <end_part>",
            file=sys.stderr,
        )
        sys.exit(1)

    _url = sys.argv[1]
    try:
        _start = int(sys.argv[2])
        _end = int(sys.argv[3])
    except ValueError:
        print("start_part and end_part must be integers.", file=sys.stderr)
        sys.exit(1)

    if _start < 1 or _end < _start:
        print("start_part must be >= 1 and end_part must be >= start_part.", file=sys.stderr)
        sys.exit(1)

    resolve_game(_url, _start, _end)
