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
test('light default applies before DOM ready; button toggles with accessible state', () => {
  const p = page(); assert.equal(p.root.dataset.theme, 'light'); p.boot(); p.click();
  assert.equal(p.root.dataset.theme, 'dark'); assert.equal(p.attrs['aria-pressed'], 'true');
  assert.equal(p.attrs['aria-label'], '切換至淺色風格'); assert.equal(p.meta.content, '#080e15');
});
test('theme persists on another page and can switch back to light', () => {
  const storage = new Map(); const first = page(storage); first.boot(); first.click();
  const second = page(storage); assert.equal(second.root.dataset.theme, 'dark'); second.boot(); second.click();
  assert.equal(storage.get('moonshot.theme'), 'light'); assert.equal(second.root.style.colorScheme, 'light');
});
test('blocked storage does not prevent toggling', () => {
  const p = page(new Map(), true); p.boot(); p.click(); assert.equal(p.root.dataset.theme, 'dark');
});
test('invalid preference falls back to light and other tabs stay synchronized', () => {
  const p = page(new Map([['moonshot.theme', 'invalid']])); p.boot(); assert.equal(p.root.dataset.theme, 'light');
  p.storageEvent({ key: 'moonshot.theme', newValue: 'dark' }); assert.equal(p.root.dataset.theme, 'dark');
  p.storageEvent({ key: 'moonshot.theme', newValue: null }); assert.equal(p.root.dataset.theme, 'light');
});
