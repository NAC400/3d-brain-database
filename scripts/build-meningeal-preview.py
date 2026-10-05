"""Build source-backed Z-Anatomy folds and dural sinuses; never invent missing dura.

Input is world-transformed geometry extracted by inspect-z-anatomy.mjs. Helper
labels are excluded. One proper similarity transform is shared across both systems.
"""
from pathlib import Path
import json,struct,sys,numpy as np
work=Path('artifacts/anatomy/z-anatomy');out=Path('frontend/public/models/z-anatomy-meninges');out.mkdir(parents=True,exist_ok=True)
sources=[json.loads((work/(name+'-selected.json')).read_text()) for name in ['nervous','cardio']]
meshes={m['name']:m for source in sources for m in source['meshes']}
correction=json.loads((work/'straight-sinus-correction.json').read_text()) if '--repair-straight' in sys.argv else None
def points(name):
 p=np.array(meshes[name]['points']).reshape(-1,3)
 if correction and name=='Straight_sinus':
  m=np.array(correction['sourceWorldCorrection']);p=p@m[:3,:3].T+m[:3,3]
 return p
# FBX world coordinates: right-labelled structures have negative X; Y is superior,
# Z is anterior. Convert to RAS using a proper axis mapping, then a shared fit.
orientation=np.array([[-1,0,0],[0,0,1],[0,1,0]],float)
def source_ras(names):return np.concatenate([points(n) for n in names])@orientation.T*10
def centre(p):return (p.min(axis=0)+p.max(axis=0))/2
data=Path('frontend/public/models/spl-nac/brain.glb').read_bytes();length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length]);start=28+length
brain={}
for m in g['meshes']:
    a=g['accessors'][m['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']]
    p=np.frombuffer(data,dtype='<f4',count=a['count']*3,offset=start+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3)
    ras=p[:,[0,2,1]].astype(float);ras[:,1]*=-1;brain[m['name']]=ras
anchors=[('pons',['Ponsl','Ponsr'],'SPL_pons'),('right putamen',['Putamenr'],'SPL_right_putamen'),('left putamen',['Putamenl'],'SPL_left_putamen'),('right caudate',['Caudate_nucleusr'],'SPL_right_caudate_nucleus'),('left caudate',['Caudate_nucleusl'],'SPL_left_caudate_nucleus')]
x=np.array([centre(source_ras(names)) for _,names,_ in anchors]);y=np.array([centre(brain[key]) for _,_,key in anchors]);xc=x-x.mean(0);yc=y-y.mean(0)
u,s,vt=np.linalg.svd(xc.T@yc);d=np.diag([1,1,np.linalg.det(u@vt)]);rotation=u@d@vt;scale=float(np.sum(s*np.diag(d))/np.sum(xc**2));translation=y.mean(0)-scale*x.mean(0)@rotation
shape=json.loads(Path('artifacts/anatomy/shape-alignment-experiment.json').read_text()) if '--shape-fit' in sys.argv else None
if shape:
 if not shape['numericalAcceptanceBothHeldOutSurfacesImproveMedianAndP95']:raise ValueError('Held-out numerical check failed')
 fit=np.array(shape['candidateWorldToTargetRAS']);linear=fit[:3,:3]@np.linalg.inv(orientation*10);scale=float(np.cbrt(np.linalg.det(linear)));rotation=linear.T/scale;translation=fit[:3,3]
def transform(p):return scale*p@rotation+translation
holdouts=[{'structure':side+' hippocampus','proxyErrorMm':float(np.linalg.norm(transform(centre(source_ras([name])))-centre(brain[key])))} for side,name,key in [('right','Hippocampusr','SPL_right_hippocampus'),('left','Hippocampusl','SPL_left_hippocampus')]]
matrix=np.eye(4);matrix[:3,:3]=scale*rotation.T@orientation*10;matrix[:3,3]=translation
report={'reviewed':'2026-10-06','status':'ILLUSTRATIVE / UNVALIDATED','sourceRepository':'https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models',
 'sourceFBXHashes':[s['sourceSHA256'] for s in sources],'method':'One proper similarity fit to five matching structure bounding-box centres; FBX world transforms preserved, helper geometry excluded',
 'sourceWorldToTargetRAS':matrix.tolist(),'uniformScaleAfterCentimetresToMillimetres':scale,'fitProxyErrorsMm':np.linalg.norm(transform(x)-y,axis=1).tolist(),'heldOutProxyChecks':holdouts,
 'topologyWeldToleranceSourceWorldUnits':0.000001,'coverage':[],'missing':['outer cranial dura shell','arachnoid membrane','pia mater','separate falx cerebelli','separate diaphragma sellae','separate confluence mesh'],
 'limitations':['Not anatomical landmark validation; no expert review or quantified vessel placement error.','Source anatomy contains symmetric bilateral representations.','Separate atlas from the SPL brain and the fitted skull/arteries; their spatial junctions are unvalidated.','Actual folds only; no procedural outer dura, pia or arachnoid shell is fabricated.','No clinical use.']}
if shape:report.update(method=shape['method'],shapeAlignmentEvaluation=shape)
if correction:report['straightSinusReconstructedPlacement']=correction
selected=[n for n in meshes if n=='Falx_cerebri' or n.startswith('Tentorium_cerebelli') or '_sinus' in n]
report['sinusJunctionProximity']=[]
def gap(a,b):
 a=points(a);b=points(b)
 return float(min(np.sqrt(np.min(np.sum((a[i:i+128,None,:]-b[None,:,:])**2,axis=2))) for i in range(0,len(a),128))*10*scale)
