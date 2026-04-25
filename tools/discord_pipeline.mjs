import fs from 'fs';
import path from 'path';

const ROOT = process.argv[2] || path.join(process.env.USERPROFILE, 'Desktop', 'dayz community');

// ────────────────────────────────────────────────────────────────
// KEYWORDS & DICTIONARIES
// ────────────────────────────────────────────────────────────────
const CATEGORIES = [
    ['overhauls',       ['overhaul', 'overhual', 'snowverhaul', 'rework', 'revamp', 'rebuild', 'remod', 'remake']],
    ['traders',         ['trader', 'shop', 'store', 'superstore', 'megastore', 'gunstore', 'clothshop', 'armory', 'armoury', 'showroom', 'tireshop', 'dealership', 'vending', 'dealer', 'growshop', 'mall', 'blackmarket', 'black_market']],
    ['loadouts',        ['loadout', 'loady', 'loadycustom', 'freshspawn', 'freshie', 'medic', 'soldier', 'swat', 'suit', 'outfit', 'gear', 'starter', 'kit', 'darryl', 'dixon', 'fireman', 'firefighter', 'fisherman', 'cowboy', 'cop', 'doctor', 'nurse', 'bandit', 'stalker', 'ranger', 'sniper', 'pirate', 'spaceman', 'batman', 'survivor', 'casual', 'chedaki', 'ww2', 'expert', 'beginner', 'nbc', 'nvg', 'mosin', 'punk', 'personaje', 'clothes', 'clothing']],
    ['teleporters',     ['teleport', 'transit', 'tp_', 'tp1', 'tp2', 'tosafe', 'totrader', 'tradertobase']],
    ['ufc_fighting',    ['fight', 'boxing', 'ufc', 'mma', 'colosseum', 'fightclub', 'fist', 'sumo', 'wrestling', 'ring']],
    ['racing',          ['race', 'racing', 'touge', 'drift', 'offroad', 'figure8', 'rally', 'circuit', 'racetrack', 'bumpercars', 'dodgem', 'derby', 'kart']],
    ['pvp_events',      ['pvp', 'paintball', 'koth', 'deathmatch', 'squidgame', 'captureflag', 'capture', 'arena', 'maze', 'gulag']],
    ['bunkers',         ['bunker', 'underground', 'tunnel', 'cfgunderground', 'sewer', 'lab', 'facility']],
    ['air_drops',       ['airdrop', 'plane_crash', 'traincrash', 'c130', 'air_drop']],
    ['faction_bases',   ['faction', 'clan']],
    ['missions_events', ['dynamic_mission', 'dynamic_', 'mission_', 'quest', 'evacuation', 'treasure']],
    ['npc_ai',          ['npc', 'zombie_territor', 'wolf_territor', 'bear_territor', 'horde', 'aipatrol', 'aiguard', 'custom_zmb', 'cannibals', 'reindeer_territor', 'alien', 'monster', 'boss']],
    ['seasonal',        ['haunted', 'halloween', 'witch', 'horror', 'creepy', 'spooky', 'ghost', 'pumpkin', 'graveyard', 'grave', 'tombstone', 'cemetery', 'xmas', 'christmas', 'santa', 'easter', 'newyear']],
    ['winter_maps',     ['winterchernarus', 'winter_cher', 'snow']],
    ['oil_rigs',        ['oilrig', 'oil_rig', 'sea_platform', 'oil_platform']],
    ['caves',           ['cave', 'skelcave', 'cliffhole', 'grotte']],
    ['ships',           ['shipwreck', 'cargoship', 'shipment', 'boat', 'carrier']],
    ['treehouses',      ['treehouse', 'tree_house']],
    ['houses_cabins',   ['house', 'cabin', 'hut', 'shack', 'home', 'retreat', 'shelter', 'apartment', 'hotel', 'cottage', 'ranch', 'camp', 'tent', 'biwop', 'motel']],
    ['bases',           ['base', 'shed', 'garage', 'fortress', 'mansion', 'flagstaff', 'garden', 'greenhouse', 'waterbase', 'solobase', 'hideout', 'outpost', 'compound', 'settlement', 'camp']],
    ['castles',         ['castle', 'wendigo', 'krona', 'ruins']],
    ['safezones',       ['safezone', 'safe_zone', 'sz_']],
    ['vehicles',        ['vehicle', 'truck', 'heli', 'uboat', 'submarine', 'tank', 'trailer', 'aircraft', 'car', 'v3s', 'bus', 'lada', 'gunter', 'sarka', 'olga']],
    ['building_supplies',['pallet', 'supply', 'buildpallet', 'buildsup', 'buildtable', 'builderkit', 'builder', 'crate', 'container', 'locker', 'template', 'rack', 'wooden', 'logs', 'planks']],
    ['walls_structures',['wall', 'fence', 'gate', 'ramp', 'stairway', 'spiral', 'barricade', 'fort', 'trench', 'perimetre', 'tower', 'watchtower', 'bridge']],
    ['military',        ['military', 'milbase', 'barracks', 'checkpoint', 'militia', 'zonemili', 'police', 'tisy', 'nwaf', 'mb_']],
    ['loot_configs',    ['loot', 'itemtable', 'economy', 'types', 'events', 'globals', 'spawnabletypes', 'cfgeconomy']],
    ['weapons',         ['weapon', 'gun', 'ammo', 'grenade', 'explosive', 'rifle', 'pistol', 'akm', 'm4a1', 'svd', 'vss', 'mosin']],
    ['server_config',   ['cfggameplay', 'cfgeffect', 'cfgspawn', 'cfgevent', 'cfgplayer', 'cfgrandom', 'cfglimit', 'cfgignore', 'cfgweather', 'cfgenvironment', 'mapgroup', 'messages', 'spawn', 'weather', 'wipelist', 'init.c']],
    ['other_configs',   []],
];

