"""Compare labelled, symmetric trimmed ICP against the existing proxy fit.

Hippocampi are withheld. Surface samples and numerical improvements are NOT
independent anatomical validation. No transform is applied by this experiment.
"""
from pathlib import Path
import json,struct,sys,numpy as np
sys.path.insert(0,str(Path('artifacts/anatomy/alignment-deps').resolve()))
from scipy.spatial import cKDTree
base=Path('artifacts/anatomy/z-anatomy')
models=json.loads((base/'nervous-selected.json').read_text())['meshes'];models={m['name']:m for m in models}
orientation=np.array([[-1,0,0],[0,0,1],[0,1,0]],float)*10
bodyparts='--bodyparts' in sys.argv
if bodyparts:
 aliases={'Ponsl':'FJ1775','Ponsr':'FJ1822','Putamenr':'FJ1823','Putamenl':'FJ1776','Caudate_nucleusr':'FJ1802','Caudate_nucleusl':'FJ1754','Hippocampusr':'FJ1807','Hippocampusl':'FJ1759'}
 models={name:{'points':np.array([list(map(float,l.split()[1:4])) for l in (Path('artifacts/anatomy/bodyparts3d-candidates')/(id_+'.obj')).read_text().splitlines() if l.startswith('v ')]).ravel().tolist()} for name,id_ in aliases.items()}
 orientation=np.diag([-1,-1,1])
def source(names):return np.concatenate([np.array(models[n]['points']).reshape(-1,3)@orientation.T for n in names])
data=Path('frontend/public/models/spl-nac/brain.glb').read_bytes();length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length]);start=28+length
brain={}
for m in g['meshes']:
 a=g['accessors'][m['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']];p=np.frombuffer(data,dtype='<f4',count=a['count']*3,offset=start+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3);ras=p[:,[0,2,1]].astype(float);ras[:,1]*=-1;brain[m['name']]=ras
anchors=[('pons',['Ponsl','Ponsr'],'SPL_pons'),('right putamen',['Putamenr'],'SPL_right_putamen'),('left putamen',['Putamenl'],'SPL_left_putamen'),('right caudate',['Caudate_nucleusr'],'SPL_right_caudate_nucleus'),('left caudate',['Caudate_nucleusl'],'SPL_left_caudate_nucleus')]
withheld=[('right hippocampus',['Hippocampusr'],'SPL_right_hippocampus'),('left hippocampus',['Hippocampusl'],'SPL_left_hippocampus')]
rng=np.random.default_rng(20261006)
def sample(p):
 p=np.unique(np.round(p,5),axis=0)
 return p[rng.choice(len(p),min(1500,len(p)),replace=False)]
pairs=[(name,sample(source(names)),sample(brain[key])) for name,names,key in anchors+withheld]
initial=json.loads(Path('frontend/public/models/'+('bodyparts3d-central' if bodyparts else 'z-anatomy-meninges')+'/coverage-and-alignment.json').read_text());world=np.array(initial.get('shapeAlignmentEvaluation',{}).get('initialWorldToTargetRAS',initial['sourceXYZToTargetRAS'] if bodyparts else initial['sourceWorldToTargetRAS']));matrix=np.eye(4);matrix[:3,:3]=world[:3,:3]@np.linalg.inv(orientation);matrix[:3,3]=world[:3,3]
def apply(p,m):return p@m[:3,:3].T+m[:3,3]
def evaluate(m):
 result=[]
 for name,a,b in pairs:
  aa=apply(a,m);d=np.r_[cKDTree(b).query(aa)[0],cKDTree(aa).query(b)[0]]
  result.append({'structure':name,'medianSurfaceDistanceMm':float(np.median(d)),'p95SurfaceDistanceMm':float(np.percentile(d,95)),'sampleMeanDifferenceMm':float(np.linalg.norm(aa.mean(0)-b.mean(0)))})
 return result
before=evaluate(matrix);candidate=matrix.copy();history=[]
for iteration in range(100):
 sources=[];targets=[]
 for _,a,b in pairs[:5]:
  aa=apply(a,candidate);distance,index=cKDTree(b).query(aa);keep=distance<=np.percentile(distance,80)
  sources.append(a[keep]);targets.append(b[index[keep]])
  distance,index=cKDTree(aa).query(b);keep=distance<=np.percentile(distance,80)
  sources.append(a[index[keep]]);targets.append(b[keep])
 x=np.concatenate(sources);y=np.concatenate(targets);xc=x-x.mean(0);yc=y-y.mean(0);u,s,vt=np.linalg.svd(xc.T@yc);d=np.diag([1,1,np.linalg.det(u@vt)]);r=u@d@vt;scale=np.sum(s*np.diag(d))/np.sum(xc**2)
 if not .8<=scale<=1.2:raise ValueError('Similarity scale outside experiment bounds')
 new=np.eye(4);new[:3,:3]=scale*r.T;new[:3,3]=y.mean(0)-scale*x.mean(0)@r
 change=float(np.max(np.linalg.norm(apply(x,new)-apply(x,candidate),axis=1)));candidate=new;history.append(change)
 if change<0.001:break
after=evaluate(candidate)
accepted=all(after[i]['medianSurfaceDistanceMm']<before[i]['medianSurfaceDistanceMm'] and after[i]['p95SurfaceDistanceMm']<before[i]['p95SurfaceDistanceMm'] for i in [5,6])
report={'reviewed':'2026-10-06','method':'Labelled symmetric point ICP; trim worst 20 percent per direction; proper uniform similarity; deterministic unique vertex samples; five training structures; both hippocampi withheld',
 'iterations':len(history),'initialWorldToTargetRAS':world.tolist(),'candidateWorldToTargetRAS':(candidate@np.block([[orientation,np.zeros((3,1))],[np.zeros((1,3)),np.ones((1,1))]])).tolist(),
 'before':before,'after':after,'numericalAcceptanceBothHeldOutSurfacesImproveMedianAndP95':accepted,'anatomicallyValidated':False,
 'limitations':['Different references and source symmetry.','Vertex samples are not uniform-area samples and mesh tessellation influences metrics.','Withheld atlas surfaces are not independently annotated target vascular landmarks.','Numerical acceptance does not establish clinical anatomy, skull enclosure or vessel courses.']}
Path('artifacts/anatomy/'+('bodyparts-' if bodyparts else '')+'shape-alignment-experiment.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
