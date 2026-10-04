"""Audit BodyParts3D arterial coverage and make an explicitly experimental preview.

One orientation-preserving similarity fit from brain-structure bounding-box centres
is applied to all vessels. Proxy centres are NOT anatomical landmark ground truth.
No separate vessel nudges, synthetic connectors, or new mirrored geometry.
"""
from pathlib import Path
import json, struct, hashlib, csv, sys
import numpy as np

source=Path('artifacts/anatomy/bodyparts3d-candidates')
out=Path('frontend/public/models/bodyparts3d-central');out.mkdir(parents=True,exist_ok=True)
work=Path('artifacts/anatomy/bodyparts3d-central');work.mkdir(parents=True,exist_ok=True)

def obj(id_):
    vertices=[];faces=[]
    for line in (source/(id_+'.obj')).read_text().splitlines():
        if line.startswith('v '): vertices.append(list(map(float,line.split()[1:4])))
        if line.startswith('f '):
            indices=[int(v.split('/')[0])-1 for v in line.split()[1:]]
            faces.extend([[indices[0],indices[j],indices[j+1]] for j in range(1,len(indices)-1)])
    return np.array(vertices),np.array(faces,dtype='<u4')

data=Path('frontend/public/models/spl-nac/brain.glb').read_bytes();length=struct.unpack_from('<I',data,12)[0]
g=json.loads(data[20:20+length]);start=28+length
def positions(mesh):
    a=g['accessors'][mesh['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']]
    p=np.frombuffer(data,dtype='<f4',count=a['count']*3,offset=start+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3)
    ras=p[:,[0,2,1]].astype(float);ras[:,1]*=-1;return ras
brain={m['name']:positions(m) for m in g['meshes']}
def centre(p): return (p.min(axis=0)+p.max(axis=0))/2
def source_points(ids):
    # Source right-labelled structures have negative X, left-labelled positive X.
    # Flip X/Y into RAS while preserving handedness; source coordinates are mm.
    return np.concatenate([obj(i)[0] for i in ids])*[-1,-1,1]
anchors=[('pons',['FJ1775','FJ1822'],'SPL_pons'),
         ('right putamen',['FJ1823'],'SPL_right_putamen'),('left putamen',['FJ1776'],'SPL_left_putamen'),
         ('right caudate',['FJ1802'],'SPL_right_caudate_nucleus'),('left caudate',['FJ1754'],'SPL_left_caudate_nucleus')]
x=np.array([centre(source_points(ids)) for _,ids,_ in anchors]);y=np.array([centre(brain[key]) for _,_,key in anchors])
xc=x-x.mean(axis=0);yc=y-y.mean(axis=0);u,s,vt=np.linalg.svd(xc.T@yc)
correction=np.diag([1,1,np.linalg.det(u@vt)]);rotation=u@correction@vt
scale=float(np.sum(s*np.diag(correction))/np.sum(xc**2));translation=y.mean(axis=0)-scale*x.mean(axis=0)@rotation
def fitted(p): return scale*(p*np.array([-1,-1,1]))@rotation+translation
matrix=np.eye(4);matrix[:3,:3]=scale*rotation.T@np.diag([-1,-1,1]);matrix[:3,3]=translation
residuals=np.linalg.norm(scale*x@rotation+translation-y,axis=1)
holdout=[]
for label,ids,key in [('right hippocampus',['FJ1807'],'SPL_right_hippocampus'),('left hippocampus',['FJ1759'],'SPL_left_hippocampus')]:
    prediction=scale*centre(source_points(ids))@rotation+translation
    holdout.append({'structure':label,'proxyCentreErrorMm':float(np.linalg.norm(prediction-centre(brain[key])))})

selected={'FJ1672':'Basilar artery','FJ1655':'Anterior communicating artery'}
for suffix,side in [('', 'Right'),('M','Left')]:
    for id_,name in [('FJ1654','anterior cerebral artery'),('FJ1692','middle cerebral artery — M1'),('FJ1660','middle cerebral artery — M2 part 1'),('FJ1694','middle cerebral artery — M2 part 2'),('FJ1723','posterior cerebral artery — P1'),('FJ1714','posterior cerebral artery — P2'),('FJ1713','posterior communicating artery'),('FJ1682','internal carotid artery')]:
        selected[id_+suffix]=side+' '+name
