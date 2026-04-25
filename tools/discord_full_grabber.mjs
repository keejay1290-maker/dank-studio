import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TARGET_GUILD_ID = "1225174520609112214";
const DESKTOP_DIR = path.join(process.env.USERPROFILE, 'Desktop', 'dayz community');

// Set to a keyword to only download from channels matching this filter (e.g. 'console')
// Set to null to download from ALL channels
const CHANNEL_FILTER = null;

const CATEGORIES = {
    'overhauls': ['overhaul', 'overhual', 'snowverhaul', 'rework', 'revamp', 'rebuild', 'remod'],
    'traders': ['trader', 'shop', 'store', 'superstore', 'megastore', 'gunstore', 'armory', 'armoury', 'showroom', 'tireshop', 'dealership', 'vending', 'dealer', 'growshop', 'mall'],
    'loadouts': ['loadout', 'loady', 'freshspawn', 'freshie', 'medic', 'soldier', 'swat', 'suit', 'outfit', 'gear', 'starter', 'kit', 'fireman', 'cowboy', 'cop', 'bandit', 'stalker', 'ranger', 'sniper', 'batman', 'survivor', 'clothes', 'clothing'],
    'teleporters': ['teleport', 'transit', 'tp_', 'tp1', 'tp2', 'tosafe', 'totrader'],
    'ufc_fighting': ['fight', 'boxing', 'ufc', 'mma', 'colosseum', 'fightclub', 'sumo', 'wrestling'],
    'racing': ['race', 'racing', 'touge', 'drift', 'offroad', 'figure8', 'rally', 'racetrack', 'bumpercars', 'dodgem', 'derby'],
    'pvp_events': ['pvp', 'paintball', 'koth', 'deathmatch', 'squidgame', 'captureflag', 'capture', 'arena'],
    'bunkers': ['bunker', 'underground', 'tunnel', 'cfgunderground', 'sewer', 'lab'],
    'air_drops': ['airdrop', 'plane_crash', 'traincrash', 'c130'],
    'faction_bases': ['faction', 'clan'],
    'missions_events': ['dynamic_mission', 'dynamic_', 'mission_', 'quest', 'evacuation', 'treasure'],
    'seasonal': ['haunted', 'halloween', 'witch', 'spooky', 'ghost', 'pumpkin', 'xmas', 'christmas', 'santa', 'easter'],
    'castles': ['castle', 'wendigo', 'krona'],
    'safezones': ['safezone', 'safe_zone'],
    'vehicles': ['vehicle', 'truck', 'heli', 'boat', 'uboat', 'submarine', 'tank', 'trailer', 'aircraft', 'carrier'],
    'bases': ['base', 'shed', 'garage', 'fortress', 'mansion', 'hideout', 'outpost', 'compound', 'settlement'],
    'houses_cabins': ['house', 'cabin', 'hut', 'shack', 'home', 'shelter', 'cottage', 'motel'],
    'points_of_interest': ['bridge', 'village', 'city', 'town', 'dock', 'port', 'prison', 'island', 'resort', 'harbor', 'metro', 'nwaf', 'neaf', 'balota', 'cherno', 'elektro', 'zeleno', 'stary', 'novy', 'gorka', 'tisy', 'krasno', 'vybor', 'svet', 'kamensk', 'pavlovo', 'solnich', 'berezino', 'skalisty', 'volcano', 'coastal', 'airport', 'airfield', 'factory', 'church', 'hospital'],
    'server_config': ['cfggameplay', 'cfgeffect', 'cfgspawn', 'cfgevent', 'cfgplayer', 'cfgrandom', 'cfglimit', 'cfgignore', 'cfgweather', 'cfgenvironment', 'cfgeconomy', 'types', 'events', 'globals', 'economy', 'mapgroup', 'messages', 'spawn', 'weather'],
    'weapons': ['weapon', 'gun', 'ammo', 'grenade', 'explosive'],
};

const TRANSLATIONS = {
    'general': 'general',
    'fichiers': 'files',
    'recherche': 'search',
    'annonce': 'announcement',
    'gratuit': 'free',
    'partage': 'share',
    'aide': 'help',
    'boutique': 'shop',
    'reglement': 'rules',
    'vendeur': 'trader',
    'membre': 'member',
    'mapping': 'map'
};

