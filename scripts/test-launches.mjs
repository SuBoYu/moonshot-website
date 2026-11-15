import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

process.env.TZ = 'America/Chicago';
const html = await readFile(new URL('../src/launches.html', import.meta.url), 'utf8');
const now = Date.parse('2026-11-15T18:00:00Z');
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
const formatting = html.slice(html.indexOf('/* ---------- formatting ---------- */'), html.indexOf('function clock('));
const windowSource = html.slice(html.indexOf('function windowText('), html.indexOf('function detail('));
function formatContext() {
  return { Date: Clock, pad2: n => String(n).padStart(2, '0'), exact: l => /^(SEC|MIN|HR|HOUR)$/.test(l.precision) };
}
test('launch dates use their own daylight-saving offset', () => {
  const context = formatContext();
  const result = vm.runInNewContext(formatting + '\n[when({net:"2026-10-31T04:04:34Z",precision:"MIN"}),when({net:"2026-11-18T03:14:00Z",precision:"MIN"})]', context);
  assert.equal(result[0].t, '23:04 GMT−5');
  assert.equal(result[1].t, '21:14 GMT−6');
});
test('a window spanning the DST transition labels both offsets', () => {
  const context = formatContext();
  const value = vm.runInNewContext(formatting + windowSource + '\nwindowText({precision:"MIN",windowStart:"2026-11-01T06:30:00Z",windowEnd:"2026-11-01T07:30:00Z"})', context);
  assert.equal(value, '01:30 GMT−5 – 01:30 GMT−6');
});
const refreshSource = html.slice(html.indexOf('async function refresh()'), html.indexOf('/* ---------- boot ---------- */'));
async function runRefresh({ age, offline = false }) {
  const state = { fetchedAt: '2026-11-13T00:00:00Z', live: false };
  const record = { id: 'launch' };
  const cached = age == null ? null : { at: now - age, launches: [record], agency: { launches: 2 } };
  let calls = 0, rendered = 0, applied = 0;
  const context = { Date: Clock, S: state, CACHE: 'test', TTL: 30 * 60e3, API: 'https://example.test',
    localStorage: { getItem: () => JSON.stringify(cached), setItem() {} },
    fetch: async () => { calls++; if (offline) throw new Error('offline'); return { ok: true, json: async () => ({ results: [record] }) }; },
    normalizeAgency: () => ({ launches: 3 }), normalizeLaunch: value => value,
    partition: () => applied++, renderAll: () => rendered++ };
  await vm.runInNewContext(refreshSource + '\nrefresh()', context);
  return { state, calls, rendered, applied };
}
test('failed refresh of an expired cache preserves the snapshot state', async () => {
  const result = await runRefresh({ age: 14 * 3600e3, offline: true });
  assert.equal(result.state.live, false);
  assert.equal(result.applied, 0);
  assert.equal(result.rendered, 0);
});
test('a fresh cache is reusable without a request', async () => {
  const result = await runRefresh({ age: 10 * 60e3, offline: true });
  assert.equal(result.calls, 0);
  assert.equal(result.state.live, true);
  assert.equal(result.applied, 1);
});
test('successful refresh replaces expired data', async () => {
  const result = await runRefresh({ age: 14 * 3600e3 });
  assert.equal(result.calls, 2);
  assert.equal(result.state.live, true);
  assert.equal(result.state.at, now);
  assert.equal(result.state.agency.launches, 3);
});
test('offline without a cache keeps the bundled snapshot', async () => {
  const result = await runRefresh({ age: null, offline: true });
  assert.equal(result.state.live, false);
  assert.equal(result.applied, 0);
});