const CHERNARUS_TOWNS = [
    'balota', 'belaya', 'berezhki', 'berezino', 'berenzino', 'berez', 'bogatyrka', 'bor', 'chernaya', 'cherno', 'chernogorsk',
    'dichina', 'dobroye', 'dolina', 'drozhino', 'dubovo', 'dubrovka', 'elektro', 'elektrozavodsk', 'electo', 'eletro',
    'golova', 'gorka', 'greenmtn', 'greenmountain', 'gm_', 'grishino', 'guglovo', 'gvozdno',
    'kabanino', 'kalinovka', 'kamenka', 'kamensk', 'kamysh', 'kamy', 'kami', 'karmanovka', 'khelm',
    'klyuch', 'komarovo', 'kozlovka', 'krasno', 'krasnostav', 'krasnoye', 'krona', 'kumyrna', 'lopatino', 'mogilevka', 'msta', 'myshkino',
    'nadezhdino', 'nagornoye', 'nizhnee', 'nizhnoye', 'nizhney', 'novaya', 'novodmitrovsk', 'novod', 'novoselki', 'novy',
    'olsha', 'orlovets', 'pavlovo', 'pogorevka', 'polesovo', 'polyana', 'prigorod', 'pulkovo', 'pusta', 'pustoshka',
    'ratnoye', 'ratnoe', 'rifi', 'rify', 'rogovo', 'rog', 'shakovka', 'sinystok', 'skalisty', 'skalsky', 'solnechniy', 'solnich', 'sosnovka',
    'staroye', 'stary', 'storozh', 'svergino', 'svet', 'svetlojar', 'tisy', 'topolniki', 'tulga', 'turovo', 'trikresta', 'tri_kresta',
    'vavilovo', 'veresnik', 'verkhnaya', 'voron', 'vybor', 'vyshnoye', 'vysotovo', 'zabolotye', 'zaprudnoye', 'zeleno', 'zelenogorsk', 'zenit', 'zolotar', 'zub', 'zvir',
    'nwaf', 'neaf', 'neaaf', 'swaf', 'vmc', 'altar', 'devils', 'devil', 'blacklake', 'black_lake', 'plotina',
    'nightclub', 'pub', 'bar', 'grill', 'restaurant', 'motel', 'quarry', 'nuclear', 'nuke', 'powerplant', 'pyramid', 'stonehenge',
    'quantico', 'parkour', 'skyline', 'highway', 'riverdell', 'woodbury', 'shire', 'radio', 'radiostation', 'fuel', 'fuelstation', 'gas_station',
    'science', 'research', 'facility', 'experiment', 'vault', 'museum', 'ocean', 'pier', 'windpower', 'dam',
    'bridge', 'village', 'city', 'town', 'dock', 'port', 'prison', 'island', 'resort', 'harbor', 'metro', 'airport', 'airfield', 'factory', 'industrial', 'hospital', 'school', 'church', 'zoo',
];

