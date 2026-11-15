// Refresh the checked-in launch snapshot from Launch Library 2 (The Space Devs).
//   npm run launches:update                  fetch from the API (3 requests; the free tier allows 15/hour)
//   npm run launches:update -- --from <dir>  rebuild from saved up.json / prev.json / starship.json responses
import { readFile, writeFile } from 'node:fs/promises';
import { normalizeLaunch, normalizeAgency } from './launch-normalize.mjs';

const API = 'https://ll.thespacedevs.com/2.3.0/launches';
const QUERIES = {
  up: `${API}/upcoming/?lsp__name=SpaceX&limit=20&mode=detailed&hide_recent_previous=true`,
  prev: `${API}/previous/?lsp__name=SpaceX&limit=30&mode=detailed`,
  starship: `${API}/?lsp__name=SpaceX&rocket__configuration__name=Starship&limit=40&mode=detailed&ordering=-net`,
};

const fromIndex = process.argv.indexOf('--from');
const fromDir = fromIndex > -1 ? process.argv[fromIndex + 1] : null;
if (fromIndex > -1 && !fromDir) throw new Error('--from needs a directory');

async function load(key) {
  if (fromDir) return JSON.parse(await readFile(`${fromDir}/${key}.json`, 'utf8'));
  const response = await fetch(QUERIES[key], { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Launch Library returned ${response.status} for ${key}; existing snapshot was preserved`);
  return response.json();
}

const [up, prev, starship] = await Promise.all(Object.keys(QUERIES).map(load));
for (const [key, body] of Object.entries({ up, prev, starship })) {
  if (!Array.isArray(body.results) || !body.results.length) throw new Error(`No launches in ${key}; existing snapshot was preserved`);
}

const snapshot = {
  source: 'https://thespacedevs.com/llapi',
  fetchedAt: fromDir
    ? [...up.results, ...prev.results].map(launch => launch.last_updated).sort().at(-1)
    : new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  agency: normalizeAgency(prev.results[0]),
  upcoming: up.results.map(normalizeLaunch).sort((a, b) => a.net.localeCompare(b.net)),
  recent: prev.results.map(normalizeLaunch).sort((a, b) => b.net.localeCompare(a.net)),
  starship: starship.results.map(normalizeLaunch).sort((a, b) => b.net.localeCompare(a.net)),
};

const target = new URL('../src/data/launches.json', import.meta.url);
await writeFile(target, JSON.stringify(snapshot, null, 1) + '\n');
console.log(`Updated ${snapshot.upcoming.length} upcoming, ${snapshot.recent.length} recent and ${snapshot.starship.length} Starship launches. Run npm run build and review the diff.`);
