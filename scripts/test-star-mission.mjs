import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
function element() {
  return { hidden: false, textContent: '', dataset: {}, listeners: {}, attributes: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute(key, value) { this.attributes[key] = value; },
    focus() {}, dispatch(type, event = {}) { this.listeners[type]?.(event); } };
}
const ids = Object.fromEntries(['signal-trigger', 'star-mission', 'mission-canvas', 'mission-status', 'mission-replay'].map(id => [id, element()]));
const close = element(), left = element(), right = element();
left.dataset.move = '-1'; right.dataset.move = '1';
ids['star-mission'].hidden = true;
ids['star-mission'].querySelector = () => close;
ids['star-mission'].querySelectorAll = () => [left, right];
ids['mission-canvas'].getContext = () => new Proxy({}, { get: (_, key) => () => {}, set: () => true });
let nextId = 0;
const frames = new Map();
vm.runInNewContext(await readFile(new URL('../src/pixel-assets/star-mission.js', import.meta.url), 'utf8'), {
  document: { getElementById: id => ids[id], addEventListener() {} },
  requestAnimationFrame(fn) { frames.set(++nextId, fn); return nextId; },
  cancelAnimationFrame(id) { frames.delete(id); }
});
assert.equal(frames.size, 0, 'No game animation before opting in');
ids['signal-trigger'].dispatch('click');
assert.equal(ids['star-mission'].hidden, false);
assert.equal(ids['signal-trigger'].attributes['aria-expanded'], 'true');
// Play stationary: stars periodically cross the central lane. Exercise the actual frame loop.
for (let now = 16; now < 40000 && frames.size; now += 16) {
  const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now));
}
assert.match(ids['mission-status'].textContent, /探索完成/);
assert.equal(ids['mission-replay'].hidden, false);
assert.equal(frames.size, 0, 'The loop stops after winning');
ids['mission-replay'].dispatch('click');
assert.match(ids['mission-status'].textContent, /0 \/ 5/);
assert.equal(ids['mission-replay'].hidden, true);
assert.equal(frames.size, 1);
ids['star-mission'].dispatch('keydown', { key: 'Escape' });
assert.equal(ids['star-mission'].hidden, true);
assert.equal(ids['signal-trigger'].attributes['aria-expanded'], 'false');
assert.equal(frames.size, 0, 'Closing cancels the animation');
console.log('Star mission passed: opt-in, collection, victory, replay and Escape cleanup.');
