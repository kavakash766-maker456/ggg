"""
Telethon MTProto fast downloader.

Public API:
    async download(url, output_dir='./temp') -> str

Required environment variables:
    TG_SESSION_STRING   – Telethon StringSession string
    TG_API_ID           – Telegram API id (integer)
    TG_API_HASH         – Telegram API hash (hex string)

Usage:
    python3 telegram_downloader.py "<t.me/username/message_id>"
"""

import asyncio
import os
import re
from urllib.parse import urlparse


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def download(url: str, output_dir: str = "./temp") -> str:
    """
    Download a file from a Telegram message link via MTProto.

    Supports:
        https://t.me/<username>/<message_id>
        https://t.me/c/<channel_id>/<message_id>

    Parameters
    ----------
    url        : Public or private Telegram message URL.
    output_dir : Directory to save the downloaded file.

    Returns
    -------
    Local file path as a string.
    """
    # ---- Lazy imports (Telethon may not be installed in all envs) ----------
    try:
        from telethon import TelegramClient  # type: ignore
        from telethon.sessions import StringSession  # type: ignore
        from telethon.errors import FloodWaitError  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "telethon is not installed. Run: pip install telethon"
        ) from exc

    # ---- Load environment variables ----------------------------------------
    session_string = os.environ.get("TG_SESSION_STRING", "")
    api_id_str = os.environ.get("TG_API_ID", "")
    api_hash = os.environ.get("TG_API_HASH", "")

    if not session_string:
        raise EnvironmentError("TG_SESSION_STRING environment variable is not set.")
    if not api_id_str:
        raise EnvironmentError("TG_API_ID environment variable is not set.")
    if not api_hash:
        raise EnvironmentError("TG_API_HASH environment variable is not set.")

    try:
        api_id = int(api_id_str)
    except ValueError:
        raise EnvironmentError(f"TG_API_ID must be an integer, got: '{api_id_str}'")

    # ---- Parse the Telegram URL --------------------------------------------
    entity, message_id = _parse_telegram_url(url)

    # ---- Create output dir -------------------------------------------------
    os.makedirs(output_dir, exist_ok=True)

    # ---- Connect and download ----------------------------------------------
    client = TelegramClient(StringSession(session_string), api_id, api_hash)

    async with client:
        # Resolve entity
        try:
            if isinstance(entity, int):
                # Private channel: entity is a numeric channel id
                tg_entity = await client.get_entity(entity)
            else:
                tg_entity = await client.get_entity(entity)
        except Exception as exc:
            raise RuntimeError(f"Could not resolve Telegram entity '{entity}': {exc}") from exc

        # Fetch the message
        try:
            messages = await client.get_messages(tg_entity, ids=message_id)
        except FloodWaitError as exc:
            raise RuntimeError(
                f"Telegram flood wait: retry after {exc.seconds}s"
            ) from exc
        except Exception as exc:
            raise RuntimeError(f"Failed to fetch message {message_id}: {exc}") from exc

        if messages is None:
            raise RuntimeError(f"Message {message_id} not found in '{entity}'.")

        msg = messages  # get_messages(ids=...) returns a single Message

        if msg is None or not msg.media:
            raise RuntimeError(
                f"Message {message_id} has no downloadable media."
            )

        # Download the media
        try:
            local_path = await client.download_media(
                msg,
                file=output_dir,
            )
        except Exception as exc:
            raise RuntimeError(f"Media download failed: {exc}") from exc

        if not local_path:
            raise RuntimeError("Telethon returned no file path after download.")

        return str(local_path)


# ---------------------------------------------------------------------------
# URL Parser
# ---------------------------------------------------------------------------

def _parse_telegram_url(url: str):
    """
    Parse a Telegram message URL and return (entity, message_id).

    entity is either:
        - str  : public username (e.g. 'durov')
        - int  : private channel id (e.g. -100123456789)

    message_id is an int.

    Supported patterns:
        https://t.me/<username>/<msg_id>
        https://t.me/c/<channel_id>/<msg_id>
        https://telegram.me/<username>/<msg_id>
        https://t.me/<username>/<msg_id>?single
    """
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    segments = path.split("/")

    # Pattern: t.me/c/<channel_id>/<msg_id>   (private channels)
    if len(segments) >= 3 and segments[0] == "c":
        try:
            channel_id = int(segments[1])
            message_id = int(segments[2])
        except ValueError:
            raise ValueError(f"Cannot parse private channel URL: {url}")
        # Telethon requires the full negative int for private channels
        entity = int(f"-100{channel_id}")
        return entity, message_id

    # Pattern: t.me/<username>/<msg_id>
    if len(segments) >= 2:
        username = segments[0]
        try:
            message_id = int(segments[1])
        except ValueError:
            raise ValueError(f"Cannot parse message ID from URL: {url}")
        return username, message_id

    raise ValueError(
        f"Unrecognised Telegram URL format: '{url}'. "
        "Expected https://t.me/<username>/<msg_id> or https://t.me/c/<channel_id>/<msg_id>"
    )


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(
            "Usage: python3 telegram_downloader.py <telegram_url> [output_dir]",
            file=sys.stderr,
        )
        sys.exit(1)

    _url = sys.argv[1]
    _out_dir = sys.argv[2] if len(sys.argv) > 2 else "./temp"

    try:
        path = asyncio.run(download(_url, _out_dir))
        print(path)
    except (EnvironmentError, ValueError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
