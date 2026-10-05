"""Source-guided placement correction; NOT a new clinical segmentation.

Map existing open tube endpoints to the published posterior inferior-sagittal
endpoint and confluence annotation. Preserve radial distances and mesh topology;
only stretch along the endpoint axis, then rotate/translate. Record every change.
"""
from pathlib import Path
import json,hashlib,numpy as np
base=Path('artifacts/anatomy/z-anatomy');r=json.loads((base/'cardio-selected.json').read_text());meshes={m['name']:m for m in r['meshes']}
def p(name):return np.array(meshes[name]['points']).reshape(-1,3)
def endpoints(name):
 points=p(name);_,ids=np.unique(np.rint(points/1e-5).astype(np.int64),axis=0,return_inverse=True)
 indices=np.array(meshes[name]['indices'] if meshes[name]['indices'] is not None else np.arange(len(points))).reshape(-1,3);edges={}
 for face in ids[indices]:
  for a,b in zip(face,np.roll(face,-1)):
   key=tuple(sorted((int(a),int(b))));edges[key]=edges.get(key,0)+1
 adjacency={}
 for (a,b),count in edges.items():
  if count==1:adjacency.setdefault(a,set()).add(b);adjacency.setdefault(b,set()).add(a)
 groups=[];seen=set()
 for a in adjacency:
  if a in seen:continue
  todo=[a];group=[]
  while todo:
   a=todo.pop()
   if a in seen:continue
   seen.add(a);group.append(a);todo.extend(adjacency[a]-seen)
  groups.append(group)
 if len(groups)!=2:raise ValueError('Expected two open source end rings: '+name)
 unique=np.array([points[np.flatnonzero(ids==i)[0]] for i in range(int(ids.max())+1)])
 return [unique[g].mean(0) for g in groups]
old=sorted(endpoints('Straight_sinus'),key=lambda v:v[1],reverse=True)
inferior=sorted(endpoints('Inferior_sagittal_sinus'),key=lambda v:v[2])[0]
canonical=json.loads((base/'canonical-selected.json').read_text());annotation=next(m for m in canonical['meshes'] if m['name']=='Confluence of sinuses.j')
# Canonical metres XYZ=(left,posterior,superior); FBX cm=(left,superior,anterior).
anchor=np.array(annotation['points']).reshape(-1,3)[:,[0,2,1]]*100;anchor[:,2]*=-1
transverse=np.concatenate([p('Transverse_sinusl'),p('Transverse_sinusr')])
confluence=min(anchor,key=lambda v:np.min(np.linalg.norm(transverse-v,axis=1)))
a,b=old;u=(b-a)/np.linalg.norm(b-a);v=(confluence-inferior)/np.linalg.norm(confluence-inferior)
cross=np.cross(u,v);c=float(u@v);skew=np.array([[0,-cross[2],cross[1]],[cross[2],0,-cross[0]],[-cross[1],cross[0],0]])
rotation=np.eye(3)+skew+skew@skew/(1+c)
stretch=float(np.linalg.norm(confluence-inferior)/np.linalg.norm(b-a));linear=rotation@(np.eye(3)+(stretch-1)*np.outer(u,u));translation=inferior-linear@a
original=p('Straight_sinus');corrected=original@linear.T+translation
if not np.allclose(linear@a+translation,inferior,atol=1e-8) or not np.allclose(linear@b+translation,confluence,atol=1e-8):raise ValueError('Endpoint correction failed')
matrix=np.eye(4);matrix[:3,:3]=linear;matrix[:3,3]=translation
if not np.allclose(np.sort(np.linalg.svd(linear,compute_uv=False)),np.sort([1,1,stretch]),atol=1e-8) or np.linalg.det(linear)<=0:raise ValueError('Radial dimensions or handedness changed')
report={'reviewed':'2026-10-06','status':'SOURCE-GUIDED RECONSTRUCTED PLACEMENT; NOT ANATOMICALLY VALIDATED','sourceObject':'Straight_sinus',
 'canonicalFinding':'Canonical Startup.blend reproduces the gap; no export-only fix exists.',
 'canonicalSelectedSHA256':hashlib.sha256((base/'canonical-selected.json').read_bytes()).hexdigest(),
 'method':'Existing tube topology retained. Two boundary-ring centres map to posterior inferior-sagittal ring centre and nearest source confluence annotation endpoint. Proper rotation and longitudinal-only scaling preserve cross-sectional distances.',
 'sourceWorldCorrection':matrix.tolist(),'originalRingCentresCm':[a.tolist(),b.tolist()],'targetRingCentresCm':[inferior.tolist(),confluence.tolist()],
 'longitudinalScale':stretch,'radialScale':1.0,'determinant':float(np.linalg.det(linear)),
 'beforeNearestVertexGapsCm':{},'afterNearestVertexGapsCm':{},
 'limitations':['Source annotation is not an independently validated landmark.','Corrected position/course requires anatomical expert review.','Tube contact/proximity is not proof of a fused or physiologically connected lumen.','No new branches or confluence volume were fabricated.']}
for name in ['Inferior_sagittal_sinus','Transverse_sinusl','Transverse_sinusr']:
 def gap(points):return min(np.sqrt(np.min(np.sum((points[i:i+128,None,:]-p(name)[None,:,:])**2,axis=2))) for i in range(0,len(points),128))
 report['beforeNearestVertexGapsCm'][name]=float(gap(original));report['afterNearestVertexGapsCm'][name]=float(gap(corrected))
(base/'straight-sinus-correction.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
