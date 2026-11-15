// One-off generator for src/data/land-mask.json, the coarse land/sea grid behind the
// dot-matrix globe on /launches/. Source: Natural Earth 1:110m land (public domain),
// via the world-atlas package. Re-run only if the grid resolution needs to change:
//   node scripts/make-land-mask.mjs
import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json';
const STEP = 1.5; // degrees per cell
const cols = 360 / STEP, rows = 180 / STEP;

const topology = await (await fetch(SOURCE)).json();
const { scale, translate } = topology.transform;
const arcs = topology.arcs.map(arc => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => [(x += dx) * scale[0] + translate[0], (y += dy) * scale[1] + translate[1]]);
});
const ring = indexes => indexes.flatMap(index => (index < 0 ? arcs[~index].slice().reverse() : arcs[index]));
const rings = [];
const collect = geometry => {
  if (geometry.type === 'GeometryCollection') geometry.geometries.forEach(collect);
  else if (geometry.type === 'Polygon') geometry.arcs.forEach(r => rings.push(ring(r)));
  else if (geometry.type === 'MultiPolygon') geometry.arcs.forEach(polygon => polygon.forEach(r => rings.push(ring(r))));
};
collect(topology.objects.land);

// Even-odd rule across every ring, so lakes cut out of land without special handling.
const isLand = (lon, lat) => {
  let inside = false;
  for (const points of rings) {
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
};

const bytes = new Uint8Array(Math.ceil((cols * rows) / 8));
let land = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (!isLand(-180 + (c + 0.5) * STEP, 90 - (r + 0.5) * STEP)) continue;
    bytes[(r * cols + c) >> 3] |= 1 << ((r * cols + c) & 7);
    land++;
  }
}
const mask = { source: 'Natural Earth 1:110m land (public domain)', cols, rows, bits: Buffer.from(bytes).toString('base64') };
await writeFile(new URL('../src/data/land-mask.json', import.meta.url), JSON.stringify(mask) + '\n');
console.log(`Wrote ${cols}x${rows} grid, ${land} land cells (${((land / (cols * rows)) * 100).toFixed(1)}%).`);