(async () => {
    let browser;
    try {
        console.log("Connecting to Browser...");
        browser = await chromium.connectOverCDP('http://localhost:9222');
        const defaultContext = browser.contexts()[0];
        const page = defaultContext.pages().find(p => p.url().includes('discord.com'));
        
        if (!page) {
            console.log("No Discord tab found");
            process.exit(1);
        }

        console.log("Waiting for Auth Token via network sniffing...");
        let token = null;
        
        page.on('request', req => {
            if (req.url().includes('discord.com/api/v9/')) {
                const h = req.headers()['authorization'];
                if (h && h.length > 30) token = h;
            }
        });

        // Trigger a real API request by doing a simple UI action
        // For instance, opening the pins or searching
        await page.keyboard.press('Escape');
        const searchBox = page.locator('[aria-label="Search"]').first();
        await searchBox.click();
        await searchBox.fill('has:file');
        await searchBox.press('Enter');

        for(let i=0; i<30; i++) {
            if(token) break;
            await page.waitForTimeout(100);
        }

        if (!token) {
            console.log("Failed to extract Auth token. Cannot proceed with API download.");
            process.exit(1);
        }

        console.log("SUCCESSfully extracted Auth token!");
        console.log("Mapping Channels...");

        const headers = { 'authorization': token };
        
        // 0. Global Deduplication Pre-Scan
        console.log("Scanning master haul for duplicates...");
        const existingFiles = new Set();
        const walk = (dir) => {
            if (!fs.existsSync(dir)) return;
            const files = fs.readdirSync(dir);
            for (const f of files) {
                const fp = path.join(dir, f);
                if (fs.statSync(fp).isDirectory()) walk(fp);
                else existingFiles.add(f.toLowerCase());
            }
        };
        if (fs.existsSync(DESKTOP_DIR)) walk(DESKTOP_DIR);
        console.log(`Master haul contains ${existingFiles.size} unique files. Duplicate skipping active.`);
        
        // Fetch all channels in the guild to get their names
        const cRes = await fetch(`https://discord.com/api/v9/guilds/${TARGET_GUILD_ID}/channels`, { headers });
        const channels = await cRes.json();
        
        // Active threads aren't always in the main channels list. We should fetch threads too.
        // Or we can just use the name if we find it, otherwise "thread_<id>"
        const chanMap = {};
        if (Array.isArray(channels)) {
            for (const c of channels) {
                chanMap[c.id] = c.name;
            }
        }
        // Also fetch active threads to get their names
        const tRes = await fetch(`https://discord.com/api/v9/guilds/${TARGET_GUILD_ID}/threads/active`, { headers });
        if(tRes.ok) {
            const threadsData = await tRes.json();
            if(threadsData && threadsData.threads) {
                for(const t of threadsData.threads) chanMap[t.id] = t.name;
            }
        }

        let allExtraction = [];
        const cachePath = path.join(process.env.APPDATA, '..', '.gemini', 'antigravity', 'brain', '19fde9d6-e3b5-45fd-925f-2ed8fbfe95b4', 'scratch', `extraction_cache_${TARGET_GUILD_ID}.json`);

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        const stealthSleep = async (base = 4000) => await sleep(base + Math.random() * 3000);

        if (fs.existsSync(cachePath)) {
            console.log("Loading extraction results from cache...");
            allExtraction = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        } else {
            let offset = 0;
            console.log("Beginning DEEP STEALTH Search for ALL .json files...");
            while (true) {
                const url = `https://discord.com/api/v9/guilds/${TARGET_GUILD_ID}/messages/search?attachment_extension=json&offset=${offset}`;
                const res = await fetch(url, { headers });
                
                if (res.status === 429) {
                    const wait = (await res.json()).retry_after * 1000 + 30000;
                    console.log(`Persistent Rate Limit! Deep Cool down for ${wait}ms...`);
                    await sleep(wait);
                    continue;
                }
                
                await stealthSleep();

                if (!res.ok) {
                    console.log(`Search failed with status ${res.status}`);
                    break;
                }
                const data = await res.json();
                if (!data.messages || data.messages.length === 0) break;
                for (const msgChunk of data.messages) {
                    const hit = msgChunk.find(m => m.attachments && m.attachments.some(a => a.filename.endsWith('.json')));
                    if (!hit) continue;
                    // Channel filter: skip messages not in matching channels
                    if (CHANNEL_FILTER) {
                        const chName = (chanMap[hit.channel_id] || '').toLowerCase();
                        if (!chName.includes(CHANNEL_FILTER.toLowerCase())) continue;
                    }
                    allExtraction.push({ msg: hit, chunk: msgChunk });
                }
                offset += 25;
                console.log(`Scanned JSON... offset ${offset} / Total results roughly ${data.total_results || 'unknown'}`);
                if (offset >= (data.total_results || 25)) break;
                if (offset > 5000) break;
            }

            offset = 0;
            // Removed standalone XML search as per user request to only download XMLs when paired with JSONs
            
            // Save cache
            if (!fs.existsSync(path.dirname(cachePath))) fs.mkdirSync(path.dirname(cachePath), { recursive: true });
            fs.writeFileSync(cachePath, JSON.stringify(allExtraction));
            console.log(`Found a total of ${allExtraction.length} JSON-based file hits. Cached results for fast resume.`);
        }

        // Sort alphabetically by the name of the first JSON in each group
        allExtraction.sort((a, b) => {
            const nameA = a.msg.attachments.find(at => at.filename.endsWith('.json'))?.filename || "";
            const nameB = b.msg.attachments.find(at => at.filename.endsWith('.json'))?.filename || "";
            return nameA.localeCompare(nameB);
        });

        const processedMsgIds = new Set();
        let downloadCount = 0;

        for (const dataObj of allExtraction) {
            const hit = dataObj.msg;
            if (processedMsgIds.has(hit.id)) continue;
            processedMsgIds.add(hit.id);

            const jsonFiles = hit.attachments.filter(a => a.filename.endsWith('.json'));
            if (jsonFiles.length === 0) continue;

            const relatedFiles = hit.attachments.filter(a => a.filename.endsWith('.xml')); 
            const validFiles = [...jsonFiles, ...relatedFiles];
            
            const firstFile = jsonFiles[0];
            const groupBase = path.basename(firstFile.filename, path.extname(firstFile.filename));
            
            let bestCategory = 'other_configs';
            const nameToTest = (groupBase + "_" + (chanMap[hit.channel_id] || "")).toLowerCase();
            
            for (const [catName, keywords] of Object.entries(CATEGORIES)) {
                if (keywords.some(kw => nameToTest.includes(kw))) {
                    bestCategory = catName;
                    break;
                }
            }

            const targetDir = path.join(DESKTOP_DIR, bestCategory, groupBase);
            fs.mkdirSync(targetDir, { recursive: true });

            for (const file of validFiles) {
                const filePath = path.join(targetDir, file.filename);
                // GLOBAL DEDUPLICATION CHECK
                if (existingFiles.has(file.filename.toLowerCase())) {
                    console.log(`Skipping Duplicate: ${file.filename}`);
                    continue;
                }

                if (!fs.existsSync(filePath)) {
                    console.log(`Downloading: ${bestCategory}/${groupBase} -> ${file.filename}`);
                    await stealthSleep(500); 
                    try {
                        const rec = await fetch(file.url);
                        if (rec.ok) {
                            fs.writeFileSync(filePath, Buffer.from(await rec.arrayBuffer()));
                            downloadCount++;
                            existingFiles.add(file.filename.toLowerCase());
                        }
                    } catch(e) {}
                }
            }
                
            // ONLY pull images from the EXACT same message as the JSON/XML
            for (const a of hit.attachments) {
                if (a.filename.match(/\.(png|jpg|jpeg|webp)$/i)) {
                    const imgPath = path.join(targetDir, a.filename);
                    if (!fs.existsSync(imgPath)) {
                        console.log(`  + Gallery Image: ${a.filename}`);
                        try {
                            const irec = await fetch(a.url);
                            if (irec.ok) fs.writeFileSync(imgPath, Buffer.from(await irec.arrayBuffer()));
                        } catch(e){}
                    }
                }
            }
        }

        console.log(`\nDONE! Fully scraped server APIs and securely downloaded ${downloadCount} new items directly to ${DESKTOP_DIR}`);

        // Auto-organise the haul
        console.log('\n══ Running Master Organiser ══');
        try {
            const scriptDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
            execSync(`node "${path.join(scriptDir, 'discord_pipeline.mjs')}"`, { stdio: 'inherit' });
        } catch(e) { console.log('Organiser finished with warnings.'); }

        await browser.close();
        process.exit(0);

    } catch (e) {
        console.error("Script failed:", e);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
