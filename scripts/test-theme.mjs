import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const script = await readFile(new URL('../src/shared/theme.js', import.meta.url), 'utf8');
function page(storage = new Map(), blocked = false) {
  const root = { dataset: {}, style: {} }, attrs = {}, icon = {}, listeners = {}, windowListeners = {};
  const button = { setAttribute: (k, v) => attrs[k] = v, querySelector: () => icon, addEventListener: (k, fn) => listeners[k] = fn };
  const meta = { setAttribute: (k, v) => meta[k] = v };
  let boot;
  vm.runInNewContext(script, { document: { documentElement: root, querySelector: () => meta,
    querySelectorAll: () => [button], addEventListener: (k, fn) => boot = fn },
    localStorage: { getItem: k => { if (blocked) throw Error('blocked'); return storage.get(k); },
      setItem: (k, v) => { if (blocked) throw Error('blocked'); storage.set(k, v); } },
    window: { addEventListener: (k, fn) => windowListeners[k] = fn } });
  return { root, attrs, icon, meta, boot: () => boot(), click: () => listeners.click(), storageEvent: event => windowListeners.storage(event) };
}
test('dark default applies before DOM ready; button toggles with accessible state', () => {
  const p = page(); assert.equal(p.root.dataset.theme, 'dark');
  assert.equal(p.root.style.colorScheme, 'dark'); assert.equal(p.meta.content, '#080e15');
  p.boot(); assert.equal(p.attrs['aria-pressed'], 'true');
  p.click(); assert.equal(p.root.dataset.theme, 'light');
  assert.equal(p.attrs['aria-pressed'], 'false'); assert.equal(p.attrs['aria-label'], '切換至深色風格');
  assert.equal(p.meta.content, '#f7f5ef');
});
test('explicit light preference persists on another page and can switch back to dark', () => {
  const storage = new Map(); const first = page(storage); first.boot(); first.click();
  const second = page(storage); assert.equal(second.root.dataset.theme, 'light'); second.boot(); second.click();
  assert.equal(storage.get('moonshot.theme'), 'dark'); assert.equal(second.root.style.colorScheme, 'dark');
});
test('blocked storage uses dark default and does not prevent toggling', () => {
  const p = page(new Map(), true); assert.equal(p.root.dataset.theme, 'dark');
  p.boot(); p.click(); assert.equal(p.root.dataset.theme, 'light');
});
test('invalid preference falls back to dark and other tabs stay synchronized', () => {
  const p = page(new Map([['moonshot.theme', 'invalid']])); p.boot(); assert.equal(p.root.dataset.theme, 'dark');
  p.storageEvent({ key: 'moonshot.theme', newValue: 'light' }); assert.equal(p.root.dataset.theme, 'light');
  p.storageEvent({ key: 'moonshot.theme', newValue: null }); assert.equal(p.root.dataset.theme, 'dark');
  p.storageEvent({ key: 'moonshot.theme', newValue: 'invalid' }); assert.equal(p.root.dataset.theme, 'dark');
});
