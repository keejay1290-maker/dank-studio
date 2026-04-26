import fs from 'fs';
import path from 'path';

const ROOT = process.argv[2] || path.join(process.env.USERPROFILE, 'Desktop', 'dayz community');

// ────────────────────────────────────────────────────────────────
// KEYWORDS & DICTIONARIES
// ────────────────────────────────────────────────────────────────
const CATEGORIES = [
    ['loadouts',        ['loadout', 'loadout_', 'loadout-', 'load out', 'kit', 'starter', 'freshspawn', 'freshie', 'loady', 'suitcase', 'outfit', 'personaje', 'survivant', 'survivor', 'surv_', 'specialist', 'soldier', 'swat', 'ww2', 'cedaki', 'chedaki', 'casual', 'cop', 'cowboy', 'doctor', 'fisherman', 'doctor', 'negan', 'walking_dead', 'twd', 'medic', 'ghillie', 'winter_soldier', 'winter_survivor', 'whitepartysuit', 'drip', 'hunter', 'marine', 'knight', 'mime', 'mummy', 'male', 'female', 'surv_']],
    ['loot_configs',    ['loot', 'itemtable', 'economy', 'types', 'events', 'globals', 'spawnabletypes', 'cfgeconomy', 'table', 'config', 'cfg_', 'stash', 'card', 'keycard', 'punchcard', 'punchedcard', 'items_']],
    ['signs',           ['sign', 'signs', 'billboard', 'signage', 'banner', 'poster', 'plaque', 'notice']],
    ['flags',           ['flag', 'factionflag', 'clanflag', 'baseflag']],
    ['building_supplies',['pallet', 'supply', 'buildpallet', 'buildsup', 'buildtable', 'builderkit', 'builder', 'build', 'building', 'builds', 'crate', 'container', 'locker', 'template', 'rack', 'wooden', 'logs', 'planks', 'metal_sheets', 'supplies', 'cont-tiers', 'materials', 'material_truck', 'box', 'boxes']],
    ['explosives_boom', ['boom', 'eviction', 'explosive', 'grenade', 'm79', 'launcher', 'satchel', 'c4', 'detonator', 'mine', 'claymore', 'rocket', 'tnt', 'missile', 'frag', 'flashbang', 'smoke_grenade', 'landmine', 'beartrap']],
    ['clothing_gear',   ['clothes', 'clothing', 'vest', 'backpack', 'helmet', 'mask', 'gear', 'shirt', 'pants', 'boots', 'shoes', 'gloves', 'jacket', 'coat', 'hat', 'cap', 'balaclava', 'ghillie', 'ベルト', 'holster', 'uniform']],
    ['weapons',         ['weapon', 'gun', 'rifle', 'pistol', 'akm', 'm4a1', 'svd', 'vss', 'mosin', 'mag_', 'clip_', 'ammo', 'firearm', 'shotgun', 'sniper_rifle', 'submachine', 'dmr', 'm14', 'aug', 'famas', 'crossbow', 'izh', 'm70', 'fal', 'lar_']],
    ['food_drinks',     ['food', 'drink', 'cola', 'soda', 'can_', 'fruit', 'vegetable', 'meat', 'apple', 'pear', 'pumpkin', 'snack', 'water_bottle', 'canteen', 'cooking', 'kitchen_pot', 'rice', 'cereal', 'honey', 'boar', 'deer', 'steak', 'choco', 'water_truck']],
    ['traders',         ['trader', 'shop', 'store', 'superstore', 'megastore', 'gunstore', 'clothshop', 'armory', 'armoury', 'showroom', 'tireshop', 'dealership', 'vending', 'dealer', 'growshop', 'mall', 'blackmarket', 'black_market', 'market', 'tradepost', 'carstand', 'car_stand', 'mechanic']],
    ['hospitals_medical',['hospital', 'medical', 'clinic', 'pharmacy', 'dentist', 'medcenter', 'medstation', 'nurse', 'ambulance', 'medic']],
    ['police_stations', ['police', 'sheriff', 'pd_', 'precinct', 'jail', 'prison', 'constabulary', 'police_station']],
    ['banks_economy',   ['bank', 'atm', 'vault', 'gold', 'money', 'bitcoin']],
    ['teleporters',     ['teleport', 'transit', 'tp_', 'tp1', 'tp2', 'tosafe', 'totrader', 'tradertobase', 'fast_travel', 'fasttravel', 'telespawn']],
    ['ufc_fighting',    ['fight', 'boxing', 'ufc', 'mma', 'colosseum', 'fightclub', 'fist', 'sumo', 'wrestling', 'ring']],
    ['racing',          ['race', 'racing', 'touge', 'drift', 'offroad', 'figure8', 'rally', 'circuit', 'racetrack', 'bumpercars', 'dodgem', 'derby', 'kart', 'jump', 'ramp']],
    ['pvp_events',      ['pvp', 'paintball', 'koth', 'deathmatch', 'squidgame', 'captureflag', 'capture', 'arena', 'maze', 'gulag', 'laser_tag', 'lasertag', 'cqb', 'tribunal', 'last_stand']],
    ['bunkers',         ['bunker', 'underground', 'tunnel', 'cfgunderground', 'sewer', 'lab', 'facility', 'vault']],
    ['air_drops',       ['airdrop', 'plane_crash', 'traincrash', 'c130', 'air_drop', 'crash_site']],
    ['faction_bases',   ['faction', 'clan', 'hq_', 'militia', 'battalion', 'hideout', 'milsim', 'milisim']],
    ['missions_events', ['dynamic_mission', 'dynamic_', 'mission_', 'quest', 'evacuation', 'treasure', 'objective', 'event', 'incident', 'convoy']],
    ['npc_ai',          ['npc', 'zombie_territor', 'wolf_territor', 'bear_territor', 'horde', 'aipatrol', 'aiguard', 'custom_zmb', 'cannibals', 'reindeer_territor', 'alien', 'monster', 'boss']],
    ['seasonal',        ['haunted', 'halloween', 'witch', 'horror', 'creepy', 'spooky', 'ghost', 'pumpkin', 'graveyard', 'grave', 'tombstone', 'cemetery', 'xmas', 'christmas', 'santa', 'easter', 'newyear', 'festive']],
    ['winter_maps',     ['winterchernarus', 'winter_cher', 'snow', 'ice', 'frozen', 'arctic']],
    ['oil_rigs',        ['oilrig', 'oil_rig', 'sea_platform', 'oil_platform', 'offshore']],
    ['caves',           ['cave', 'skelcave', 'cliffhole', 'grotte']],
    ['ships',           ['shipwreck', 'cargoship', 'shipment', 'boat', 'carrier', 'destroyer', 'barge', 'vessel']],
    ['treehouses',      ['treehouse', 'tree_house']],
    ['houses_cabins',   ['house', 'cabin', 'hut', 'shack', 'home', 'retreat', 'shelter', 'apartment', 'hotel', 'cottage', 'ranch', 'camp', 'tent', 'biwop', 'motel', 'cribs', 'mansion', 'villa', 'tenement']],
    ['water_sources',   ['well', 'pump', 'water_well', 'h2o', 'fountain', 'wellpump', 'extrapump', 'watertruck', 'fontaine']],
    ['industry_factory',['industrial', 'factory', 'quarry', 'sawmill', 'workshop', 'warehouse', 'construction', 'crane', 'industrial_batiment', 'bricks', 'cement', 'quarry', 'junkyard', 'hangar', 'industrie', 'industriel']],
    ['bridges_roads',   ['bridge', 'highway', 'overpass', 'road', 'pathway', 'walkway', 'viaduct', 'pont']],
    ['trains_railway',  ['train', 'railway', 'railroad', 'depot', 'locomotive', 'wagon', 'rail_station', 'train_set']],
    ['bases',           ['base', 'shed', 'garage', 'fortress', 'flagstaff', 'garden', 'greenhouse', 'waterbase', 'solobase', 'hideout', 'outpost', 'compound', 'settlement', 'camp', 'compound', 'hideyhole']],
    ['castles',         ['castle', 'wendigo', 'ruins', 'medieval', 'fortress', 'keep', 'tower_castle', 'castelo']],
    ['safezones',       ['safezone', 'safe_zone', 'sz_']],
    ['vehicles',        ['vehicle', 'truck', 'heli', 'uboat', 'submarine', 'tank', 'trailer', 'aircraft', 'lada', 'gunter', 'sarka', 'olga', 'humvee', 'v3s', 'helicopter', 'plane', 'jet', 'ikarus', 'cars', 'car_', '_car']],
    ['points_of_interest', ['poi', 'location', 'spot', 'markup', 'marker', 'area', 'town', 'village', 'city', 'crossroad', 'intersection', 'bridge', 'lake', 'mountain', 'hill', 'island', 'beach', 'coast', 'forest', 'swamp', 'radio', 'truckstop', 'busstop', 'carstation', 'piscine', 'swimmingpool', 'monolith']],
    ['walls_structures',['wall', 'fence', 'gate', 'ramp', 'stairway', 'spiral', 'barricade', 'fort', 'trench', 'perimetre', 'tower', 'watchtower', 'tawer']],
    ['military',        ['military', 'milbase', 'barracks', 'checkpoint', 'militia', 'zonemili', 'tisy', 'nwaf', 'mb_', 'airfield', 'airbase', 'airstrip', 'radar', 'atc_', 'zenit', 'zennit', 'warhead', 'hq_', 'radio_station', 'chernarusbattalion', 'militear', 'milsim']],
    ['decorations',     ['speaker', 'statue', 'monument', 'memorial', 'bench', 'light', 'lamp', 'streetlamp', 'spotlight', 'decoration', 'decal', 'cobweb', 'newsstand']],
    ['furniture_interior',['furniture', 'table', 'shelf', 'bed', 'chair', 'desk', 'cabinet', 'interior', 'props', 'decor_', 'kitchen', 'bathroom', 'stove', 'trolley', 'locker', 'casier', 'stool']],
    ['nature_foliage',  ['tree', 'forest', 'bush', 'landscape', 'rock', 'foliage', 'grass', 'garden', 'plantation', 'hunting', 'animal', 'deerstand']],
    ['overhauls',       ['overhaul', 'overhual', 'snowverhaul', 'rework', 'revamp', 'rebuild', 'remod', 'remake', 'nature_overhaul', 'overgrown']],
    ['server_config',   ['cfggameplay', 'cfgeffect', 'cfgspawn', 'cfgevent', 'cfgplayer', 'cfgrandom', 'cfglimit', 'cfgignore', 'cfgweather', 'cfgenvironment', 'mapgroup', 'messages', 'spawn', 'weather', 'wipelist', 'init.c', 'validated-json', 'scheduledtasks', 'spawnpoints', 'cffgameplay', 'validator', 'jsontemplet', 'jsonvalidator']],
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
    'berenzhino', 'berizino', 'kemenka', 'kamyshovo', 'balote', 'krasno', 'stary_sobor', 'novy_sobor', 'vybor_airfield'
];

