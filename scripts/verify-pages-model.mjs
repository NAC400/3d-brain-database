import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { GLTFLoader } from '../frontend/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

// Node has no browser ProgressEvent; FileLoader only uses its public fields.
globalThis.ProgressEvent = class { constructor(type, values) { this.type = type; Object.assign(this, values); } };
const directory = path.resolve(process.argv[2] || 'frontend/build/models/spl-nac');
const server = http.createServer((request, response) => {
  const name = path.basename(new URL(request.url, 'http://localhost').pathname);
  if (!/^brain\.pages\.\d+\.bin$/.test(name)) { response.writeHead(404).end(); return; }
  const bytes = fs.readFileSync(path.join(directory, name));
  response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': bytes.length }).end(bytes);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const loader = new GLTFLoader();
  const bytes = fs.readFileSync('frontend/public/models/spl-nac/brain.glb');
  const start = performance.now();
  const original = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const originalMs = performance.now() - start;
  const nextStart = performance.now();
  const packaged = await loader.parseAsync(fs.readFileSync(path.join(directory, 'brain.pages.gltf'), 'utf8'), `http://127.0.0.1:${server.address().port}/`);
  const packagedMs = performance.now() - nextStart;
  function snapshot(gltf) {
    const nodes = [];
    gltf.scene.traverse(object => {
      const record = {
        name: object.name, type: object.type, children: object.children.map(child => child.name),
        matrix: object.matrix.toArray(), userData: object.userData,
      };
      if (object.isMesh) {
        record.attributes = Object.fromEntries(Object.entries(object.geometry.attributes).map(([name, attribute]) =>
          [name, { itemSize: attribute.itemSize, normalized: attribute.normalized, array: attribute.array }]));
        record.indices = object.geometry.index?.array;
        record.material = {
          type: object.material.type, color: object.material.color?.toArray(),
          opacity: object.material.opacity, transparent: object.material.transparent,
          side: object.material.side, metalness: object.material.metalness, roughness: object.material.roughness,
        };
      }
      nodes.push(record);
    });
    return nodes;
  }
  assert.deepEqual(snapshot(packaged), snapshot(original), 'Parsed Three.js scenes differ');
  console.log(JSON.stringify({ identicalThreeJsScenes: true, meshes: snapshot(packaged).filter(x => x.attributes).length,
    originalParseMs: Math.round(originalMs), packagedParseAndLocalFetchMs: Math.round(packagedMs) }, null, 2));
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
