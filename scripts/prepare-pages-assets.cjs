// Repackage GLB buffer views without changing any geometry or scene metadata.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const LIMIT = 25 * 1024 * 1024;
const CHUNK_LIMIT = 24 * 1024 * 1024;
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, process.argv[2] || 'frontend/build');
// Only write inside a separate build tree, never into the canonical public models.
assert(output.startsWith(root + path.sep) && !output.includes(path.sep + 'public'), 'Use a build directory within this repository.');
const source = path.join(root, 'frontend/public/models/spl-nac/brain.glb');
const data = fs.readFileSync(source);
assert.equal(data.readUInt32LE(0), 0x46546c67, 'Expected GLB');
assert.equal(data.readUInt32LE(4), 2, 'Expected GLB v2');
assert.equal(data.readUInt32LE(8), data.length, 'Invalid GLB length');
assert.equal(data.readUInt32LE(16), 0x4e4f534a, 'Expected JSON chunk');
const jsonEnd = 20 + data.readUInt32LE(12);
assert.equal(data.readUInt32LE(jsonEnd + 4), 0x004e4942, 'Expected binary chunk');
const original = JSON.parse(data.subarray(20, jsonEnd).toString('utf8'));
assert.equal(original.buffers.length, 1, 'Expected one embedded buffer');
assert(!original.buffers[0].uri, 'Expected embedded buffer');
assert(!original.extensionsUsed?.some(name => /compression|meshopt|draco/i.test(name)), 'Compressed extensions need a separate conversion review');
const binary = data.subarray(jsonEnd + 8, jsonEnd + 8 + original.buffers[0].byteLength);
const model = structuredClone(original);
const chunks = [];
const buffers = [];
let pieces = [], size = 0;
function finish() {
  if (!pieces.length) return;
  chunks.push(Buffer.concat(pieces, size));
  buffers.push({ uri: `brain.pages.${chunks.length - 1}.bin`, byteLength: size });
  pieces = []; size = 0;
}
for (const view of model.bufferViews) {
  assert.equal(view.buffer, 0);
  assert(view.byteLength <= CHUNK_LIMIT, 'A buffer view exceeds the chunk limit');
  const bytes = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  assert.equal(bytes.length, view.byteLength);
  const padding = (4 - size % 4) % 4;
  if (size + padding + bytes.length > CHUNK_LIMIT) finish();
  const alignedPadding = (4 - size % 4) % 4;
  if (alignedPadding) { pieces.push(Buffer.alloc(alignedPadding)); size += alignedPadding; }
  view.buffer = chunks.length;
  view.byteOffset = size;
  pieces.push(bytes); size += bytes.length;
}
finish();
model.buffers = buffers;

// Compare every buffer view and all metadata except the changed storage locations.
for (let i = 0; i < original.bufferViews.length; i++) {
  const old = original.bufferViews[i], next = model.bufferViews[i];
  assert.deepEqual({ ...next, buffer: old.buffer, byteOffset: old.byteOffset }, old);
  assert(binary.subarray(old.byteOffset || 0, (old.byteOffset || 0) + old.byteLength)
    .equals(chunks[next.buffer].subarray(next.byteOffset, next.byteOffset + next.byteLength)), `Buffer view ${i} changed`);
}
assert.deepEqual({ ...model, buffers: original.buffers, bufferViews: original.bufferViews }, original);
const directory = path.join(output, 'models/spl-nac');
fs.mkdirSync(directory, { recursive: true });
chunks.forEach((chunk, i) => fs.writeFileSync(path.join(directory, buffers[i].uri), chunk));
fs.writeFileSync(path.join(directory, 'brain.pages.gltf'), JSON.stringify(model));
// Remove only the oversized copy from the build; retain the original source GLB.
const builtGlb = path.join(directory, 'brain.glb');
if (fs.existsSync(builtGlb)) fs.unlinkSync(builtGlb);
const files = fs.readdirSync(output, { recursive: true }).map(name => path.join(output, name)).filter(name => fs.statSync(name).isFile());
const oversized = files.filter(name => fs.statSync(name).size > LIMIT);
assert.equal(oversized.length, 0, `Files exceed the Pages limit: ${oversized.join(', ')}`);
assert(files.length <= 20000, 'Pages free file-count limit exceeded');
const report = {
  originalSha256: crypto.createHash('sha256').update(data).digest('hex'),
  geometryViewsVerified: original.bufferViews.length,
  meshes: original.meshes.length,
  originalBytes: data.length,
  buffers: buffers.map(b => ({ ...b, sha256: crypto.createHash('sha256').update(chunks[buffers.indexOf(b)]).digest('hex') })),
  fileCount: files.length,
  largestFileBytes: Math.max(...files.map(name => fs.statSync(name).size)),
};
fs.writeFileSync(path.join(output, 'pages-model-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
