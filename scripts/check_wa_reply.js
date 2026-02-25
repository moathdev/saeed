/**
 * check_wa_reply.js
 * يتحقق من آخر رسالة من الرقم token_xxxx
 * وإذا كان هناك رد جديد، يبلّغ أبو سطام عبر Telegram
 */

const fs = require('fs');
const https = require('https');

const CMD_FILE = '/tmp/wa_cmd.json';
const RESULT_FILE = '/tmp/wa_result.json';
const STATE_FILE = '/tmp/wa_reply_check_state.json';

const TARGET_CHAT = 'token_xxxx';
const TG_BOT_TOKEN = 'token_xxxx';
const TG_CHAT_ID = 'token_xxxx';

function sendTelegram(text) {
    return new Promise((resolve) => {
        const body = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' });
        const opts = {
            hostname: 'api.telegram.org',
            path: `/bot${TG_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        };
        const req = https.request(opts, res => { res.on('data', () => {}); res.on('end', resolve); });
        req.on('error', () => resolve());
        req.write(body);
        req.end();
    });
}

function waitForResult(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (fs.existsSync(RESULT_FILE)) {
                clearInterval(interval);
                try {
                    const data = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
                    fs.unlinkSync(RESULT_FILE);
                    resolve(data);
                } catch (e) { reject(e); }
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                reject(new Error('Timeout waiting for result'));
            }
        }, 500);
    });
}

async function main() {
    // Load last seen timestamp
    let lastSeenTs = 0;
    if (fs.existsSync(STATE_FILE)) {
        try {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            lastSeenTs = state.lastSeenTs || 0;
        } catch (e) {}
    }

    // Wait if CMD_FILE already exists (another command pending)
    let waited = 0;
    while (fs.existsSync(CMD_FILE) && waited < 10000) {
        await new Promise(r => setTimeout(r, 500));
        waited += 500;
    }

    // Remove stale result file
    if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);

    // Send get_messages command
    fs.writeFileSync(CMD_FILE, JSON.stringify({
        action: 'get_messages',
        chatId: TARGET_CHAT,
        limit: 5
    }));

    let result;
    try {
        result = await waitForResult();
    } catch (e) {
        console.error('Timeout:', e.message);
        process.exit(1);
    }

    if (!result.ok || !result.data) {
        console.log('No data or error:', result.error);
        process.exit(0);
    }

    const messages = result.data;
    // Filter: only messages from client (not me) after lastSeenTs
    const newReplies = messages.filter(m => {
        const ts = new Date(m.time).getTime();
        return m.from !== 'me' && ts > lastSeenTs;
    });

    if (newReplies.length === 0) {
        console.log('No new replies yet.');
        process.exit(0);
    }

    // Update state with latest timestamp
    const latestTs = Math.max(...newReplies.map(m => new Date(m.time).getTime()));
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastSeenTs: latestTs }));

    // Notify Abu Sattam
    const replyTexts = newReplies.map(m => `• ${m.body}`).join('\n');
    const msg = `📱 *رد جديد على واتساب!*\nمن: +token_xxxx\n\n${replyTexts}`;
    await sendTelegram(msg);
    console.log('Notification sent!');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