const LIVONIA_KEYWORDS = ['livonia', 'enoch', 'liv_', '_liv', 'adamow', 'bielawa', 'borek', 'brena', 'dolnik', 'drewniki', 'gieraltow', 'gliniska', 'grabin', 'huta', 'kanopi', 'karlin', 'kolembrody', 'konopki', 'kulno', 'lembork', 'lipina', 'lukow', 'muratyn', 'nadbor', 'nidek', 'olszanka', 'piequo', 'potoki', 'radacz', 'radunin', 'roztoka', 'sarnowek', 'sitnik', 'sobotka', 'tarnow', 'topolin', 'wrzeszcz', 'widok', 'zalesie', 'zapadlisko', 'kopa', 'przystup'];
const SAKHAL_KEYWORDS = ['sakhal', 'frostline', 'skl_', 'petropavlovsk', 'severomorsk', 'aniva', 'nogovo', 'rudnogorsk', 'bolotnoye', 'dolinovka', 'dudino', 'evai', 'goriachevo', 'kekra', 'lesogorovka', 'matrosovo', 'neran', 'orlovo', 'podgornoye', 'rybnoye', 'shumnoye', 'sovetskoye', 'taranay', 'tikhoye', 'tugur', 'tumanovo', 'vajkovo', 'vostok', 'vysokoe', 'yasnomorsk', 'yuzhnoye', 'zhupanovo', 'wahtap', 'swahtap', 'ledanoj', 'ketoj', 'mrak', 'sachalsky', 'solisko', 'tungar', 'urup', 'utes', 'utichy', 'uzhki', 'elizarovo'];
const CHERNARUS_OVERRIDE = ['chernarus', 'cherno', 'cherna', 'elektro', 'zeleno', 'stary', 'novy', 'gorka', 'tisy', 'krasno', 'vybor', 'svet', 'kamensk', 'pavlovo', 'berezino', 'balota', 'nwaf', 'neaf', 'altar'];
const JUNK = ['test', 'test_1', 'test2', 'testing', 'unknown', 'nothing', 'notworking', 'problem', 'readme', 'ssss', 'xxx', 'random_shit', 'workingtest', 'proxy_test', 'smokeringtest', 'xmlvalidator', 'xml_g_-_code'];

const isBennett = (name) => name.toLowerCase().startsWith('bennett') || name.toLowerCase().startsWith('bennet');
const norm = (s) => s.toLowerCase().replace(/[-_]/g, '');

const icons = {
    air_drops: '🪂', bases: '🏗️', bennetts_builds: '🔧', building_supplies: '📦', bunkers: '🕳️', castles: '🏰', caves: '⛰️', decorations: '🎄', faction_bases: '⚔️',
    houses_cabins: '🏠', junk_test: '🗑️', livonia: '🗺️', loadouts: '🎽', loot_configs: '💰', military: '🎖️', missions_events: '⚡', npc_ai: '🧟',
    oil_rigs: '🛢️', other_configs: '📁', overhauls: '🔄', points_of_interest: '📍', pvp_events: '🎯', racing: '🏁', safezones: '🛡️', sakhal: '❄️',
    seasonal: '🎃', server_config: '⚙️', ships: '🚢', teleporters: '🌀', traders: '🛒', treehouses: '🌳', ufc_fighting: '🥊', vehicles: '🚗',
    walls_structures: '🧱', weapons: '🔫', winter_maps: '🌨️',
};

