import fs from 'fs';
import path from 'path';

const file = 'c:\\Users\\Shadow\\Downloads\\dank-studio\\tools\\discord_pipeline.mjs';
let content = fs.readFileSync(file, 'utf8');

const CATEGORIES_START = 'const CATEGORIES = [';
const CATEGORIES_END = 'const CHERNARUS_TOWNS = [';

const startIndex = content.indexOf(CATEGORIES_START) + CATEGORIES_START.length;
const endIndex = content.indexOf(CATEGORIES_END);

const NEW_CATEGORIES = `
    ['loadouts',        ['loadout', 'loadout_', 'loadout-', 'load out', 'kit', 'starter', 'freshspawn', 'freshie', 'loady', 'suitcase', 'outfit', 'personaje', 'survivant', 'survivor', 'surv_', 'specialist', 'soldier', 'swat', 'ww2', 'cedaki', 'chedaki', 'casual', 'cop', 'cowboy', 'doctor', 'fisherman', 'doctor', 'negan', 'walking_dead', 'twd', 'medic', 'ghillie', 'winter_soldier', 'winter_survivor', 'whitepartysuit', 'drip', 'hunter', 'marine', 'knight', 'mime', 'mummy', 'male', 'female', 'surv_']],
    ['loot_configs',    ['loot', 'itemtable', 'economy', 'types', 'events', 'globals', 'spawnabletypes', 'cfgeconomy', 'table', 'config', 'cfg_', 'stash', 'card', 'keycard', 'punchcard', 'punchedcard', 'items_']],
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
    ['signs',           ['sign', 'billboard', 'signage', 'banner', 'flag', 'poster', 'plaque', 'notice']],
    ['walls_structures',['wall', 'fence', 'gate', 'ramp', 'stairway', 'spiral', 'barricade', 'fort', 'trench', 'perimetre', 'tower', 'watchtower', 'tawer']],
    ['military',        ['military', 'milbase', 'barracks', 'checkpoint', 'militia', 'zonemili', 'tisy', 'nwaf', 'mb_', 'airfield', 'airbase', 'airstrip', 'radar', 'atc_', 'zenit', 'zennit', 'warhead', 'hq_', 'radio_station', 'chernarusbattalion', 'militear', 'milsim']],
    ['decorations',     ['speaker', 'statue', 'monument', 'memorial', 'bench', 'light', 'lamp', 'streetlamp', 'spotlight', 'decoration', 'decal', 'cobweb', 'newsstand']],
    ['furniture_interior',['furniture', 'table', 'shelf', 'bed', 'chair', 'desk', 'cabinet', 'interior', 'props', 'decor_', 'kitchen', 'bathroom', 'stove', 'trolley', 'locker', 'casier', 'stool']],
    ['nature_foliage',  ['tree', 'forest', 'bush', 'landscape', 'rock', 'foliage', 'grass', 'garden', 'plantation', 'hunting', 'animal', 'deerstand']],
    ['overhauls',       ['overhaul', 'overhual', 'snowverhaul', 'rework', 'revamp', 'rebuild', 'remod', 'remake', 'nature_overhaul', 'overgrown']],
    ['server_config',   ['cfggameplay', 'cfgeffect', 'cfgspawn', 'cfgevent', 'cfgplayer', 'cfgrandom', 'cfglimit', 'cfgignore', 'cfgweather', 'cfgenvironment', 'mapgroup', 'messages', 'spawn', 'weather', 'wipelist', 'init.c', 'validated-json', 'scheduledtasks', 'spawnpoints', 'cffgameplay', 'validator', 'jsontemplet', 'jsonvalidator']],
    ['other_configs',   []],
];

\r\n\r\n`;

const newContent = content.substring(0, startIndex) + NEW_CATEGORIES + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Categories updated successfully.');
