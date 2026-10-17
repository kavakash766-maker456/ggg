"""
Multi-source movie/series stream resolver.

Usage:
    python3 resolver.py "<url>" "<quality>" [--season S01]

Outputs JSON lines to stdout:
    {"status": "found", "url": "...", "quality": "...", "source": "..."}
    {"status": "error", "message": "..."}
"""

import argparse
import json
import sys
import re
from urllib.parse import urlparse, urlencode, urljoin, quote_plus

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def _emit(obj: dict) -> None:
    print(json.dumps(obj), flush=True)


def _emit_found(url: str, quality: str, source: str) -> None:
    _emit({"status": "found", "url": url, "quality": quality, "source": source})


def _emit_error(msg: str) -> None:
    _emit({"status": "error", "message": msg})


def _follow_redirects(url: str, max_hops: int = 8) -> str:
    """Follow HTTP redirects manually, returning the final URL."""
    current = url
    for _ in range(max_hops):
        try:
            resp = SESSION.head(current, allow_redirects=False, timeout=15)
        except requests.RequestException:
            # Fall back to GET if HEAD fails
            try:
                resp = SESSION.get(current, allow_redirects=False, timeout=15, stream=True)
                resp.close()
            except requests.RequestException:
                break
        if resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get("Location", "")
            if not location:
                break
            current = urljoin(current, location)
        else:
            break
    return current


def _decode_hex_token(hex_str: str) -> str:
    try:
        return bytes.fromhex(hex_str).decode("utf-8")
    except Exception:
        return hex_str


# ---------------------------------------------------------------------------
# CineSubz resolver  (cinesubz.lk)
# ---------------------------------------------------------------------------

