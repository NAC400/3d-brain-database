// Convert the upstream SPL/NAC VTK surfaces without mirroring or decimation.
// Usage: node scripts/convert-spl-atlas.mjs <extracted atlas directory>
import fs from 'node:fs';
import path from 'node:path';
import { VTKLoader } from '../frontend/node_modules/three/examples/jsm/loaders/VTKLoader.js';

const sourceDir = process.argv[2];
if (!sourceDir) throw new Error('Provide the extracted SPL atlas directory.');
// Head/neck assets are staged outside public/ until registration is validated.
// Usage: node scripts/convert-spl-atlas.mjs <head-neck directory> --head-neck
const headNeck = process.argv.includes('--head-neck');
const registrationPath = process.argv.find(arg => arg.startsWith('--registration='))?.slice('--registration='.length);
if (registrationPath && !headNeck) throw new Error('Experimental fitting is allowed only for staged head assets.');
const registration = registrationPath ? JSON.parse(fs.readFileSync(registrationPath)) : null;
const fit = registration?.movingCTToFixedMRIRAS;
if (registration && (!Array.isArray(fit) || fit.length !== 4 || fit.some(row => row.length !== 4 || row.some(value => !Number.isFinite(value))))) throw new Error('Invalid registration matrix');
const outputDir = headNeck ? 'artifacts/anatomy/spl-head-neck' : 'frontend/public/models/spl-nac';
const headIds = new Set([10, 25, 101, 102, 105, 106, 107, 108, 109, 110, 111, 112]);
const records = JSON.parse(fs.readFileSync(path.join(sourceDir, 'atlasStructure.json')));
const byId = new Map(records.map(record => [record['@id'], record]));
const loader = new VTKLoader();
const regions = [], binary = [];
let byteLength = 0;
const gltf = { asset: { version: '2.0', generator: 'MAPPED SPL/NAC VTK converter' }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [] };
function accessor(array, type, componentType, bounds) {
  const padding = (4 - byteLength % 4) % 4;
  if (padding) { binary.push(Buffer.alloc(padding)); byteLength += padding; }
  const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const view = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: buffer.length });
  binary.push(buffer); byteLength += buffer.length;
  const index = gltf.accessors.length;
  gltf.accessors.push({ bufferView: view, componentType, count: array.length / (type === 'VEC3' ? 3 : 1), type, ...bounds });
  return index;
}
function category(name) {
  if (/ventricle|aqueduct|pellucid/i.test(name)) return 'Ventricles & CSF';
  if (/cerebell|left-\w|right-\w/i.test(name)) return 'Metencephalon (Cerebellum)';
  if (/white matter|callosum|commissure|fornix|tract|capsule/i.test(name)) return 'White Matter';
  if (/hippocamp|amygdal/i.test(name)) return 'Telencephalon – Hippocampus & Amygdala';
  if (/caudate|putamen|pallid|accumbens/i.test(name)) return 'Telencephalon – Basal Ganglia';
  if (/thalam|pulvinar|geniculate|pineal|hypophys/i.test(name)) return 'Diencephalon';
  if (/pons/i.test(name)) return 'Metencephalon (Pons)';
  if (/medulla/i.test(name)) return 'Myelencephalon (Medulla)';
  if (/midbrain|substantia|red nucleus|collicul/i.test(name)) return 'Mesencephalon (Midbrain)';
  if (/insula/i.test(name)) return 'Telencephalon – Insula';
  if (/cingul/i.test(name)) return 'Telencephalon – Limbic Lobe';
  if (/frontal|precentral|straight gyrus|paracentral/i.test(name)) return 'Telencephalon – Frontal Lobe';
  if (/temporal|fusiform/i.test(name)) return 'Telencephalon – Temporal Lobe';
  if (/occipital|cuneus|lingual|visual cortex/i.test(name)) return 'Telencephalon – Occipital Lobe';
  if (/parietal|postcentral|supramarginal/i.test(name)) return 'Telencephalon – Parietal Lobe';
  return 'Telencephalon – Cerebral Nuclei';
}
for (const record of records.filter(r => r['@type'] === 'Structure')) {
  const selector = record.sourceSelector?.find(s => s['@type']?.includes('GeometrySelector'));
  const file = byId.get(selector?.dataSource)?.source;
  if (!file?.endsWith('.vtk')) continue;
  const sourceId = Number(file.match(/Model_(\d+)_/)?.[1]);
  // External face/neck meshes and sulcal line annotations are not brain surfaces.
  if (headNeck ? !headIds.has(sourceId) : sourceId === 3 || sourceId >= 4000) continue;
  const nestedFile = path.join(sourceDir, file);
  const bytes = fs.readFileSync(fs.existsSync(nestedFile) ? nestedFile : path.join(sourceDir, path.basename(file)));
  const geometry = loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const positions = geometry.getAttribute('position');
  // Upstream VTK is RAS (right/anterior/superior). Bake RAS into Three's Y-up:
  // x=R, y=S, z=-A. This is a proper rotation, applied identically to every mesh.
  for (let i = 0; i < positions.count; i++) {
    if (fit) {
      // One physical-space transform applies to every head structure. This
      // experimental output stays in the workbench, never in public assets.
      const point = [positions.getX(i), positions.getY(i), positions.getZ(i), 1];
      positions.setXYZ(i, ...fit.slice(0, 3).map(row => row.reduce((sum, value, j) => sum + value * point[j], 0)));
    }
    const anterior = positions.getY(i), superior = positions.getZ(i);
    positions.setY(i, superior); positions.setZ(i, -anterior);
  }
  geometry.deleteAttribute('normal'); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!Number.isFinite(box.min.x) || positions.count === 0) throw new Error(`Empty geometry: ${file}`);
  const color = (record.renderOption?.color?.match(/\d+/g) ?? ['148','163','184']).map(Number);
  const name = record.annotation?.name ?? path.basename(file, '.vtk');
  const meshName = `${headNeck ? 'SPL_HN' : 'SPL'}_${record['@id'].slice(1)}`;
  const pos = accessor(new Float32Array(positions.array), 'VEC3', 5126, { min: box.min.toArray(), max: box.max.toArray() });
  const normal = accessor(new Float32Array(geometry.getAttribute('normal').array), 'VEC3', 5126);
  const primitive = { attributes: { POSITION: pos, NORMAL: normal }, material: gltf.materials.length, mode: 4 };
  if (geometry.index) primitive.indices = accessor(new Uint32Array(geometry.index.array), 'SCALAR', 5125);
  gltf.materials.push({ name, doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [...color.map(c => c / 255), 1], metallicFactor: 0, roughnessFactor: 0.8 } });
  gltf.scenes[0].nodes.push(gltf.nodes.length);
  gltf.nodes.push({ name: meshName, mesh: gltf.meshes.length });
  gltf.meshes.push({ name: meshName, primitives: [primitive] });
  // SPL IDs are not Allen IDs. Zero prevents sending them to the Allen API.
  regions.push({ meshName, labelId: 0, sourceId, dataset: headNeck ? 'spl-head-neck-2016-09' : 'spl-nac-2017', name, acronym: '', color: `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`, depth: 0, parentId: null, parentName: null, category: headNeck ? /jugular/.test(name) ? 'Veins' : /carotid|artery/.test(name) ? 'Arteries' : 'Skeleton' : category(name), sourceFile: file, ...(headNeck ? { registrationStatus: registration ? 'experimental-unreviewed' : 'unregistered' } : {}) });
}
gltf.buffers.push({ byteLength });
let json = Buffer.from(JSON.stringify(gltf)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
let bin = Buffer.concat(binary); bin = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + bin.length, 8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(json.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length); binHeader.writeUInt32LE(0x004e4942, 4);
fs.mkdirSync(outputDir, { recursive: true });
const modelPath = path.join(outputDir, headNeck ? registration ? 'skull-vessels-experimental-fit.glb' : 'skull-vessels.glb' : 'brain.glb');
fs.writeFileSync(modelPath, Buffer.concat([header, jsonHeader, json, binHeader, bin]));
fs.writeFileSync(path.join(outputDir, registration ? 'experimental-fit-regions.json' : 'regions.json'), JSON.stringify({ regions }, null, 2));
console.log(JSON.stringify({ regions: regions.length, left: regions.filter(r => /\bleft\b|left_/.test(r.name)).length, right: regions.filter(r => /\bright\b|right_/.test(r.name)).length, bytes: fs.statSync(modelPath).size, output: modelPath }));
