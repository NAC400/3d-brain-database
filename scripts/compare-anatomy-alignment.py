"""Evaluate alternatives without silently replacing published anatomy transforms."""
from pathlib import Path
import sys,json,struct,numpy as np
sys.path.insert(0,str(Path('artifacts/anatomy/python-deps').resolve()))
import SimpleITK as sitk
sitk.ProcessObject.SetGlobalDefaultNumberOfThreads(4)
label_image=sitk.ReadImage(sys.argv[1]);labels=sitk.GetArrayFromImage(label_image)
depth=sitk.GetArrayFromImage(sitk.SignedMaurerDistanceMap(label_image==10,insideIsPositive=True,squaredDistance=False,useImageSpacing=True))
data=Path('frontend/public/models/spl-nac/brain.glb').read_bytes();length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length]);start=28+length;vertices=[]
for m in g['meshes']:
 a=g['accessors'][m['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']]
 p=np.frombuffer(data,dtype='<f4',count=a['count']*3,offset=start+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3)
 ras=p[:,[0,2,1]].astype(float);ras[:,1]*=-1;vertices.append(ras)
ras=np.concatenate(vertices);lps=ras*[-1,-1,1]
report={'reviewed':'2026-10-05','skullAlternatives':[],'arterialAlternatives':[],'independentAnatomicalReviewer':None}
for name in ['rigid-registration.json','experimental-registration.json']:
 r=json.loads((Path('artifacts/anatomy/spl-head-neck')/name).read_text());matrix=np.array(r['fixedMRIToMovingCTLPS']);p=(np.c_[lps,np.ones(len(lps))]@matrix.T)[:,:3]
 xyz=np.rint(((p-np.array(label_image.GetOrigin()))@np.linalg.inv(np.array(label_image.GetDirection()).reshape(3,3)).T)/label_image.GetSpacing()).astype(int)
 valid=np.all((xyz>=0)&(xyz<np.array(labels.shape[::-1])),axis=1);q=xyz[valid];values=labels[q[:,2],q[:,1],q[:,0]];bone_depth=depth[q[:,2],q[:,1],q[:,0]][values==10]
 report['skullAlternatives'].append({'transform':name,'boneLabelSurfaceSamples':int(np.sum(values==10)),'samplesMoreThan2mmInsideBone':int(np.sum(bone_depth>2)),'maximumSampledDepthMm':float(np.max(bone_depth))})

# Compare the current similarity fit with an affine fitted to the SAME proxies.
# A lower training error alone is not grounds to publish a more deforming fit.
central=json.loads(Path('frontend/public/models/bodyparts3d-central/coverage-and-alignment.json').read_text());rows=central['fittingProxyCentres'];x=np.array([r['sourceRASmm'] for r in rows]);y=np.array([r['targetRASmm'] for r in rows])
affine=np.linalg.lstsq(np.c_[x,np.ones(len(x))],y,rcond=None)[0]
report['arterialAlternatives'].append({'method':'Current similarity','trainingProxyErrorsMm':[r['errorMm'] for r in central['fittingProxyErrorsMm']],'heldOutProxyErrorsMm':[r['proxyCentreErrorMm'] for r in central['heldOutProxyChecks']]})
def obj(id_):return np.array([list(map(float,l.split()[1:4])) for l in (Path('artifacts/anatomy/bodyparts3d-candidates')/(id_+'.obj')).read_text().splitlines() if l.startswith('v ')])
def centre(p):return (p.min(0)+p.max(0))/2
target={m['name']:None for m in g['meshes']}
for m in g['meshes']:
 if 'hippocampus' not in m['name']:continue
 a=g['accessors'][m['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']];p=np.frombuffer(data,dtype='<f4',count=a['count']*3,offset=start+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3);p=p[:,[0,2,1]].astype(float);p[:,1]*=-1;target[m['name']]=centre(p)
errors=[]
for id_,key in [('FJ1807','SPL_right_hippocampus'),('FJ1759','SPL_left_hippocampus')]:
 p=centre(obj(id_)*[-1,-1,1]);errors.append(float(np.linalg.norm(np.r_[p,1]@affine-target[key])))
report['arterialAlternatives'].append({'method':'Five-proxy unconstrained affine (not released)','trainingProxyErrorsMm':np.linalg.norm(np.c_[x,np.ones(len(x))]@affine-y,axis=1).tolist(),'heldOutProxyErrorsMm':errors,'principalScales':np.linalg.svd(affine[:3],compute_uv=False).tolist(),'determinant':float(np.linalg.det(affine[:3]))})
report['decision']='No alternative is anatomically accepted. Retain current transforms and warnings; proxy fitting and collision screens do not replace independent landmarks, vascular target images and expert review. An affine training-error reduction is not validation.'
report['limitations']='Skull metrics are nearest-voxel surface screens, not overlap volume or target registration errors. Brain-structure centres are proxies, not independent anatomical landmarks. Cross-atlas membranes and vessel junctions remain unvalidated.'
out=Path('artifacts/anatomy/alignment-comparison.json');out.write_text(json.dumps(report,indent=2));print(json.dumps(report))
