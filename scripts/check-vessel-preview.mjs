// Checks export integrity and mesh topology, not biological or clinical accuracy.
import fs from 'node:fs';
function read(file) {
  const b = fs.readFileSync(file), len = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + len)), start = 28 + len;
  const array = id => {
    const a = json.accessors[id], v = json.bufferViews[a.bufferView];
    const off = start + (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    return Array.from({length:a.count * (a.type === 'VEC3' ? 3 : 1)}, (_,i) => a.componentType === 5126 ? b.readFloatLE(off+i*4) : b.readUInt32LE(off+i*4));
  };
  return new Map(json.meshes.map(m => { const p = m.primitives[0]; return [m.name, { positions: array(p.attributes.POSITION), indices: p.indices === undefined ? null : array(p.indices) }]; }));
}
const base='artifacts/anatomy/spl-head-neck/';
const raw=read(base+'skull-vessels.glb'), fit=read(base+'skull-vessels-experimental-fit.glb');
const registration=JSON.parse(fs.readFileSync(base+'experimental-registration.json'));
const matrix=registration.movingCTToFixedMRIRAS;
const regions=JSON.parse(fs.readFileSync(base+'regions.json')).regions;
const results=[];
for(const region of regions.filter(r=>r.category !== 'Skeleton')) {
  const source=raw.get(region.meshName), target=fit.get(region.meshName);
  if (!source || !target || source.positions.length!==target.positions.length) throw new Error('Vertex correspondence lost');
  let error=0;
  for(let i=0;i<source.positions.length;i+=3) {
    const ras=[source.positions[i],-source.positions[i+2],source.positions[i+1],1];
    const transformed=matrix.slice(0,3).map(row=>row.reduce((sum,value,j)=>sum+value*ras[j],0));
    const expected=[transformed[0],transformed[2],-transformed[1]];
    error=Math.max(error,Math.hypot(...expected.map((v,j)=>v-target.positions[i+j])));
  }
  // Weld coincident vertices for topology; the stated tolerance is numerical,
  // not an anatomical acceptance threshold. Count open edges and components.
  const weld=new Map(), ids=[], parent=[];
  for(let i=0;i<source.positions.length;i+=3) {
    const key=source.positions.slice(i,i+3).map(v=>Math.round(v/0.0001)).join(',');
    if(!weld.has(key)){ weld.set(key,parent.length); parent.push(parent.length); }
    ids.push(weld.get(key));
  }
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const edges=new Map();
  let collapsedTriangles=0;
  const indices=source.indices ?? ids.map((_,i)=>i);
  for(let i=0;i<indices.length;i+=3) {
    const t=indices.slice(i,i+3).map(v=>ids[v]);
    if(new Set(t).size<3) collapsedTriangles++;
    for(let j=0;j<3;j++){const a=t[j],b=t[(j+1)%3]; parent[find(a)]=find(b); const key=[a,b].sort((x,y)=>x-y).join(','); edges.set(key,(edges.get(key)??0)+1);}
  }
  const componentTriangles=new Map();
  for(let i=0;i<indices.length;i+=3){const root=find(ids[indices[i]]);componentTriangles.set(root,(componentTriangles.get(root)??0)+1);}
  results.push({name:region.name,vertices:ids.length,triangles:indices.length/3,collapsedTrianglesAtWeldTolerance:collapsedTriangles,
    componentTriangleCounts:[...componentTriangles.values()].sort((a,b)=>b-a),
    connectedComponents:new Set(parent.map((_,i)=>find(i))).size,
    boundaryEdges:[...edges.values()].filter(v=>v===1).length,
    nonmanifoldEdges:[...edges.values()].filter(v=>v>2).length,
    maximumExportTransformResidualMm:error,
    completeAnatomicalCourse:'not established; source labels and vessel names do not establish complete branches or endpoints'});
}
if(results.some(r=>!Number.isFinite(r.maximumExportTransformResidualMm)||r.maximumExportTransformResidualMm>0.001)) throw new Error('Unexpected export transformation residual');
const report={reviewed:'2026-10-05',status:'TECHNICAL CHECK ONLY; anatomical accuracy unquantified',weldToleranceMm:0.0001,
  findings:results,coverage:{vesselMeshes:results.length,circleOfWillis:'absent',basilar:'absent',cerebralArteries:'absent',duralVenousSinuses:'absent'},
  registration:{landmarkResidualsMm:registration.landmarkResidualsMillimetres,reviewer:registration.anatomicalReviewer,method:registration.method},
  interpretation:'Export residual measures faithful application of the chosen transform, not distance to true anatomy. Closed or connected surfaces do not prove full vessel courses. Cross-subject anatomical accuracy needs independent landmarks, source-volume review and expert review; no defensible accuracy percentage exists yet.'};
fs.writeFileSync(base+'vessel-validation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({vessels:results.length,maxExportResidualMm:Math.max(...results.map(r=>r.maximumExportTransformResidualMm)),topology:results.map(({name,connectedComponents,boundaryEdges,nonmanifoldEdges})=>({name,connectedComponents,boundaryEdges,nonmanifoldEdges}))}));
