/**
 * screenshot_tabs.mjs
 * Captures every UI tab + HelpOverlay in Dank Studio.
 * Usage: node tools/screenshot_tabs.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const BASE = process.env.DANK_URL || 'http://localhost:5174';
const OUT = resolve('screenshots/audit_upgrade');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

console.log(`Opening ${BASE} …`);
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Click a top-bar / sidebar tab by its visible text label. */
async function clickTab(label) {
  // Try button with exact text first, then partial text
  const btn = page.getByRole('button', { name: label, exact: true });
  const count = await btn.count();
  if (count > 0) {
    await btn.first().click();
  } else {
    // Fallback: any element whose text contains the label
    await page.locator(`text="${label}"`).first().click();
  }
  await page.waitForTimeout(1200);
}

/** Take a full-window screenshot. */
async function shot(filename) {
  const dest = `${OUT}/${filename}`;
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`  saved → ${dest}`);
  return dest;
}

// ---------------------------------------------------------------------------
// Tab map  [output filename, label to click]
// ---------------------------------------------------------------------------
const TABS = [
  ['tab_library.png',   'Library'],
  ['tab_draw.png',      'Draw'],
  ['tab_panel.png',     'Panel'],
  ['tab_community.png', 'Community'],
  ['tab_npc.png',       'NPC'],
  ['tab_loadout.png',   'Loadout'],
  ['tab_airdrop.png',   'Airdrop'],
  ['tab_console.png',   'Console'],
];

const saved = [];
const failed = [];

// ---------------------------------------------------------------------------
// Shoot each tab
// ---------------------------------------------------------------------------
for (const [filename, label] of TABS) {
  try {
    console.log(`\n[${label}]`);
    await clickTab(label);
    const dest = await shot(filename);
    saved.push(dest);
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    failed.push(filename);
  }
}

// ---------------------------------------------------------------------------
// HelpOverlay — click the "?" button
// ---------------------------------------------------------------------------
console.log('\n[HelpOverlay]');
try {
  // Try several selectors for the help button
  const selectors = [
    'button[aria-label="Help"]',
    'button[title="Help"]',
    'button:has-text("?")',
    '[data-testid="help-button"]',
  ];
  let clicked = false;
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count() > 0) {
      await el.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    // Last resort: find a button whose text is exactly "?"
    await page.locator('button').filter({ hasText: /^\?$/ }).first().click();
  }
  await page.waitForTimeout(1000);
  const dest = await shot('tab_help.png');
  saved.push(dest);
} catch (err) {
  console.error(`  FAILED: ${err.message}`);
  failed.push('tab_help.png');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
await browser.close();

console.log('\n========== SUMMARY ==========');
console.log(`Saved  (${saved.length}): ${saved.map(p => p.split(/[\\/]/).pop()).join(', ')}`);
if (failed.length) {
  console.log(`Failed (${failed.length}): ${failed.join(', ')}`);
}