meshes={id_:obj(id_) for id_ in selected}
def gap(a,b):
    # Minimum vertex distance is a conservative proximity screen, not a lumen
    # continuity proof, surface intersection test or diagnostic tolerance.
    return float(min(np.sqrt(np.min(np.sum((a[i:i+128,None,:]-b[None,:,:])**2,axis=2))) for i in range(0,len(a),128)))
junctions=[]
for suffix,side in [('', 'Right'),('M','Left')]:
    for a,b in [('FJ1655','FJ1654'+suffix),('FJ1654'+suffix,'FJ1682'+suffix),('FJ1682'+suffix,'FJ1692'+suffix),('FJ1682'+suffix,'FJ1713'+suffix),('FJ1713'+suffix,'FJ1723'+suffix),('FJ1672','FJ1723'+suffix),('FJ1723'+suffix,'FJ1714'+suffix),('FJ1692'+suffix,'FJ1660'+suffix),('FJ1660'+suffix,'FJ1694'+suffix)]:
        value=gap(meshes[a][0],meshes[b][0])*scale
        junctions.append({'a':a,'b':b,'side':side,'minimumVertexGapMm':value,'screen':'close at 3 mm screen' if value<=3 else 'gap requires review'})
audit=json.loads((source/'coverage-audit.json').read_text())
mapping_rows=list(csv.DictReader(Path(sys.argv[1]).open(encoding='utf-8-sig'),delimiter='\t')) if len(sys.argv)>1 else audit['matches']
report={'status':'Experimental illustrative preview; not anatomically validated','reviewed':'2026-10-05',
    'method':'Single proper similarity transform fitted to five bounding-box centre proxies; no per-vessel adjustments',
    'sourceArchiveSHA256':audit['archiveSha256'],'sourceMappingSHA256':audit['mappingSha256'],
    'sourceXYZToTargetRAS':matrix.tolist(),'uniformScale':scale,'rotationDeterminant':float(np.linalg.det(rotation)),
    'fittingProxyErrorsMm':[{'structure':a[0],'errorMm':float(e)} for a,e in zip(anchors,residuals)],
    'fittingProxyCentres':[{'structure':a[0],'sourceRASmm':p.tolist(),'targetRASmm':q.tolist(),'sourceElements':a[1],'targetMesh':a[2]} for a,p,q in zip(anchors,x,y)],
    'heldOutProxyChecks':holdout,'junctionProximity':junctions,
    'basilarAlternative':{'selected':'FJ1672','excluded':'FJ1844','minimumVertexGapMm':gap(obj('FJ1672')[0],obj('FJ1844')[0]),'reason':'Overlapping alternate source basilar representation; both are not displayed together.'},
    'coverage':[], 'limitations':['Bounding-box centres are registration proxies, not expert anatomical landmarks; errors are not vessel target registration errors.','Source M elements may contain source-generated symmetric anatomy; no meshes were mirrored by MAPPED.','99 percent polygon-reduced source geometry; fine branches and lumen continuity are not validated.','BodyParts3D and SPL are different anatomical references. These vessels do not share the CT-to-MRI fit used by the skull or neck vessels; their junctions are not validated.','No expert reviewer or angiographic target establishes artery placement. No anatomical accuracy percentage.']}
regions=[];binary=[];byte_length=0
gl={'asset':{'version':'2.0','generator':'MAPPED BodyParts3D experimental central artery converter'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[1,0.2,0.2,1],'metallicFactor':0,'roughnessFactor':0.8},'doubleSided':True}]}
def accessor(array,type_,component):
    global byte_length
    padding=(-byte_length)%4
    if padding:binary.append(bytes(padding));byte_length+=padding
    raw=array.tobytes();idx=len(gl['bufferViews']);gl['bufferViews'].append({'buffer':0,'byteOffset':byte_length,'byteLength':len(raw)});binary.append(raw);byte_length+=len(raw)
    a={'bufferView':idx,'componentType':component,'count':len(array),'type':type_}
    if type_=='VEC3':a.update(min=array.min(axis=0).tolist(),max=array.max(axis=0).tolist())
    gl['accessors'].append(a);return len(gl['accessors'])-1