// ────────────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────────────
const moveRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
        const s = path.join(src, item); const d = path.join(dest, item);
        try {
            if (fs.statSync(s).isDirectory()) moveRecursive(s, d);
            else { if (!fs.existsSync(d)) fs.renameSync(s, d); else fs.unlinkSync(s); }
        } catch(e){}
    }
    try { fs.rmdirSync(src); } catch(e){}
};

const sweepCleanEmpty = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir)) {
        const p = path.join(dir, item);
        try { 
            if (fs.statSync(p).isDirectory()) { 
                sweepCleanEmpty(p); 
                try { if (fs.readdirSync(p).length === 0) fs.rmdirSync(p); } catch(e){} 
            } 
        } catch(e){}
    }
};

const detectIdealRelPath = (projName) => {
    let cat = 'other_configs';
    let map = null;
    
    // Keyword match
    for (const [c, keywords] of CATEGORIES) {
        if (keywords.some(kw => norm(projName).includes(norm(kw)))) { cat = c; break; }
    }
    
    // Junk Override
    if (JUNK.some(j => norm(projName) === norm(j))) cat = 'junk_test';
    
    // Bennett Override
    if (isBennett(projName)) cat = 'bennetts_builds';
    
    // Town Cross-Reference (promote from other_configs to POI)
    if (cat === 'other_configs' && CHERNARUS_TOWNS.some(t => norm(projName).includes(norm(t)))) {
        cat = 'points_of_interest';
    }
    
    // Map Detection
    let hasChern = CHERNARUS_OVERRIDE.some(kw => norm(projName).includes(norm(kw)));
    let isLiv = LIVONIA_KEYWORDS.some(kw => norm(projName).includes(norm(kw)));
    let isSak = SAKHAL_KEYWORDS.some(kw => norm(projName).includes(norm(kw)));
    
    if (!hasChern) {
        if (isLiv) map = 'livonia';
        if (isSak) map = 'sakhal';
    }

    if (map) return path.join(map, cat, projName);
    return path.join(cat, projName);
};

// ────────────────────────────────────────────────────────────────
// MAIN PIPELINE
// ────────────────────────────────────────────────────────────────
console.log(`\n=====================================================================`);
console.log(`🚀 STARTING UNIFIED DISCORD PIPELINE: CLEAN, GATHER, SORT, INVENTORY`);
console.log(`=====================================================================\n`);

// PASS 1: XML CLEANUP
console.log(`[1] Cleaning orphaned XML folders...`);
let removedXmlCounter = 0;
const cleanXMLs = (dir) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    let isLeaf = true;
    for (const item of items) {
        try { if (fs.statSync(path.join(dir, item)).isDirectory()) { isLeaf = false; break; } } catch (e) {}
    }
    if (isLeaf && items.length > 0) {
        const hasXml = items.some(f => f.toLowerCase().endsWith('.xml'));
        const hasJson = items.some(f => f.toLowerCase().endsWith('.json') || f.toLowerCase().endsWith('.dze') || f.toLowerCase().endsWith('.c'));
        if (hasXml && !hasJson) {
            for (const f of items) fs.unlinkSync(path.join(dir, f));
            try { fs.rmdirSync(dir); } catch(e) {}
            removedXmlCounter++;
        }
    } else if (!isLeaf) {
        for (const item of items) {
            const subPath = path.join(dir, item);
            try { if (fs.statSync(subPath).isDirectory()) cleanXMLs(subPath); } catch(e) {}
        }
    }
};
cleanXMLs(ROOT);
console.log(`    -> Removed ${removedXmlCounter} useless XML-only folders.\n`);


