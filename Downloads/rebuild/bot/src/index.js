// index.js
// FilmFeed 4K WhatsApp Bot — powered by @whiskeysockets/baileys

'use strict';

require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cloudSession = require('./cloud_session');

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_DIR = path.join(process.cwd(), 'session');
const BOT_START_TIME = Date.now();

/** Parse the comma-separated list of allowed group JIDs */
const ALLOWED_JIDS = (process.env.TARGET_GROUP_JIDS || process.env.TARGET_GROUP_JID || '')
  .split(',')
  .map((j) => j.trim())
  .filter(Boolean);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Send a plain text message to a JID.
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {string} jid
 * @param {string} msg
 */
async function sendMessage(sock, jid, msg) {
  try {
    await sock.sendMessage(jid, { text: msg });
  } catch (err) {
    console.error(`[sendMessage] Failed to send to ${jid}:`, err.message);
  }
}

/**
 * Run a Python script and collect JSON lines from stdout.
 * Resolves with an array of parsed objects.
 * Rejects on non-zero exit code.
 * @param {string[]} args - argv for the python3 call
 * @returns {Promise<object[]>}
 */
function runPythonJSON(args) {
  return new Promise((resolve, reject) => {
    const results = [];
    const proc = spawn('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrBuf = '';
    proc.stderr.on('data', (d) => {
      stderrBuf += d.toString();
    });

    proc.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          results.push(JSON.parse(trimmed));
        } catch {
          // non-JSON line — ignore (may be debug output from Python)
        }
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited ${code}: ${stderrBuf.trim()}`));
      } else {
        resolve(results);
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

/**
 * Run a Python script and return the first non-empty stdout line.
 * Used when a script writes a local file path to stdout.
 * @param {string[]} args
 * @returns {Promise<string>}
 */
function runPythonLine(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let stderrBuf = '';

    proc.stderr.on('data', (d) => {
      stderrBuf += d.toString();
    });

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited ${code}: ${stderrBuf.trim()}`));
      } else {
        const line = output.split('\n').map((l) => l.trim()).find(Boolean) || '';
        resolve(line);
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

/** Format milliseconds into "Xh Ym" */
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

/**
 * Handle !req <url> | <quality> | <token>
 */
async function handleReq(sock, jid, rawArgs) {
  const parts = rawArgs.split('|').map((p) => p.trim());
  if (parts.length < 3) {
    await sendMessage(sock, jid, '❌ Usage: !req <url> | <quality> | <token>');
    return;
  }
  const [url, quality] = parts;

  try {
    await sendMessage(sock, jid, `🔍 Resolving *${quality}* links for:\n${url}`);
    const results = await runPythonJSON(['resolver.py', url, quality]);

    if (!results.length) {
      await sendMessage(sock, jid, '⚠️ No links found for this request.');
      return;
    }

    for (const item of results) {
      const { status, url: link, quality: q, source } = item;
      if (status === 'found') {
        await sendMessage(
          sock,
          jid,
          `✅ *${q || quality}* | Source: ${source || 'unknown'}\n${link}`
        );
      } else if (status === 'error') {
        await sendMessage(sock, jid, `❌ Resolver error: ${item.message || 'unknown error'}`);
      }
    }
  } catch (err) {
    await sendMessage(sock, jid, `❌ !req failed: ${err.message}`);
  }
}

/**
 * Handle !req_season <url> | S<season> | <quality> | <token>
 */
async function handleReqSeason(sock, jid, rawArgs) {
  const parts = rawArgs.split('|').map((p) => p.trim());
  if (parts.length < 4) {
    await sendMessage(sock, jid, '❌ Usage: !req_season <url> | S<season> | <quality> | <token>');
    return;
  }
  const [url, seasonStr, quality] = parts;
  // Accept "S01", "s1", "S1", "01", "1" — extract numeric part
  const seasonMatch = seasonStr.match(/(\d+)/);
  if (!seasonMatch) {
    await sendMessage(sock, jid, `❌ Cannot parse season number from: ${seasonStr}`);
    return;
  }
  const season = seasonMatch[1];

  try {
    await sendMessage(sock, jid, `🔍 Resolving Season ${season} *${quality}* links for:\n${url}`);
    const results = await runPythonJSON(['resolver.py', url, quality, '--season', season]);

    if (!results.length) {
      await sendMessage(sock, jid, '⚠️ No episode links found.');
      return;
    }

    for (const item of results) {
      const { status, url: link, quality: q, source } = item;
      if (status === 'found') {
        await sendMessage(
          sock,
          jid,
          `✅ *${q || quality}* | Source: ${source || 'unknown'}\n${link}`
        );
      } else if (status === 'error') {
        await sendMessage(sock, jid, `❌ Resolver error: ${item.message || 'unknown error'}`);
      }
    }
  } catch (err) {
    await sendMessage(sock, jid, `❌ !req_season failed: ${err.message}`);
  }
}

/**
 * Handle !req_game <fitgirl-url> | Parts <start>-<end> | <token>
 */
async function handleReqGame(sock, jid, rawArgs) {
  const parts = rawArgs.split('|').map((p) => p.trim());
  if (parts.length < 3) {
    await sendMessage(sock, jid, '❌ Usage: !req_game <url> | Parts <start>-<end> | <token>');
    return;
  }
  const [url, partsStr] = parts;

  // Parse "Parts X-Y" or "parts X-Y"
  const rangeMatch = partsStr.match(/parts?\s*(\d+)-(\d+)/i);
  if (!rangeMatch) {
    await sendMessage(sock, jid, `❌ Cannot parse parts range from: ${partsStr}\nExpected format: Parts 1-5`);
    return;
  }
  const start = parseInt(rangeMatch[1], 10);
  const end = parseInt(rangeMatch[2], 10);

  try {
    await sendMessage(sock, jid, `🎮 Resolving game parts ${start}-${end} from:\n${url}`);
    const partLinks = await runPythonJSON(['fitgirl_resolver.py', url, String(start), String(end)]);

    if (!partLinks.length) {
      await sendMessage(sock, jid, '⚠️ No game parts found.');
      return;
    }

    for (const item of partLinks) {
      const { part, url: partUrl, filename } = item;
      await sendMessage(sock, jid, `⬇️ Downloading Part ${part}: ${filename}`);

      try {
        const localPath = await runPythonLine(['downloader.py', partUrl]);
        if (!localPath || !fs.existsSync(localPath)) {
          await sendMessage(sock, jid, `❌ Download failed for Part ${part} — file not found at: ${localPath}`);
          continue;
        }

        const fileBuffer = fs.readFileSync(localPath);
        await sock.sendMessage(jid, {
          document: fileBuffer,
          mimetype: 'application/x-rar-compressed',
          fileName: filename || path.basename(localPath),
        });

        // Clean up local file after sending
        try {
          fs.unlinkSync(localPath);
        } catch {
          // best-effort cleanup
        }
      } catch (dlErr) {
        await sendMessage(sock, jid, `❌ Failed to download Part ${part}: ${dlErr.message}`);
      }
    }
  } catch (err) {
    await sendMessage(sock, jid, `❌ !req_game failed: ${err.message}`);
  }
}

/**
 * Handle !status
 */
async function handleStatus(sock, jid) {
  const uptime = formatUptime(Date.now() - BOT_START_TIME);
  const msg = `FilmFeed 4K Bot v1.0.0\nUptime: ${uptime}\nStatus: Online`;
  await sendMessage(sock, jid, msg);
}

/**
 * Handle !help
 */
async function handleHelp(sock, jid) {
  const msg = [
    'FilmFeed 4K Bot Commands:',
    '!req <url> | <quality> | <token> - Request movie/series',
    '!req_season <url> | S<season> | <quality> | <token> - Request full season',
    '!req_game <url> | Parts <start>-<end> | <token> - Request PC game',
    '!status - Bot status',
    '!help - This message',
    '',
    'Qualities: 480p, 720p, 1080p, 4K',
  ].join('\n');
  await sendMessage(sock, jid, msg);
}

// ─── Bot Initialisation ───────────────────────────────────────────────────────

async function startBot() {
  // 1. Restore session from Gist before loading auth state
  await cloudSession.restore();

  // Ensure session directory exists for useMultiFileAuthState
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  // 2. Create socket
  const sock = makeWASocket({
    generateHighQualityLinkPreview: false,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  // 3. Persist credentials and sync to Gist on every update
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    await cloudSession.sync();
  });

  // 4. Connection lifecycle
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR code handling
    if (qr) {
      // Print to terminal
      qrcode.generate(qr, { small: true });

      // Build a scannable URL for external viewers
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qr)}`;
      console.log('[Bot] QR Code URL:', qrUrl);

      // Upload raw QR string to Gist
      await cloudSession.uploadQR(qr);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        `[Bot] Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`
      );

      if (shouldReconnect) {
        // Brief delay before reconnecting to avoid tight loops
        setTimeout(startBot, 3000);
      } else {
        console.log('[Bot] Logged out — not reconnecting');
        process.exit(0);
      }
    } else if (connection === 'open') {
      console.log('[Bot] Connected to WhatsApp');
    }
  });

  // 5. Message handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        const jid = msg.key.remoteJid;

        // Only handle messages from allowed group JIDs
        if (!ALLOWED_JIDS.includes(jid)) continue;

        // Skip messages sent by this bot
        if (msg.key.fromMe) continue;

        // Extract text content
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          '';

        if (!text.startsWith('!')) continue;

        const spaceIdx = text.indexOf(' ');
        const command = spaceIdx === -1 ? text.toLowerCase() : text.slice(0, spaceIdx).toLowerCase();
        const rawArgs = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

        switch (command) {
          case '!req':
            await handleReq(sock, jid, rawArgs);
            break;

          case '!req_season':
            await handleReqSeason(sock, jid, rawArgs);
            break;

          case '!req_game':
            await handleReqGame(sock, jid, rawArgs);
            break;

          case '!status':
            await handleStatus(sock, jid);
            break;

          case '!help':
            await handleHelp(sock, jid);
            break;

          default:
            // Unknown command — silently ignore
            break;
        }
      } catch (err) {
        console.error('[Bot] Unhandled message error:', err.message);
      }
    }
  });
}

// ─── Graceful shutdown after runner lifetime ──────────────────────────────────

const lifetimeMs =
  parseFloat(process.env.RUNNER_LIFETIME_HOURS || '4.5') * 60 * 60 * 1000;

setTimeout(() => {
  console.log(`[Bot] Runner lifetime (${process.env.RUNNER_LIFETIME_HOURS || 4.5}h) elapsed — shutting down`);
  process.exit(0);
}, lifetimeMs);

// ─── Start ────────────────────────────────────────────────────────────────────

startBot().catch((err) => {
  console.error('[Bot] Fatal startup error:', err);
  process.exit(1);
});