for a,b in [('Inferior_sagittal_sinus','Straight_sinus')]+[(a,b) for side in ['l','r'] for a,b in [('Superior_sagittal_sinus','Transverse_sinus'+side),('Straight_sinus','Transverse_sinus'+side),('Transverse_sinus'+side,'Sigmoid_sinus'+side),('Cavernous_sinus'+side,'Superior_petrosal_sinus'+side),('Cavernous_sinus'+side,'Inferior_petrosal_sinus'+side),('Inferior_petrosal_sinus'+side,'Sigmoid_sinus'+side)]]:
 report['sinusJunctionProximity'].append({'a':a,'b':b,'minimumVertexGapMm':gap(a,b),'interpretation':'Proximity only; neither lumen continuity nor actual drainage pathway is certified.'})
gl={'asset':{'version':'2.0','generator':'MAPPED source-backed meningeal experiment'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[0.8,0.65,0.4,1],'metallicFactor':0,'roughnessFactor':0.8},'doubleSided':True}]};binary=[];offset=0;regions=[]
def accessor(array,kind,type_):
 global offset
 raw=array.tobytes();padding=(-offset)%4
 if padding:binary.append(bytes(padding));offset+=padding
 idx=len(gl['bufferViews']);gl['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)});binary.append(raw);offset+=len(raw)
 a={'bufferView':idx,'componentType':type_,'count':len(array),'type':kind}
 if kind=='VEC3':a.update(min=array.min(0).tolist(),max=array.max(0).tolist())
 gl['accessors'].append(a);return len(gl['accessors'])-1
for name in selected:
 p=points(name);ras=transform(p@orientation.T*10);viewer=ras[:,[0,2,1]].copy();viewer[:,2]*=-1;viewer=viewer.astype('<f4')
 indices=np.array(meshes[name]['indices'] if meshes[name]['indices'] is not None else np.arange(len(p)),dtype='<u4');faces=indices.reshape(-1,3)
 if not np.isfinite(viewer).all() or np.any(indices>=len(p)):raise ValueError('Invalid geometry')
 normals=np.zeros_like(viewer);t=viewer[faces];fn=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0])
 for c in range(3):np.add.at(normals,faces[:,c],fn)
 normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-20)
 mesh_name='ZA_'+name;node=len(gl['meshes']);gl['nodes'].append({'name':mesh_name,'mesh':node});gl['scenes'][0]['nodes'].append(node)
 gl['meshes'].append({'name':mesh_name,'primitives':[{'attributes':{'POSITION':accessor(viewer,'VEC3',5126),'NORMAL':accessor(normals.astype('<f4'),'VEC3',5126)},'indices':accessor(indices,'SCALAR',5125),'material':0,'mode':4}]})
 category='Dural venous sinuses' if '_sinus' in name else 'Dural folds'
 label=name.replace('_',' ')
 if name.endswith(('l','r')) and name!='Falx_cerebri':label=('Left ' if name[-1]=='l' else 'Right ')+name[:-1].replace('_',' ')
 label=label[0].upper()+label[1:]
 if correction and name=='Straight_sinus':label+=' · reconstructed placement'
 regions.append({'meshName':mesh_name,'name':label,'labelId':0,'sourceId':0,'dataset':'z-anatomy-meninges','acronym':'','color':'#60a5fa' if '_sinus' in name else '#cdb485','depth':0,'parentId':None,'parentName':None,'category':category,'sourceFile':name,'registrationStatus':'experimental-unreviewed'})
 # Weld duplicated FBX triangle vertices before auditing topology.
 _,ids=np.unique(np.rint(p/1e-6).astype(np.int64),axis=0,return_inverse=True);parent=list(range(int(ids.max())+1));edges={}
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for face in ids[faces]:
  for a,b in zip(face,np.roll(face,-1)):
   a=int(a);b=int(b);parent[root(a)]=root(b);edge=tuple(sorted((a,b)));edges[edge]=edges.get(edge,0)+1
 report['coverage'].append({'name':label,'sourceObject':name,'vertices':len(p),'triangles':len(faces),'connectedComponents':len(set(root(i) for i in range(len(parent)))),'boundaryEdges':sum(v==1 for v in edges.values()),'nonmanifoldEdges':sum(v>2 for v in edges.values()),'fittedBoundsRASmm':[ras.min(0).tolist(),ras.max(0).tolist()]})
gl['buffers']=[{'byteLength':offset}];j=json.dumps(gl).encode();j+=b' '*((-len(j))%4);b=b''.join(binary);b+=bytes((-len(b))%4)
(out/'folds-and-sinuses.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b)
for folder in [work,out]:(folder/'coverage-and-alignment.json').write_text(json.dumps(report,indent=2))
(out/'regions.json').write_text(json.dumps({'regions':regions},indent=2));Path('frontend/src/data/meningealRegions.json').write_text(json.dumps({'regions':regions},indent=2))
print(json.dumps({'meshes':len(selected),'holdouts':holdouts,'scale':scale,'folds':[r['name'] for r in regions if r['category']=='Dural folds'],'sinuses':sum(r['category']=='Dural venous sinuses' for r in regions)}))
