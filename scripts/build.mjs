import { readFile, mkdir, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
let html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
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
await mkdir(output, { recursive: true });
await writeFile(new URL('index.html', output), html);
console.log('Build passed: navigation targets, script syntax and brand links validated. Output: dist/');
