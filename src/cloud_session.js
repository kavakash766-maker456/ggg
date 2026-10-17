// cloud_session.js
// Manages WhatsApp session persistence via GitHub Gist (gzip + base64)

'use strict';

const axios = require('axios');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const SESSION_DIR = path.join(process.cwd(), 'session');
const GH_PAT = process.env.GH_PAT;
const SESSION_VAULT_ID = process.env.SESSION_VAULT_ID;

const GIST_API = () => `https://api.github.com/gists/${SESSION_VAULT_ID}`;

function authHeaders() {
  return {
    Authorization: `token ${GH_PAT}`,
    'Content-Type': 'application/json',
    'User-Agent': 'filmfeed-bot/1.0.0',
  };
}

class CloudSession {
  /**
   * restore()
   * Fetches the Gist, decodes the base64+gzip payload,
   * and writes each key back as a file under ./session/.
   */
  async restore() {
    if (!GH_PAT || !SESSION_VAULT_ID) {
      console.warn('[CloudSession] GH_PAT or SESSION_VAULT_ID not set — skipping restore');
      return;
    }

    try {
      const res = await axios.get(GIST_API(), { headers: authHeaders() });
      const files = res.data.files;

      if (!files || !files['session.gz.b64']) {
        console.log('[CloudSession] No existing session found in Gist — starting fresh');
        return;
      }

      const encoded = files['session.gz.b64'].content;
      const compressed = Buffer.from(encoded, 'base64');
      const raw = await gunzip(compressed);
      const sessionData = JSON.parse(raw.toString('utf8'));

      // Ensure session directory exists
      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }

      // Write each key as a file
      for (const [filename, content] of Object.entries(sessionData)) {
        const filePath = path.join(SESSION_DIR, filename);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        fs.writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content), 'utf8');
      }

      console.log(`[CloudSession] Session restored — ${Object.keys(sessionData).length} file(s) written`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('[CloudSession] Gist not found — starting fresh');
      } else {
        console.error('[CloudSession] restore() error:', err.message);
      }
    }
  }

  /**
   * sync()
   * Reads all files from ./session/, builds a JSON map,
   * gzips + base64-encodes it, and PATCHes the Gist.
   */
  async sync() {
    if (!GH_PAT || !SESSION_VAULT_ID) {
      console.warn('[CloudSession] GH_PAT or SESSION_VAULT_ID not set — skipping sync');
      return;
    }

    try {
      if (!fs.existsSync(SESSION_DIR)) {
        console.warn('[CloudSession] session/ directory does not exist — nothing to sync');
        return;
      }

      const sessionData = {};
      const entries = fs.readdirSync(SESSION_DIR, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(SESSION_DIR, entry.name);
          const content = fs.readFileSync(filePath, 'utf8');
          // Try to parse as JSON so we preserve structure; fall back to raw string
          try {
            sessionData[entry.name] = JSON.parse(content);
          } catch {
            sessionData[entry.name] = content;
          }
        }
      }

      const raw = Buffer.from(JSON.stringify(sessionData), 'utf8');
      const compressed = await gzip(raw);
      const encoded = compressed.toString('base64');

      await axios.patch(
        GIST_API(),
        {
          files: {
            'session.gz.b64': { content: encoded },
          },
        },
        { headers: authHeaders() }
      );

      console.log(`[CloudSession] Session synced — ${Object.keys(sessionData).length} file(s) uploaded`);
    } catch (err) {
      console.error('[CloudSession] sync() error:', err.message);
    }
  }

  /**
   * uploadQR(qrText)
   * PATCHes the Gist with the raw QR string so external
   * tools / dashboards can render the pairing code.
   */
  async uploadQR(qrText) {
    if (!GH_PAT || !SESSION_VAULT_ID) {
      return;
    }

    try {
      await axios.patch(
        GIST_API(),
        {
          files: {
            'latest_qr.txt': { content: qrText },
          },
        },
        { headers: authHeaders() }
      );
      console.log('[CloudSession] QR uploaded to Gist');
    } catch (err) {
      console.error('[CloudSession] uploadQR() error:', err.message);
    }
  }
}

module.exports = new CloudSession();