const LIVONIA_KEYWORDS = ['livonia', 'enoch', 'liv_', '_liv', 'adamow', 'bielawa', 'borek', 'brena', 'dolnik', 'drewniki', 'gieraltow', 'gliniska', 'grabin', 'huta', 'kanopi', 'karlin', 'kolembrody', 'konopki', 'kulno', 'lembork', 'lipina', 'lukow', 'muratyn', 'nadbor', 'nidek', 'olszanka', 'piequo', 'potoki', 'radacz', 'radunin', 'roztoka', 'sarnowek', 'sitnik', 'sobotka', 'tarnow', 'topolin', 'wrzeszcz', 'widok', 'zalesie', 'zapadlisko', 'kopa', 'przystup'];
const SAKHAL_KEYWORDS = ['sakhal', 'frostline', 'skl_', 'petropavlovsk', 'severomorsk', 'aniva', 'nogovo', 'rudnogorsk', 'bolotnoye', 'dolinovka', 'dudino', 'evai', 'goriachevo', 'kekra', 'lesogorovka', 'matrosovo', 'neran', 'orlovo', 'podgornoye', 'rybnoye', 'shumnoye', 'sovetskoye', 'taranay', 'tikhoye', 'tugur', 'tumanovo', 'vajkovo', 'vostok', 'vysokoe', 'yasnomorsk', 'yuzhnoye', 'zhupanovo', 'wahtap', 'swahtap', 'ledanoj', 'ketoj', 'mrak', 'sachalsky', 'solisko', 'tungar', 'urup', 'utes', 'utichy', 'uzhki', 'elizarovo'];
const CHERNARUS_OVERRIDE = ['chernarus', 'cherno', 'cherna', 'elektro', 'zeleno', 'stary', 'novy', 'gorka', 'tisy', 'krasno', 'vybor', 'svet', 'kamensk', 'pavlovo', 'berezino', 'balota', 'nwaf', 'neaf', 'altar'];
const JUNK = ['test', 'test_1', 'test2', 'testing', 'unknown', 'nothing', 'notworking', 'problem', 'readme', 'ssss', 'xxx', 'random_shit', 'workingtest', 'proxy_test', 'smokeringtest', 'xmlvalidator', 'xml_g_-_code'];

