// Read the source FBX scene hierarchy and world transforms before selecting assets.
import fs from 'node:fs';
import { FBXLoader } from '../frontend/node_modules/three/examples/jsm/loaders/FBXLoader.js';
import { Box3, Mesh, Vector3 } from '../frontend/node_modules/three/build/three.module.js';
import crypto from 'node:crypto';
const bytes=fs.readFileSync(process.argv[2]);
const scene=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const meshes=[];
const selected=[];
scene.traverse(o=>{
  if(!(o instanceof Mesh))return;
  const position=o.geometry.attributes.position,points=[];const point=new Vector3();
  for(let i=0;i<position.count;i++){point.fromBufferAttribute(position,i).applyMatrix4(o.matrixWorld);points.push(point.x,point.y,point.z);}
  const box=new Box3().setFromArray(points);
  meshes.push({name:o.name,vertices:position.count,bounds:box.min.toArray().concat(box.max.toArray())});
  // Empty 'j' helper objects are annotations, not downloadable anatomy meshes.
  if(position.count && (/^Falx_cerebri$|^Tentorium_cerebelli[lr]$|^(Superior_sagittal|Inferior_sagittal|Straight|Occipital|Anterior_intercavernous|Posterior_intercavernous|Cavernous|Sigmoid|Transverse|Superior_petrosal|Inferior_petrosal)_sinus[lr]?$/.test(o.name)||/^(Pons|Putamen|Caudate_nucleus|Hippocampus)[lr]$/.test(o.name)))selected.push({name:o.name,points,indices:o.geometry.index?Array.from(o.geometry.index.array):null});
});
fs.mkdirSync('artifacts/anatomy/z-anatomy',{recursive:true});
fs.writeFileSync(`artifacts/anatomy/z-anatomy/${process.argv[3]??'inventory'}.json`,JSON.stringify(meshes,null,2));
fs.writeFileSync(`artifacts/anatomy/z-anatomy/${process.argv[3]??'inventory'}-selected.json`,JSON.stringify({sourceSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),sourcePath:process.argv[2],meshes:selected}));
console.log(JSON.stringify(meshes.filter(m=>/dura|falx|tentor|arachnoid|pia_|sinus|pons|putamen|caudate|hippocamp/i.test(m.name))));
