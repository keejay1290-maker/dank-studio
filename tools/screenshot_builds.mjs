import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.DANK_URL || 'http://localhost:5174';
const OUT = 'tools/screenshots';
mkdirSync(OUT, { recursive: true });

// Build key → unique search term (unambiguous, matches actual label)
const BUILDS = [
  ['death_star','Death Star'],
  ['atat_walker','AT-AT'],
  ['tie_fighter','TIE Fighter'],
  ['xwing','X-Wing'],
  ['millennium_falcon','Millennium'],
  ['star_destroyer','Star Destroyer'],
  ['stargate_portal','Stargate'],
  ['tony_stark_tower','Stark Tower'],
  ['cyberpunk_nexus','Cyberpunk'],
  ['borg_cube','Borg Cube'],
  ['halo_installation','Halo'],
  ['saturn','Saturn'],
  ['uss_enterprise','Enterprise'],
  ['eiffel_tower','Eiffel'],
  ['taj_mahal','Taj Mahal'],
  ['colosseum','Colosseum'],
  ['pyramid_giza','Great Pyramid'],
  ['stonehenge','Stonehenge'],
  ['pentagram','Pentagram'],
  ['big_ben','Big Ben'],
  ['angkor_wat','Angkor'],
  ['parthenon','Parthenon'],
  ['arc_triomphe','Arc de Triomphe'],
  ['sydney_opera','Sydney'],
  ['cn_tower','CN Tower'],
  ['space_needle','Space Needle'],
  ['leaning_pisa','Pisa'],
  ['mont_saint_michel','Mont-Saint-Michel'],
  ['sagrada_familia','Sagrada'],
  ['chrysler_building','Chrysler'],
  ['tower_of_london','Tower of London'],
  ['great_wall','Great Wall'],
  ['alhambra_palace','Alhambra'],
  ['hagia_sophia','Hagia'],
  ['rivendell','Rivendell'],
  ['isengard','Isengard'],
  ['hogwarts','Hogwarts'],
  ['minas_tirith','Minas'],
  ['helms_deep','Deep'],
  ['the_wall_game_of_thrones','The Wall'],
  ['azkaban_prison','Azkaban'],
  ['eye_of_sauron','Sauron'],
  ['fortress_of_solitude','Solitude'],
  ['iron_throne','Iron Throne'],
  ['camelot','Camelot'],
  ['winterfell','Winterfell'],
  ['black_gate','Black Gate'],
  ['gondor_beacon','Gondor'],
  ['stormwind','Stormwind'],
  ['sky_fort','Sky Fort'],
  ['container_pyramid','Ziggurat'],
  ['container_drum','Drum Tower'],
  ['container_helix','Double Helix'],
  ['container_station','Space Station'],
  ['container_fortress','Container Fortress'],
  ['container_starport','Starport'],
  ['container_shantytown','Shantytown'],
  ['bunker_complex','Bunker Complex'],
  ['the_pentagon','The Pentagon'],
  ['star_fort','Star Fort'],
  ['arena_fort','Arena Fort'],
  ['gatehouse','Gatehouse'],
  ['normandy_bunkers','Normandy'],
  ['alcatraz_prison','Alcatraz'],
  ['aircraft_carrier','Carrier'],
  ['submarine','Submarine'],
  ['oil_rig','Oil Rig'],
  ['pirate_ship','Pirate'],
  ['bridge_truss','Cable-Stayed'],
  ['celtic_ring','Celtic'],
  ['dna_double','DNA'],
  ['amphitheater','Amphitheater'],
  ['roman_aqueduct','Aqueduct'],
  ['gothic_arch','Gothic Arch'],
  ['cylinder','Cylinder'],
  ['pyramid','Pyramid'],
  ['wall_line','Wall Line'],
  ['dyson_sphere','Dyson'],
  ['barad_dur','Barad'],
  ['mass_effect_citadel','Citadel'],
  // ── Added this session ────────────────────────────────────────
  ['container_barracks',   'Container Barracks'],
  ['container_arena',      'Container Arena'],
  ['container_bunker',     'Container Bunker'],
  ['container_watchtower', 'Container Watchtower'],
  ['container_compound',   'Container Compound'],
  ['dayz_castle',          'DayZ Authentic Castle'],
  ['dayz_bunker',          'DayZ Underground Bunker'],
];

const TARGET = process.argv[2]
  ? BUILDS.filter(([k]) => k === process.argv[2])
  : BUILDS;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 900 });

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

// Find the canvas for orbit drags
async function getCanvasBox() {
  const canvas = page.locator('canvas').first();
  return await canvas.boundingBox();
}

// Drag the canvas to orbit the camera
async function orbit(dx, dy) {
  const box = await getCanvasBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

// Zoom in by scrolling down over canvas
async function zoomIn(clicks = 5) {
  const box = await getCanvasBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < clicks; i++) {
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
}

for (const [key, label] of TARGET) {
  try {
    // Search and click
    const searchBox = page.locator('input[placeholder*="SEARCH"], input[placeholder*="Search"]');
    await searchBox.fill('');
    await page.waitForTimeout(100);
    await searchBox.fill(label);
    await page.waitForTimeout(400);

    const card = page.locator(`span.font-semibold, span.text-xs.font-semibold`).filter({ hasText: label });
    let clicked = false;
    if (await card.count() > 0) {
      await card.first().click();
      clicked = true;
    }

    if (!clicked) {
      console.error(`✗ ${key} — couldn't find "${label}"`);
      continue;
    }

    // Wait for AutoFrame to finish
    await page.waitForTimeout(2500);

    // Angle 1: default 3/4 view (AutoFrame sets this)
    await page.screenshot({ path: `${OUT}/${key}_a.png`, clip: { x: 200, y: 40, width: 820, height: 820 } });

    // Zoom in for closer detail shot
    await zoomIn(6);
    await page.screenshot({ path: `${OUT}/${key}_b_zoom.png`, clip: { x: 200, y: 40, width: 820, height: 820 } });

    // Angle 2: rotate ~120° horizontal
    await orbit(400, 0);
    await page.screenshot({ path: `${OUT}/${key}_c.png`, clip: { x: 200, y: 40, width: 820, height: 820 } });

    console.log(`✓ ${key}`);

    // Reset search for next
    await searchBox.fill('');
    await page.waitForTimeout(200);

  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`);
  }
}

await browser.close();
console.log(`\nDone — ${TARGET.length * 3} screenshots in ${OUT}/`);