const isBennett = (name) => name.toLowerCase().startsWith('bennett') || name.toLowerCase().startsWith('bennet');
const norm = (s) => s.toLowerCase().replace(/[-_ ]/g, '');

const icons = {
    air_drops: '🪂', bases: '🏗️', bennetts_builds: '🔧', building_supplies: '📦', bunkers: '🕳️', castles: '🏰', caves: '⛰️', decorations: '🎀', faction_bases: '⚔️',
    houses_cabins: '🏠', junk_test: '🗑️', livonia: '🗺️', loadouts: '🎽', loot_configs: '💰', military: '🎖️', missions_events: '⚡', npc_ai: '🧟',
    oil_rigs: '🛢️', other_configs: '📁', overhauls: '🔄', points_of_interest: '📍', pvp_events: '🎯', racing: '🏁', safezones: '🛡️', sakhal: '❄️',
    seasonal: '🎃', server_config: '⚙️', ships: '🚢', teleporters: '🌀', traders: '🛒', treehouses: '🌳', ufc_fighting: '🥊', vehicles: '🚗',
    walls_structures: '🧱', weapons: '🔫', explosives_boom: '💥', food_drinks: '🍎', clothing_gear: '👕', winter_maps: '🌨️', 
    hospitals_medical: '🏥', police_stations: '👮', banks_economy: '🏦', water_sources: '⛲', industry_factory: '🏭', 
    bridges_roads: '🌉', trains_railway: '🚂', furniture_interior: '🛋️', nature_foliage: '🌳'
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
