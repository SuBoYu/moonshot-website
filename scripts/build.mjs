import { readFile, mkdir, copyFile } from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
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
await copyFile(new URL('../src/index.html', import.meta.url), new URL('index.html', output));
console.log('Build passed: navigation targets, script syntax and brand links validated. Output: dist/');
