// Technical inventory only: bounding-box overlap is not anatomical registration.
import fs from 'node:fs';
import crypto from 'node:crypto';

function inspect(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`Invalid GLB: ${file}`);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binStart = 28 + jsonLength;
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const meshes = gltf.meshes.map(mesh => {
    let vertices = 0, triangles = 0;
    for (const primitive of mesh.primitives) {
      const pos = gltf.accessors[primitive.attributes.POSITION];
      const view = gltf.bufferViews[pos.bufferView];
      const start = binStart + (view.byteOffset ?? 0) + (pos.byteOffset ?? 0);
      for (let i = 0; i < pos.count * 3; i++) {
        const value = bytes.readFloatLE(start + i * 4);
        if (!Number.isFinite(value)) throw new Error(`Nonfinite vertex: ${mesh.name}`);
        bounds.min[i % 3] = Math.min(bounds.min[i % 3], value);
        bounds.max[i % 3] = Math.max(bounds.max[i % 3], value);
      }
      vertices += pos.count;
      if (primitive.indices !== undefined) {
        const index = gltf.accessors[primitive.indices];
        const indexView = gltf.bufferViews[index.bufferView];
        if (index.componentType !== 5125 || index.count % 3) throw new Error('Unsupported or malformed indices');
        const offset = binStart + (indexView.byteOffset ?? 0) + (index.byteOffset ?? 0);
        for (let i = 0; i < index.count; i++) if (bytes.readUInt32LE(offset + i * 4) >= pos.count) throw new Error('Index out of range');
        triangles += index.count / 3;
      } else {
        if (pos.count % 3) throw new Error('Incomplete triangles');
        triangles += pos.count / 3;
      }
    }
    return { name: mesh.name, vertices, triangles };
  });
  return { sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, bounds, center: bounds.min.map((v, i) => (v + bounds.max[i]) / 2), meshes };
}

const brain = inspect('frontend/public/models/spl-nac/brain.glb');
const experimental = process.argv.includes('--experimental');
const head = inspect('artifacts/anatomy/spl-head-neck/' + (experimental ? 'skull-vessels-experimental-fit.glb' : 'skull-vessels.glb'));
const metadata = JSON.parse(fs.readFileSync('artifacts/anatomy/spl-head-neck/regions.json'));
if (head.meshes.length !== 12 || metadata.regions.length !== 12) throw new Error('Unexpected selected coverage');
const report = {
  status: experimental ? 'experimental affine fit; NOT anatomically validated or released' : 'unregistered; not released in Explorer',
  brain, head,
  coverage: metadata.regions.map(({ name, sourceId, sourceFile, category }) => ({ name, sourceId, sourceFile, category })),
  missing: ['intracranial arterial tree', 'dural venous sinuses', 'dura', 'falx', 'tentorium', 'arachnoid', 'pia'],
  registration: {
    headToBrainRAS: experimental ? JSON.parse(fs.readFileSync('artifacts/anatomy/spl-head-neck/experimental-registration.json')).movingCTToFixedMRIRAS : null,
    reason: experimental ? 'Automatically estimated cross-subject affine transform; no landmark or anatomical validation.' : 'Different CT and MRI acquisitions; no cross-atlas transform supplied.',
    viewerRotation: [[1, 0, 0], [0, 0, 1], [0, -1, 0]],
    sharedViewerOriginMillimetres: brain.center,
    sharedViewerScale: 0.01,
    requiredOrder: 'Head source RAS -> validated CT-to-brain MRI registration -> viewer rotation -> subtract brain origin -> scale. Never independently center layers.',
    releaseGate: 'Source orientation confirmed; registration measured against independent landmarks and orthogonal volume views; skull enclosure and vessel courses anatomically reviewed.',
  },
};
fs.writeFileSync('artifacts/anatomy/spl-head-neck/' + (experimental ? 'experimental-geometry-audit.json' : 'registration-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ meshes: head.meshes.length, brainCenter: brain.center, headBounds: head.bounds, registration: report.status }));
