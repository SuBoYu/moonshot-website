import { readFile, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import vm from 'node:vm';
const headerTemplate = await readFile(new URL('../src/shared/header.html', import.meta.url), 'utf8');
function siteHeader(page, home, launches, current = false) {
  const header = headerTemplate.replace('href="__HOME__"', 'href="' + (home || '#home') + '"').replaceAll('__HOME__', home).replaceAll('__LAUNCHES__', launches).replace('__CURRENT__', current ? 'aria-current="page"' : '');
  if (!page.includes('<!-- SITE_HEADER -->')) throw new Error('Missing shared header slot');
  return page.replace('<!-- SITE_HEADER -->', header).replace('</head>', '<script src="/header.js" defer></script></head>');
}
let html = siteHeader(await readFile(new URL('../src/index.html', import.meta.url), 'utf8'), '', 'launches/');
const { episodes, source } = JSON.parse(await readFile(new URL('../src/data/episodes.json', import.meta.url), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (!Array.isArray(episodes) || episodes.length !== 3) throw new Error('Expected three episode records');
for (const episode of episodes) {
  if (!episode.title || !/^\d{4}-\d{2}-\d{2}$/.test(episode.publishedAt) || !Number.isInteger(episode.durationMinutes) || episode.durationMinutes < 1) throw new Error('Invalid episode metadata');
  const url = new URL(episode.url);
  if (url.protocol !== 'https:' || url.hostname !== 'player.soundon.fm') throw new Error('Episode links must use the official SoundOn player');
}
if (episodes.some((episode, i) => i && episode.publishedAt > episodes[i - 1].publishedAt)) throw new Error('Episodes must be newest first');
const upcoming = JSON.parse(await readFile(new URL('../src/data/upcoming.json', import.meta.url), 'utf8'));
for (const key of ['label', 'title', 'description', 'note']) {
  if (typeof upcoming[key] !== 'string' || !upcoming[key].trim()) throw new Error(`Missing upcoming episode ${key}`);
}
const recent = episodes.slice(0, 2);
const number = episode => escape(episode.title.match(/^EP\d+/)?.[0] ?? 'MOONSHOT');
const title = episode => escape(episode.title.replace(/^EP\d+\s*/, ''));
const date = episode => escape(episode.publishedAt.replaceAll('-', '.'));
const section = `<section class="episodes wrap" id="episodes" aria-labelledby="episodes-heading">
  <div class="section-head"><div><div class="kicker">UP NEXT / FIELD NOTES</div><h2 id="episodes-heading">下一趟探索，<br>我們去看火箭。</h2></div><div class="episodes-intro"><a href="https://sndn.link/moonshot" target="_blank" rel="noopener noreferrer">瀏覽所有單集 ↗</a></div></div>
  <article class="episode-feature"><div class="episode-art rocket-art" aria-hidden="true"><div class="episode-art-top"><span>MOONSHOT / FIELD NOTES</span><span>UP NEXT</span></div><div class="rocket-visual"><span class="rocket-body"></span><span class="rocket-trail"></span></div><div class="episode-art-bottom"><span>S2 / 01 · 下一趟探索</span><b>↗</b></div></div><div class="episode-copy"><div class="episode-meta"><span class="badge">即將推出</span>${escape(upcoming.label)}</div><h3>${escape(upcoming.title)}</h3><p>${escape(upcoming.description)}</p><div class="episode-formats"><span>長影片</span><span>短影片</span><span>Podcast</span></div><p class="upcoming-note">${escape(upcoming.note)}</p><a class="btn primary" href="https://www.youtube.com/@moonshot_official" target="_blank" rel="noopener noreferrer">訂閱 YouTube，關注新集數 <span aria-hidden="true">↗</span></a></div></article>
  <div class="recent-label">已上架單集 / KEEP EXPLORING</div>
  <div class="episode-recent">${recent.map(episode => `<a class="episode-row" href="${escape(episode.url)}" target="_blank" rel="noopener noreferrer" aria-label="收聽 ${escape(episode.title)}"><span class="episode-row-number">${number(episode)}</span><div><div class="episode-meta"><time datetime="${escape(episode.publishedAt)}">${date(episode)}</time> · ${episode.durationMinutes} 分鐘</div><h3>${title(episode)}</h3></div><span class="episode-row-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
  <p class="episode-source">已上架單集依節目官方 <a href="${escape(source)}" target="_blank" rel="noopener noreferrer">RSS</a> 刊載順序整理。各平台上架內容可能不同。</p>
</section>`;
if (!html.includes('<!-- LATEST_EPISODES -->')) throw new Error('Missing latest-episodes slot');
html = html.replace('<!-- LATEST_EPISODES -->', section);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(id)) throw new Error(`Missing navigation target: ${id}`);
}
for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  new vm.Script(script);
}
for (const required of ['Tony', 'Jason', 'Nash', 'moonshotpdct@gmail.com',
  'https://www.youtube.com/@moonshot_official',
  'https://www.instagram.com/moonshot_podcast/',
  'https://open.spotify.com/show/4ytjr50iW6kEt5bLUNmVwe',
  'https://podcasts.apple.com/podcast/1682741765',
  'https://sndn.link/moonshot',
  'https://podcast.kkbox.com/tw/channel/-mO7bOBnQApXOhbmie']) {
  if (!html.includes(required)) throw new Error(`Missing required brand content: ${required}`);
}
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(new URL('index.html', output), brandMetadata(html, '/'));
await cp(new URL('../src/pixel-assets/', import.meta.url), new URL('assets/', output), { recursive: true });
console.log('Build passed: navigation targets, script syntax and brand links validated. Output: dist/');

// Keep the pixel-art direction as a separate, reviewable design variant.
const pixel = (await readFile(new URL('../src/pixel.html', import.meta.url), 'utf8')).replace('<!-- LATEST_EPISODES -->', section);
const pixelIds = [...pixel.matchAll(/\bid="([^"\s]+)"/g)].map(match => match[1]);
if (new Set(pixelIds).size !== pixelIds.length) throw new Error('Duplicate pixel variant IDs');
for (const [, id] of pixel.matchAll(/href="#([^"\s]+)"/g)) {
  if (!pixelIds.includes(id)) throw new Error(`Missing pixel variant target: ${id}`);
}
for (const [, script] of pixel.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script);
await mkdir(new URL('pixel/', output), { recursive: true });
await writeFile(new URL('pixel/index.html', output), brandMetadata(pixel, '/pixel/'));
await cp(new URL('../src/pixel-assets/', import.meta.url), new URL('pixel/assets/', output), { recursive: true });
console.log('Pixel variant built at /pixel/');

// SpaceX launch tracker at /launches/. Launch data is a reviewed snapshot (npm run launches:update);
// the page refreshes itself from Launch Library 2 in the browser and falls back to the snapshot.
const launches = JSON.parse(await readFile(new URL('../src/data/launches.json', import.meta.url), 'utf8'));
for (const key of ['upcoming', 'recent', 'starship']) {
  if (!Array.isArray(launches[key]) || !launches[key].length) throw new Error(`Launch snapshot has no ${key} launches`);
  for (const launch of launches[key]) {
    if (!launch.id || !launch.name || !launch.vehicle || Number.isNaN(Date.parse(launch.net))) throw new Error(`Invalid launch record in ${key}: ${launch.name ?? launch.id}`);
    if (launch.webcast && new URL(launch.webcast).protocol !== 'https:') throw new Error(`Webcast link must be https: ${launch.name}`);
  }
}
if (Number.isNaN(Date.parse(launches.fetchedAt))) throw new Error('Launch snapshot is missing fetchedAt');
if (launches.recent.some((launch, i) => i && launch.net > launches.recent[i - 1].net)) throw new Error('Recent launches must be newest first');
const landMask = JSON.parse(await readFile(new URL('../src/data/land-mask.json', import.meta.url), 'utf8'));
if (Buffer.from(landMask.bits, 'base64').length !== Math.ceil((landMask.cols * landMask.rows) / 8)) throw new Error('Land mask size does not match its grid');
const normalizer = (await readFile(new URL('./launch-normalize.mjs', import.meta.url), 'utf8')).replace(/^export /gm, '');
const inlineJson = value => JSON.stringify(value).replace(/</g, '\u003c');
let launchPage = siteHeader(await readFile(new URL('../src/launches.html', import.meta.url), 'utf8'), '../', '../launches/', true);
for (const [slot, value] of [['__LAUNCH_DATA__', inlineJson(launches)], ['__LAND_MASK__', inlineJson(landMask)], ['/*__NORMALIZE__*/', normalizer]]) {
  if (launchPage.split(slot).length !== 2) throw new Error(`Launch page must contain exactly one ${slot} slot`);
  launchPage = launchPage.replace(slot, () => value);
}
const launchIds = [...launchPage.matchAll(/\sid="([^"\s]+)"/g)].map(match => match[1]);
if (new Set(launchIds).size !== launchIds.length) throw new Error('Duplicate launch page IDs');
for (const [, id] of launchPage.matchAll(/href="#([^"\s]+)"/g)) {
  if (!launchIds.includes(id)) throw new Error(`Missing launch page target: ${id}`);
}
for (const [, script] of launchPage.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script);
await mkdir(new URL('launches/', output), { recursive: true });
await writeFile(new URL('launches/index.html', output), brandMetadata(launchPage, '/launches/'));
console.log('Launch tracker built at /launches/');

// Theme preference is shared across all pages and applied before the first paint.
new vm.Script(await readFile(new URL('../src/shared/theme.js', import.meta.url), 'utf8'));
await cp(new URL('../src/shared/theme.js', import.meta.url), new URL('theme.js', output));
await cp(new URL('../src/shared/theme.css', import.meta.url), new URL('theme.css', output));

new vm.Script(await readFile(new URL('../src/shared/header.js', import.meta.url), 'utf8'));
await cp(new URL('../src/shared/header.js', import.meta.url), new URL('header.js', output));

// Stable production URLs keep social previews independent of preview-deployment hosts.
function brandMetadata(page, path) {
  const base = new URL(process.env.SITE_URL || 'https://moonshot-website-4b9.pages.dev');
  if (base.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS');
  const title = page.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = page.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if (!title || !description) throw new Error('Missing page title or description');
  const image = escape(new URL('/brand/social-card-warm.jpg', base).href);
  const url = escape(new URL(path, base).href);
  return page.replace('</head>', `<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png"><link rel="apple-touch-icon" href="/brand/apple-touch-icon.png"><meta property="og:site_name" content="Moonshot 射月計畫"><meta property="og:type" content="website"><meta property="og:locale" content="zh_TW"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Moonshot 射月計畫 — 保持好奇，探索未知。"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"></head>`);
}
await cp(new URL('../src/brand-assets/', import.meta.url), new URL('brand/', output), { recursive: true });
