// Focused screenshot pass — only the builds I've added or modified this session.
// Reuses the same Playwright orbit/zoom logic as screenshot_builds.mjs.

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.DANK_URL || 'http://localhost:5174';
const OUT  = 'tools/screenshots_focus';
mkdirSync(OUT, { recursive: true });

// [build_key, search_label]  — labels match how they show in the UI
const TARGET = [
  // ── Phase 5/6: builds I added this session ──────────────────
  ['container_barracks',   'Container Barracks'],
  ['container_arena',      'Container Arena'],
  ['container_bunker',     'Container Bunker'],
  ['container_watchtower', 'Container Watchtower'],
  ['container_compound',   'Container Compound'],
  ['dayz_castle',          'DayZ Authentic Castle'],
  ['dayz_bunker',          'DayZ Underground Bunker'],
  // ── Validation flagged earlier as low-scoring ──────────────
  ['tony_stark_tower',     'Stark Tower'],
  ['wall_line',            'Wall Line'],
  ['container_pyramid',    'Container Ziggurat'],
  ['container_shantytown', 'Shantytown'],
  // ── Sampling for sanity ────────────────────────────────────
  ['eiffel_tower',         'Eiffel'],
  ['colosseum',            'Colosseum'],
  ['container_fortress',   'Container Fortress'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

async function getCanvasBox() {
  const canvas = page.locator('canvas').first();
  return await canvas.boundingBox();
}
async function orbit(dx, dy) {
  const box = await getCanvasBox(); if (!box) return;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}
async function zoomIn(clicks = 5) {
  const box = await getCanvasBox(); if (!box) return;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < clicks; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(40); }
  await page.waitForTimeout(300);
}

for (const [key, label] of TARGET) {
  try {
    const searchBox = page.locator('input[placeholder*="SEARCH"]');
    await searchBox.fill('');
    await page.waitForTimeout(100);
    await searchBox.fill(label);
    await page.waitForTimeout(400);

    const card = page.locator(`span.font-semibold, span.text-xs.font-semibold`).filter({ hasText: label });
    if (await card.count() === 0) { console.error(`✗ ${key} — no match for "${label}"`); continue; }
    await card.first().click();
    await page.waitForTimeout(2500);

    await page.screenshot({ path: `${OUT}/${key}_a.png`, clip: { x: 200, y: 40, width: 820, height: 820 } });
    await zoomIn(6);
    await page.screenshot({ path: `${OUT}/${key}_b_zoom.png`, clip: { x: 200, y: 40, width: 820, height: 820 } });
    await orbit(400, 0);
    await page.screenshot({ path: `${OUT}/${key}_c.png`, clip: { x: 200, y: 40, width: 820, height: 820 } });
    console.log(`✓ ${key}`);
  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`);
  }
}

await browser.close();
console.log(`Done — ${TARGET.length * 3} screenshots in ${OUT}/`);