for id_,name in selected.items():
    original,faces=meshes[id_];ras=fitted(original);viewer=ras[:,[0,2,1]].copy();viewer[:,2]*=-1;viewer=viewer.astype('<f4')
    if not np.isfinite(viewer).all() or np.any(faces>=len(viewer)):raise ValueError('Invalid mesh')
    normals=np.zeros_like(viewer);t=viewer[faces];face_normals=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0])
    for column in range(3):np.add.at(normals,faces[:,column],face_normals)
    normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-20)
    mesh_name='BP3D_'+id_;node=len(gl['meshes']);gl['scenes'][0]['nodes'].append(node);gl['nodes'].append({'name':mesh_name,'mesh':node})
    gl['meshes'].append({'name':mesh_name,'primitives':[{'attributes':{'POSITION':accessor(viewer,'VEC3',5126),'NORMAL':accessor(normals.astype('<f4'),'VEC3',5126)},'indices':accessor(faces.ravel(),'SCALAR',5125),'material':0,'mode':4}]})
    # Dataset-specific IDs and zero Allen labels preserve annotations and prevent
    # these source meshes from being queried as Allen structures.
    regions.append({'meshName':mesh_name,'name':name,'labelId':0,'sourceId':0,'dataset':'bodyparts3d-central-4','acronym':'','color':'#ff5555','depth':0,'parentId':None,'parentName':None,'category':'Intracranial arteries','sourceFile':id_+'.obj','registrationStatus':'experimental-unreviewed'})
    parent=list(range(len(original)));edges={}
    def root(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for face in faces:
        for a,b in zip(face,np.roll(face,-1)):
            a=int(a);b=int(b);parent[root(a)]=root(b);edge=tuple(sorted((a,b)));edges[edge]=edges.get(edge,0)+1
    mirrored_bbox_delta=None
    if id_.endswith('M'):
        other=meshes[id_[:-1]][0]*[-1,1,1]
        mirrored_bbox_delta=float(np.max(np.abs(np.array([original.min(axis=0),original.max(axis=0)])-np.array([other.min(axis=0),other.max(axis=0)]))))
    report['coverage'].append({'element':id_,'name':name,'vertices':len(original),'triangles':len(faces),
        'connectedComponents':len(set(root(i) for i in range(len(original)))),'boundaryEdges':sum(v==1 for v in edges.values()),'nonmanifoldEdges':sum(v>2 for v in edges.values()),
        'reflectedCounterpartBoundingBoxDifferenceMm':mirrored_bbox_delta,
        'sourceSHA256':hashlib.sha256((source/(id_+'.obj')).read_bytes()).hexdigest(),'officialConceptNames':sorted(set(r['name'] for r in mapping_rows if r['element file id']==id_)),'fittedBoundsRASmm':[ras.min(axis=0).tolist(),ras.max(axis=0).tolist()]})
gl['buffers']=[{'byteLength':byte_length}];j=json.dumps(gl).encode();j+=b' '*((-len(j))%4);b=b''.join(binary);b+=bytes((-len(b))%4)
packed=struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b
(out/'central-arteries.glb').write_bytes(packed)
(out/'regions.json').write_text(json.dumps({'regions':regions},indent=2))
Path('frontend/src/data/centralArteryRegions.json').write_text(json.dumps({'regions':regions},indent=2))
for folder in [out,work]:(folder/'coverage-and-alignment.json').write_text(json.dumps(report,indent=2))
notice='''# BodyParts3D central arterial preview

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

Source: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
Licence: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
Terms: https://creativecommons.org/licenses/by/4.0/legalcode

MAPPED selected 18 elements from the official BodyParts3D 4.0 IS-A 99%-reduced OBJ archive, triangulated them, applied one experimental similarity fit to SPL/NAC brain structure-centre proxies, rotated them into viewer coordinates and regenerated normals. Source anatomy was not edited and no new mirrored meshes or synthetic connectors were generated. Source M elements may be symmetric representations. The original OBJ headers retain historical CC BY-SA 2.1 Japan notices; the current official database licence page states CC BY 4.0, updated 27 February 2025. See the recorded source hashes and coverage-and-alignment.json. No endorsement is implied.

Illustrative, incomplete, anatomically unvalidated. Vessel continuity and placement are not certified. The skull/neck atlas uses a different fit; cross-dataset junctions are not established. Not for clinical decisions.
'''
(out/'NOTICE.md').write_text(notice,encoding='utf-8')
print(json.dumps({'meshes':len(regions),'scale':scale,'fitErrorsMm':residuals.tolist(),'holdout':holdout,'junctions':junctions,'bytes':len(packed)}))