// PASS 2 & 3: FLAT GATHER & DEEP SORT
console.log(`[2 & 3] Gathering and completely re-sorting all projects...`);
let allProjects = [];

const gatherAllLeafs = (dir, depth = 0) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    
    let subDirs = [];
    let files = [];
    
    for (const item of items) {
        const full = path.join(dir, item);
        try {
            if (fs.statSync(full).isDirectory()) subDirs.push({ name: item, path: full });
            else files.push({ name: item, path: full });
        } catch(e) {}
    }
    
    // If it has files and no subdirectories acting as categories, it's a leaf
    // If it's the ROOT, don't treat it as a leaf, though loose files shouldn't be here
    if (depth > 0 && subDirs.length === 0 && files.length > 0) {
        allProjects.push({
            name: path.basename(dir),
            currentPath: dir
        });
        return;
    }
    
    // If it has a mix of files and subfolders, the loose files in the parent folder might be projects themselves!
    if (depth > 0 && files.length > 0 && subDirs.length > 0) {
         allProjects.push({
            name: path.basename(dir) + '_loose',
            currentPath: dir,
            isPartial: true
        });
    }

    for (const sub of subDirs) {
        gatherAllLeafs(sub.path, depth + 1);
    }
};

gatherAllLeafs(ROOT);
console.log(`    -> Gathered ${allProjects.length} leaf project folders.`);

let movedCount = 0;
for (const proj of allProjects) {
    if(proj.isPartial) continue; // safety fallback for weird structures
    
    const idealRel = detectIdealRelPath(proj.name);
    const idealAbs = path.join(ROOT, idealRel);
    
    // If its current absolute path is different than where it should be, move it!
    if (proj.currentPath !== idealAbs) {
        moveRecursive(proj.currentPath, idealAbs);
        movedCount++;
    }
}
console.log(`    -> Reclassified and moved ${movedCount} projects to better locations.\n`);


// PASS 4: PRUNE EMPTY FOLDERS
console.log(`[4] Pruning empty directory structures...`);
sweepCleanEmpty(ROOT);
console.log(`    -> Prune complete.\n`);


// PASS 5: MASTER INVENTORY REPORT
console.log(`[5] Generating final inventory...`);
let totalFolders = 0, totalFiles = 0;
const cats = [];

for (const cat of fs.readdirSync(ROOT).filter(f => { try { return fs.statSync(path.join(ROOT, f)).isDirectory(); } catch(e) { return false; } }).sort()) {
    const catPath = path.join(ROOT, cat);
    const items = fs.readdirSync(catPath);
    const folders = items.filter(f => { try { return fs.statSync(path.join(catPath, f)).isDirectory(); } catch(e) { return false; } }).length;
    
    let fileCount = 0;
    const countFiles = (dir) => {
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            try { if (fs.statSync(p).isDirectory()) countFiles(p); else fileCount++; } catch(e){}
        }
    };
    countFiles(catPath);
    
    cats.push({ name: cat, folders, files: fileCount });
    totalFolders += folders;
    totalFiles += fileCount;
}

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║        🎮 DAYZ COMMUNITY MOD LIBRARY 🎮        ║');
console.log('╠══════════════════════════════════════════════════╣');
console.log(`║  📂 ${String(totalFolders).padStart(5)} project folders                     ║`);
console.log(`║  📄 ${String(totalFiles).padStart(5)} total files (JSON/XML/images)        ║`);
console.log(`║  🏷️  ${String(cats.length).padStart(5)} categories                           ║`);
console.log('╠══════════════════════════════════════════════════╣');

for (const c of cats.sort((a,b) => b.folders - a.folders)) {
    const icon = icons[c.name] || '📂';
    console.log(`║  ${icon} ${c.name.padEnd(22)} ${String(c.folders).padStart(4)} folders ${String(c.files).padStart(5)} files ║`);
}
console.log('╚══════════════════════════════════════════════════╝\n');