def _resolve_cinesubz(url: str, quality: str) -> None:
    source = "cinesubz"
    try:
        resp = SESSION.get(url, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as exc:
        _emit_error(f"{source}: fetch failed – {exc}")
        return

    soup = BeautifulSoup(resp.text, "html.parser")

    # Look for download section
    download_section = (
        soup.find(id="download")
        or soup.find("div", class_=re.compile(r"download", re.I))
        or soup.find("section", class_=re.compile(r"download", re.I))
    )
    if download_section is None:
        download_section = soup  # fall back to whole page

    found_any = False

    # Collect all <a> tags that look like download links
    for tag in download_section.find_all("a", href=True):
        href = tag["href"]
        label = tag.get_text(" ", strip=True)

        # Quality filter (case-insensitive)
        if quality and quality.lower() not in label.lower() and quality.lower() not in href.lower():
            # Also check parent elements for quality labels
            parent_text = tag.find_parent().get_text(" ", strip=True) if tag.find_parent() else ""
            if quality.lower() not in parent_text.lower():
                continue

        # Detect obfuscated / redirect patterns
        final_url = href

        # Hex-encoded token in data attribute
        for attr in ("data-token", "data-link", "data-url", "data-href"):
            token = tag.get(attr, "")
            if token and re.fullmatch(r"[0-9a-fA-F]+", token):
                final_url = _decode_hex_token(token)
                break

        # Intermediate redirect patterns
        if any(p in final_url for p in ("/api-", "/zt-links/", "/zt-", "?r=")):
            try:
                redir_resp = SESSION.get(final_url, timeout=15)
                # Look for the real URL in the response body
                body = redir_resp.text
                found_in_body = re.search(
                    r'(https?://[^\s"\'<>]+\.(?:mkv|mp4|avi|rar|zip|torrent)[^\s"\'<>]*)',
                    body, re.I
                )
                if found_in_body:
                    final_url = found_in_body.group(1)
                else:
                    final_url = redir_resp.url  # follow via requests auto-redirect
            except requests.RequestException:
                pass

        final_url = _follow_redirects(final_url)

        # Expired token: try to re-fetch via parent_url
        if "expired" in final_url.lower() or "token" in final_url.lower():
            parent_url_match = re.search(r'parent_url[=:]\s*["\']?(https?://[^\s"\'&>]+)', resp.text)
            if parent_url_match:
                parent_page = parent_url_match.group(1)
                _resolve_cinesubz(parent_page, quality)
                return

        _emit_found(final_url, quality, source)
        found_any = True

    if not found_any:
        _emit_error(f"{source}: no download links found for quality '{quality}'")


# ---------------------------------------------------------------------------
# Baiscopes resolver  (baiscopes.lk)
# ---------------------------------------------------------------------------

def _resolve_baiscopes(url: str, quality: str) -> None:
    source = "baiscopes"
    try:
        resp = SESSION.get(url, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as exc:
        _emit_error(f"{source}: fetch failed – {exc}")
        return

    soup = BeautifulSoup(resp.text, "html.parser")

    # Look for #download section first, then fallback
    section = soup.find(id="download") or soup.find("div", class_=re.compile(r"download", re.I)) or soup

    found_any = False
    for tag in section.find_all("a", href=True):
        href = tag["href"]
        label = tag.get_text(" ", strip=True)

        if quality and quality.lower() not in label.lower() and quality.lower() not in href.lower():
            parent_text = ""
            parent = tag.find_parent()
            if parent:
                parent_text = parent.get_text(" ", strip=True)
            if quality.lower() not in parent_text.lower():
                continue

        final_url = href

        # Follow /links/ redirect pages
        if "/links/" in final_url or re.search(r"/go/|/redir/|/out/", final_url, re.I):
            try:
                r2 = SESSION.get(final_url, timeout=15)
                # Check for meta-refresh or JS redirect
                soup2 = BeautifulSoup(r2.text, "html.parser")
                meta = soup2.find("meta", attrs={"http-equiv": re.compile("refresh", re.I)})
                if meta and meta.get("content"):
                    m = re.search(r"url=(.+)", meta["content"], re.I)
                    if m:
                        final_url = m.group(1).strip("'\" ")
                else:
                    # Try to find direct link in body
                    body_link = re.search(
                        r'(https?://[^\s"\'<>]+\.(?:mkv|mp4|avi|rar|zip)[^\s"\'<>]*)',
                        r2.text, re.I
                    )
                    if body_link:
                        final_url = body_link.group(1)
                    else:
                        final_url = r2.url
            except requests.RequestException:
                pass

        final_url = _follow_redirects(final_url)
        _emit_found(final_url, quality, source)
        found_any = True

    if not found_any:
        _emit_error(f"{source}: no download links found for quality '{quality}'")


# ---------------------------------------------------------------------------
# Pixeldrain resolver  (pixeldrain.com)
# ---------------------------------------------------------------------------

def _resolve_pixeldrain(url: str, quality: str) -> None:
    source = "pixeldrain"
    parsed = urlparse(url)
    path_parts = parsed.path.strip("/").split("/")

    # Patterns: /u/<id>  or  /l/<id>
    if len(path_parts) >= 2 and path_parts[0] in ("u", "l"):
        file_id = path_parts[1]
    else:
        _emit_error(f"{source}: cannot extract file ID from URL '{url}'")
        return

    direct = f"https://pixeldrain.com/api/file/{file_id}?download"
    _emit_found(direct, quality, source)


# ---------------------------------------------------------------------------
# Google Drive resolver  (drive.google.com)
# ---------------------------------------------------------------------------

def _resolve_gdrive(url: str, quality: str) -> None:
    source = "google_drive"
    try:
        import gdown  # type: ignore
    except ImportError:
        _emit_error(f"{source}: gdown is not installed – pip install gdown")
        return

    # gdown.download returns the local path; use fuzzy=True to handle sharing links
    try:
        local_path = gdown.download(url, quiet=True, fuzzy=True)
        if local_path:
            _emit_found(local_path, quality, source)
        else:
            _emit_error(f"{source}: gdown returned no path for '{url}'")
    except Exception as exc:
        _emit_error(f"{source}: gdown failed – {exc}")


# ---------------------------------------------------------------------------
# Telegram resolver  (t.me / telegram.me)
# ---------------------------------------------------------------------------

def _resolve_telegram(url: str, quality: str) -> None:
    source = "telegram"
    try:
        import telegram_downloader  # type: ignore
        import asyncio

        path = asyncio.run(telegram_downloader.download(url))
        _emit_found(path, quality, source)
    except Exception as exc:
        _emit_error(f"{source}: telegram_downloader failed – {exc}")


# ---------------------------------------------------------------------------
# SinhalaSub fallback
# ---------------------------------------------------------------------------

def _resolve_sinhalasub(url: str, quality: str, season: str | None) -> None:
    try:
        import sinhalasub_resolver  # type: ignore
    except ImportError:
        _emit_error("sinhalasub: sinhalasub_resolver module not found")
        return

    try:
        results = sinhalasub_resolver.resolve(url, quality, season)
        if not results:
            _emit_error("sinhalasub: no results returned")
            return
        for item in results:
            _emit_found(item.get("url", ""), item.get("quality", quality), item.get("source", "sinhalasub"))
    except Exception as exc:
        _emit_error(f"sinhalasub: resolver failed – {exc}")


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------

def resolve(url: str, quality: str, season: str | None = None) -> None:
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "cinesubz.lk" in host:
        _resolve_cinesubz(url, quality)
    elif "baiscopes.lk" in host:
        _resolve_baiscopes(url, quality)
    elif "pixeldrain.com" in host:
        _resolve_pixeldrain(url, quality)
    elif "drive.google.com" in host:
        _resolve_gdrive(url, quality)
    elif any(h in host for h in ("t.me", "telegram.me", "telegram.dog")):
        _resolve_telegram(url, quality)
    else:
        # Generic fallback: SinhalaSub
        _resolve_sinhalasub(url, quality, season)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Multi-source movie/series stream resolver"
    )
    parser.add_argument("url", help="Source page or media URL")
    parser.add_argument("quality", help="Desired quality (e.g. 1080p, 720p, 4K)")
    parser.add_argument("--season", default=None, help="Season filter (e.g. S01)")
    args = parser.parse_args()
    resolve(args.url, args.quality, args.season)
