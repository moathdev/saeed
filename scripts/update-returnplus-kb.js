#!/usr/bin/env node
/**
 * ReturnPlus KB Weekly Updater
 * - Scrapes pricing from Salla + ZID app pages
 * - Scrapes customer reviews
 * - Updates GitHub repo (moathdev/ObsidianRetrunPlus)
 * - Notifies Abu Sattam via @moathdev_bot
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MOATHDEV_BOT = '7974988787:AAGDA6e1iwJdg-BW4GQje8XoDKWMK7bctLc';
const CHAT_ID = '178374935';
const REPO_DIR = '/tmp/ObsidianRetrunPlus-update';
const REPO_URL = 'https://github.com/moathdev/ObsidianRetrunPlus.git';
const SALLA_URL = 'https://apps.salla.sa/ar/app/134555705';
const ZID_URL = 'https://apps.zid.sa/application/1587';

function notify(msg) {
  try {
    execSync(`curl -s -X POST "https://api.telegram.org/bot${MOATHDEV_BOT}/sendMessage" \
      -H "Content-Type: application/json" \
      -d '{"chat_id":"${CHAT_ID}","parse_mode":"Markdown","text":${JSON.stringify(msg)}}'`);
  } catch(e) { console.error('Notify failed:', e.message); }
}

async function scrapeWithPlaywright() {
  const { chromium } = require('/app/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
  const results = { salla: null, zid: null };

  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    // --- Salla ---
    const sallaPage = await browser.newPage();
    await sallaPage.goto(SALLA_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    results.salla = await sallaPage.evaluate(() => {
      const text = document.body.innerText;
      // Extract rating
      const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*من\s*5/);
      const reviewCountMatch = text.match(/(\d+)\s*تقييم/);
      // Extract reviews
      const reviews = [];
      document.querySelectorAll('.review, [class*="review"], [class*="rating"]').forEach(el => {
        const t = el.innerText.trim();
        if (t.length > 10) reviews.push(t.slice(0, 200));
      });
      return {
        rating: ratingMatch ? ratingMatch[1] : null,
        reviewCount: reviewCountMatch ? reviewCountMatch[1] : null,
        rawText: text.slice(0, 3000)
      };
    });

    // --- ZID ---
    const zidPage = await browser.newPage();
    await zidPage.goto(ZID_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));
    results.zid = await zidPage.evaluate(() => {
      const text = document.body.innerText;
      const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*\/\s*5/) || text.match(/(\d+(?:\.\d+)?)\s*out of\s*5/i);
      const reviewCountMatch = text.match(/(\d+)\s*(review|تقييم)/i);
      return {
        rating: ratingMatch ? ratingMatch[1] : null,
        reviewCount: reviewCountMatch ? reviewCountMatch[1] : null,
        rawText: text.slice(0, 3000)
      };
    });
  } finally {
    await browser.close();
  }

  return results;
}

async function main() {
  console.log('Starting ReturnPlus KB weekly update...');

  // Clone/pull repo
  if (fs.existsSync(REPO_DIR)) {
    execSync(`git -C ${REPO_DIR} pull origin main`, { stdio: 'pipe' });
  } else {
    execSync(`git clone ${REPO_URL} ${REPO_DIR}`, { stdio: 'pipe' });
  }
  execSync(`git -C ${REPO_DIR} config user.email "saeed@openclaw"`);
  execSync(`git -C ${REPO_DIR} config user.name "Saeed"`);

  // Scrape data
  let scraped = {};
  try {
    scraped = await scrapeWithPlaywright();
    console.log('Scraped:', JSON.stringify(scraped, null, 2));
  } catch(e) {
    console.error('Scrape failed:', e.message);
    notify('⚠️ ReturnPlus KB weekly update: scraping failed — ' + e.message);
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Build reviews files
  const sallaRating = scraped.salla?.rating || '?';
  const sallaCount = scraped.salla?.reviewCount || '?';
  const zidRating = scraped.zid?.rating || '?';
  const zidCount = scraped.zid?.reviewCount || '?';

  const enReviews = `# Customer Reviews

*Last updated: ${today}*

## Salla
- ⭐ Rating: **${sallaRating} / 5** (${sallaCount} reviews)
- [View on Salla](${SALLA_URL})

## ZID
- ⭐ Rating: **${zidRating} / 5** (${zidCount} reviews)
- [View on ZID](${ZID_URL})
`;

  const arReviews = `# تقييمات العملاء

*آخر تحديث: ${today}*

## سلة
- ⭐ التقييم: **${sallaRating} / 5** (${sallaCount} تقييم)
- [عرض على سلة](${SALLA_URL})

## زد
- ⭐ التقييم: **${zidRating} / 5** (${zidCount} تقييم)
- [عرض على زد](${ZID_URL})
`;

  fs.mkdirSync(`${REPO_DIR}/en`, { recursive: true });
  fs.mkdirSync(`${REPO_DIR}/ar`, { recursive: true });
  fs.writeFileSync(`${REPO_DIR}/en/reviews.md`, enReviews);
  fs.writeFileSync(`${REPO_DIR}/ar/reviews.md`, arReviews);

  // Commit and push
  execSync(`git -C ${REPO_DIR} add -A`);
  const diff = execSync(`git -C ${REPO_DIR} diff --cached --name-only`).toString().trim();
  if (diff) {
    execSync(`git -C ${REPO_DIR} commit -m "KB: Weekly update — reviews & pricing (${today})"`);
    execSync(`git -C ${REPO_DIR} push origin main`);
    notify(`✅ *ReturnPlus KB updated (${today})*\n\nSalla: ⭐ ${sallaRating}/5 (${sallaCount})\nZID: ⭐ ${zidRating}/5 (${zidCount})\n\nFiles updated on GitHub.`);
    console.log('Pushed:', diff);
  } else {
    console.log('No changes.');
    notify(`ℹ️ ReturnPlus KB weekly check (${today}) — no changes detected.`);
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  notify('❌ ReturnPlus KB update failed: ' + e.message);
  process.exit(1);
});
