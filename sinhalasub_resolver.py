"""
SinhalaSub.com scraper and fallback resolver.

Public API:
    resolve(url, quality, season=None) -> list[dict]

Each dict has keys: url, quality, source
"""

import re
from urllib.parse import urlparse, quote_plus, urljoin

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_URL = "https://sinhalasub.com"
SEARCH_URL = f"{BASE_URL}/search/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": BASE_URL,
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _follow_redirects(url: str, max_hops: int = 8) -> str:
    """Follow HTTP redirect chain and return the final URL."""
    current = url
    for _ in range(max_hops):
        try:
            resp = SESSION.head(current, allow_redirects=False, timeout=15)
        except requests.RequestException:
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


def _extract_title_from_url(url: str) -> str:
    """
    Pull a human-readable title out of a URL path.
    e.g. /2024/the-beekeeper-2024/ -> 'the beekeeper 2024'
    """
    parsed = urlparse(url)
    # Take the last non-empty path segment
    segments = [s for s in parsed.path.strip("/").split("/") if s]
    if not segments:
        return ""
    slug = segments[-1]
    # Remove trailing year or numeric ID
    slug = re.sub(r"-\d{4}$", "", slug)
    # Replace hyphens/underscores with spaces
    title = slug.replace("-", " ").replace("_", " ").strip()
    return title


def _quality_matches(text: str, quality: str) -> bool:
    """Return True if quality string is present in text (case-insensitive)."""
    if not quality:
        return True
    return quality.lower() in text.lower()


def _extract_download_links(soup: BeautifulSoup, quality: str) -> list:
    """
    Parse a SinhalaSub media page and return download link dicts.
    """
    results = []

    # SinhalaSub typically wraps download buttons in .download-link, .dl-link,
    # or table rows with quality labels.
    containers = (
        soup.find_all("div", class_=re.compile(r"download|dl-link|link-box", re.I))
        or soup.find_all("table")
    )

    # Also scan all <a> tags across the whole page as last resort
    all_anchors = soup.find_all("a", href=True)

    collected_hrefs = set()

    for container in containers:
        for tag in container.find_all("a", href=True):
            href = tag["href"]
            label = tag.get_text(" ", strip=True)
            context = container.get_text(" ", strip=True)

            if not href.startswith("http"):
                href = urljoin(BASE_URL, href)

            if not _quality_matches(label + " " + context, quality):
                continue

            if href in collected_hrefs:
                continue
            collected_hrefs.add(href)

            final_url = _follow_redirects(href)
            results.append({
                "url": final_url,
                "quality": quality,
                "source": "sinhalasub",
            })

    # Fallback: scan all <a> tags if nothing found yet
    if not results:
        for tag in all_anchors:
            href = tag["href"]
            label = tag.get_text(" ", strip=True)

            # Only include obvious file/download links
            if not re.search(r"\.(mkv|mp4|avi|rar|zip|torrent)($|\?)", href, re.I):
                if not re.search(r"download|dl\.|gdrive|mega|drive\.google", href, re.I):
                    continue

            if not href.startswith("http"):
                href = urljoin(BASE_URL, href)

            if not _quality_matches(label, quality):
                continue

            if href in collected_hrefs:
                continue
            collected_hrefs.add(href)

            final_url = _follow_redirects(href)
            results.append({
                "url": final_url,
                "quality": quality,
                "source": "sinhalasub",
            })

    return results


def _search_sinhalasub(title: str) -> list:
    """
    Search sinhalasub.com and return a list of (title_text, page_url) tuples.
    """
    params = {"q": title}
    try:
        resp = SESSION.get(SEARCH_URL, params=params, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"sinhalasub search request failed: {exc}") from exc

    soup = BeautifulSoup(resp.text, "html.parser")

    results = []
    # Article cards on SinhalaSub use <article> or .post elements with an <a> title link
    for article in soup.find_all(["article", "div"], class_=re.compile(r"post|item|movie|result", re.I)):
        link = article.find("a", href=True)
        heading = article.find(["h2", "h3", "h4"])
        if link:
            item_title = heading.get_text(strip=True) if heading else link.get_text(strip=True)
            item_url = link["href"]
            if not item_url.startswith("http"):
                item_url = urljoin(BASE_URL, item_url)
            results.append((item_title, item_url))

    return results


def _pick_best_match(results: list, title: str) -> str | None:
    """
    From a list of (title_text, url) pairs, pick the one whose title is
    most similar to the search title. Returns the URL or None.
    """
    if not results:
        return None

    title_lower = title.lower()
    title_words = set(title_lower.split())

    best_url = None
    best_score = -1

    for item_title, item_url in results:
        item_lower = item_title.lower()
        item_words = set(item_lower.split())
        # Jaccard-like score
        intersection = len(title_words & item_words)
        union = len(title_words | item_words) or 1
        score = intersection / union
        if score > best_score:
            best_score = score
            best_url = item_url

    return best_url


def _filter_by_season(results: list, season: str | None) -> list:
    """Keep only results whose URL or label contains the season tag, if given."""
    if not season:
        return results
    season_lower = season.lower()
    filtered = [r for r in results if season_lower in r.get("url", "").lower()]
    return filtered if filtered else results  # fallback: return all if none match


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def resolve(url: str, quality: str, season: str | None = None) -> list:
    """
    Search sinhalasub.com for the given URL's title or scrape directly.

    Parameters
    ----------
    url     : Source URL – may already be a sinhalasub.com page or any other
              URL whose path contains a movie/show title slug.
    quality : Desired quality string, e.g. '1080p', '720p', '4K'.
    season  : Optional season tag, e.g. 'S01'.

    Returns
    -------
    List of dicts with keys: url, quality, source
    """
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "sinhalasub.com" in host:
        # Direct fetch
        try:
            resp = SESSION.get(url, timeout=20)
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(f"sinhalasub fetch failed: {exc}") from exc

        soup = BeautifulSoup(resp.text, "html.parser")
        results = _extract_download_links(soup, quality)
    else:
        # Extract title from URL and search SinhalaSub
        title = _extract_title_from_url(url)
        if not title:
            raise ValueError(f"Could not extract title from URL: {url}")

        search_results = _search_sinhalasub(title)
        media_url = _pick_best_match(search_results, title)

        if not media_url:
            raise RuntimeError(f"No results found on sinhalasub.com for '{title}'")

        try:
            resp = SESSION.get(media_url, timeout=20)
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(f"sinhalasub media page fetch failed: {exc}") from exc

        soup = BeautifulSoup(resp.text, "html.parser")
        results = _extract_download_links(soup, quality)

    if season:
        results = _filter_by_season(results, season)

    return results


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 3:
        print("Usage: python3 sinhalasub_resolver.py <url> <quality> [season]", file=sys.stderr)
        sys.exit(1)

    _url = sys.argv[1]
    _quality = sys.argv[2]
    _season = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        items = resolve(_url, _quality, _season)
        for item in items:
            print(json.dumps(item))
    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))
        sys.exit(1)
