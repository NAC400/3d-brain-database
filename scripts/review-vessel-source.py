"""Reproducible source-label and cross-subject plausibility checks, not expert validation.

Run with the bundled Python runtime and the extracted head-atlas directory.
Distances are to voxel-centre boundaries of the published annotation; smoothing,
voxel spacing and annotation quality limit their meaning. No accuracy percentage.
"""
from pathlib import Path
import json, struct, sys, re, hashlib
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path('artifacts/anatomy/python-deps').resolve()))
import SimpleITK as sitk
sitk.ProcessObject.SetGlobalDefaultNumberOfThreads(4)
base = Path('artifacts/anatomy/spl-head-neck')
source = Path(sys.argv[1])
labels_image = sitk.ReadImage(str(source / 'labels/HN-Atlas-labels.nrrd'))
labels = sitk.GetArrayFromImage(labels_image)
ct_image = sitk.ReadImage(str(source / 'grayscale/Osirix-Manix-255-res.nrrd'))
ct = sitk.GetArrayFromImage(ct_image)
registration = json.loads((base / 'experimental-registration.json').read_text())

def glb(path):
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    meta = json.loads(data[20:20+length]); start = 28+length
    def array(idx):
        a = meta['accessors'][idx]; v = meta['bufferViews'][a['bufferView']]
        offset = start+v.get('byteOffset',0)+a.get('byteOffset',0)
        dtype = {5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
        return np.frombuffer(data, dtype=dtype, count=a['count']*(3 if a['type']=='VEC3' else 1), offset=offset).reshape((-1,3)) if a['type']=='VEC3' else np.frombuffer(data,dtype=dtype,count=a['count'],offset=offset)
    return {m['name']:(array(m['primitives'][0]['attributes']['POSITION']),array(m['primitives'][0]['indices'])) for m in meta['meshes']}

def ras_to_indices(ras, image):
    lps = ras * np.array([-1,-1,1])
    direction = np.array(image.GetDirection()).reshape(3,3)
    return ((lps-np.array(image.GetOrigin())) @ np.linalg.inv(direction).T) / np.array(image.GetSpacing())

def sample(values, xyz):
    rounded=np.rint(xyz).astype(int)
    valid=np.all((rounded>=0)&(rounded<np.array(values.shape[::-1])),axis=1)
    out=np.full(len(xyz),np.nan)
    r=rounded[valid]; out[valid]=values[r[:,2],r[:,1],r[:,0]]
    return out,valid

raw=glb(base/'skull-vessels.glb')
regions=json.loads((base/'regions.json').read_text())['regions']
topology=json.loads((base/'vessel-validation.json').read_text())
report={'reviewed':'2026-10-05','scope':'source annotation agreement and gross plausibility; no independent anatomical validation',
        'sourceLabelSHA256':hashlib.sha256((source/'labels/HN-Atlas-labels.nrrd').read_bytes()).hexdigest(),
        'registrationSHA256':hashlib.sha256((base/'experimental-registration.json').read_bytes()).hexdigest(),
        'labelImageSpacingMm':labels_image.GetSpacing(),'vessels':[], 'independentLandmarkErrorsMm':None,
        'limitations':['Published labels are not independent ground truth.','Nearest-voxel samples and voxel-centre distances are limited by image resolution and mesh smoothing.','Cross-subject fit is not validated by source-label agreement.','No angiographic target volume or expert reviewer is available.']}
canvas=Image.new('RGB',(1080,1050),'#101820'); draw=ImageDraw.Draw(canvas)
draw.text((12,10),'SOURCE CT / PUBLISHED LABEL REVIEW - NOT ANATOMICAL CERTIFICATION',fill='white')
draw.text((12,30),'Red = published vessel label. Yellow cross = location of topology flag or small fragment.',fill='white')
flagged=['right_internal_carotid','left_vertebral_artery','left_common_carotid']
for region in regions:
    if region['category']=='Skeleton': continue
    positions,triangles=raw[region['meshName']]
    ras=positions[:,[0,2,1]].astype(float); ras[:,1]*=-1
    indices=ras_to_indices(ras,labels_image)
    mask=labels_image==region['sourceId']
    distance=sitk.GetArrayFromImage(sitk.Abs(sitk.SignedMaurerDistanceMap(mask,insideIsPositive=False,squaredDistance=False,useImageSpacing=True)))
    distances,valid=sample(distance,indices)
    label_values,_=sample(labels,indices)
    finite=distances[np.isfinite(distances)]
    fitted=np.c_[ras,np.ones(len(ras))] @ np.array(registration['movingCTToFixedMRIRAS']).T
    finding={'name':region['name'],'sourceLabelId':region['sourceId'],'sourceLabelVoxels':int(np.sum(labels==region['sourceId'])),
        'verticesOutsideSourceLabelField':int(np.sum(~valid)),
        'nearestVoxelMatchesPublishedLabel':int(np.sum(label_values==region['sourceId'])),
        'sampledAbsoluteDistanceToPublishedLabelBoundaryMm':dict(zip(['median','p95','maximum'],map(float,np.percentile(finite,[50,95,100])))),
        'sourceBoundsRASmm':[ras.min(axis=0).tolist(),ras.max(axis=0).tolist()],
        'fittedBoundsRASmm':[fitted[:,:3].min(axis=0).tolist(),fitted[:,:3].max(axis=0).tolist()]}
    # Confirm flags existed before our conversion by reading original VTK polygons.
    vtk=(source/region['sourceFile']).read_bytes()
    header=re.search(rb'POINTS\s+(\d+)\s+(float|double)\s*\n',vtk)
    n=int(header[1])
    if b'BINARY' in vtk[:100]:
        original=np.frombuffer(vtk,dtype='>f4' if header[2]==b'float' else '>f8',count=n*3,offset=header.end()).astype(float).reshape(-1,3)
    else:
        original=np.array(vtk[header.end():].split()[:n*3],dtype=float).reshape(-1,3)
    finding['originalVTKVertexCount']=n
    finding['sourceToRawExportMaxVertexErrorMm']=float(np.max(np.linalg.norm(original-ras,axis=1))) if len(original)==len(ras) else None
    poly=re.search(rb'(POLYGONS|TRIANGLE_STRIPS)\s+(\d+)\s+(\d+)\s*\n',vtk)
    if b'BINARY' in vtk[:100]:
        connectivity=np.frombuffer(vtk,dtype='>i4',count=int(poly[3]),offset=poly.end())
    else:
        connectivity=np.array(vtk[poly.end():].split()[:int(poly[3])],dtype=int)
    faces=[]; cursor=0
    for _ in range(int(poly[2])):
        size=int(connectivity[cursor]);strip=connectivity[cursor+1:cursor+1+size];cursor+=size+1
        for j in range(size-2):
            faces.extend([strip[j],strip[j+2],strip[j+1]] if poly[1]==b'TRIANGLE_STRIPS' and j%2 else ([strip[j],strip[j+1],strip[j+2]] if poly[1]==b'TRIANGLE_STRIPS' else [strip[0],strip[j+1],strip[j+2]]))
    finding['originalTriangleIndicesMatchRawExport']=bool(np.array_equal(faces,triangles))
    if finding['sourceToRawExportMaxVertexErrorMm']!=0 or not finding['originalTriangleIndicesMatchRawExport']:
        raise ValueError('Unexpected source geometry mismatch: '+region['name'])
    if region['name'] in flagged:
        keys=np.rint(ras/0.0001).astype(np.int64)
        _,ids=np.unique(keys,axis=0,return_inverse=True)
        edges={}
        for t in triangles.reshape(-1,3):
            for a,b in zip(t,np.roll(t,-1)):
                key=tuple(sorted((int(ids[a]),int(ids[b])))); edges.setdefault(key,[]).append((int(a),int(b)))
        bad=[pairs[0] for pairs in edges.values() if len(pairs)>2]
        if bad:
            location=ras[np.array(bad).ravel()].mean(axis=0)
            finding['flagLocationsRASmm']=[ras[list(e)].mean(axis=0).tolist() for e in bad]
        else:
            # Union triangle adjacency and report all fragments, including physical bounds.
            parent=list(range(int(ids.max())+1))
            def root(i):
                while parent[i]!=i: parent[i]=parent[parent[i]]; i=parent[i]
                return i
            for t in ids[triangles.reshape(-1,3)]:
                for a,b in zip(t,np.roll(t,-1)): parent[root(int(a))]=root(int(b))
            groups={}
            for i,id_ in enumerate(ids): groups.setdefault(root(int(id_)),[]).append(i)
            groups=sorted(groups.values(),key=len,reverse=True)
            finding['componentSourceBoundsRASmm']=[{'vertices':len(g),'minimum':ras[g].min(axis=0).tolist(),'maximum':ras[g].max(axis=0).tolist()} for g in groups]
            location=ras[groups[-1]].mean(axis=0)
        row=flagged.index(region['name']); point=np.rint(ras_to_indices(location[None,:],ct_image)[0]).astype(int)
        # CT and labels are required to share the same voxel grid for these overlays.
        if ct_image.GetSize()!=labels_image.GetSize() or ct_image.GetOrigin()!=labels_image.GetOrigin() or ct_image.GetDirection()!=labels_image.GetDirection() or ct_image.GetSpacing()!=labels_image.GetSpacing():
            raise ValueError('CT and label image grids differ')
        views=[(ct[point[2],:,:],labels[point[2],:,:],point[0],point[1]),
               (ct[:,point[1],:],labels[:,point[1],:],point[0],point[2]),
               (ct[:,:,point[0]],labels[:,:,point[0]],point[1],point[2])]
        draw.text((12,55+row*325),region['name']+' / source RAS mm '+str(np.round(location,2)),fill='white')
        for col,(slice_,seg,x,y) in enumerate(views):
            gray=np.clip((slice_.astype(float)+200)/1000*255,0,255).astype('uint8')
            rgb=np.repeat(gray[:,:,None],3,axis=2); rgb[seg==region['sourceId']]=[255,70,70]
            im=Image.fromarray(rgb); d=ImageDraw.Draw(im); d.line((x-5,y,x+5,y),fill='yellow');d.line((x,y-5,x,y+5),fill='yellow')
            canvas.paste(im.resize((340,290)),(col*360+10,row*325+75))
    report['vessels'].append(finding)

# Gross collision screen: target brain surface samples mapped back to source CT
# skull labels. This tests the current fit's plausibility, not real brain anatomy.
brain=glb(Path('frontend/public/models/spl-nac/brain.glb'))
forward=np.array(registration['fixedMRIToMovingCTLPS'])
skull_depth=sitk.GetArrayFromImage(sitk.SignedMaurerDistanceMap(labels_image==10,insideIsPositive=True,squaredDistance=False,useImageSpacing=True))
collisions=[]
all_points=0;deep_points=0;deepest=0;worst=None
for name,(positions,_) in brain.items():
    ras=positions[:,[0,2,1]].astype(float); ras[:,1]*=-1
    lps=ras*np.array([-1,-1,1]); ct_lps=(np.c_[lps,np.ones(len(lps))]@forward.T)[:,:3]
    xyz=ras_to_indices(ct_lps*np.array([-1,-1,1]),labels_image)
    values,valid=sample(labels,xyz); count=int(np.sum(values==10))
    depths,_=sample(skull_depth,xyz); depths=np.where(values==10,depths,0)
    deep=int(np.sum(depths>2));all_points+=len(ras);deep_points+=deep
    if np.nanmax(depths)>deepest:
        deepest=float(np.nanmax(depths));worst=(name,ct_lps[np.nanargmax(depths)])
    if count: collisions.append({'mesh':name,'sampledVertices':len(ras),'verticesInsideSourceSkullLabel':count,'samplesMoreThan2mmInsideBoneVoxelBoundary':deep,'maximumSampledDepthMm':float(np.nanmax(depths))})
report['grossSkullCollisionScreen']={'method':'Nearest voxel at every target brain mesh vertex after inverse registration; label 10 is source skull. Surface vertex sampling does not measure intersection volume and may be affected by smoothing or voxel boundaries.',
    'brainMeshesScreened':len(brain),'totalSurfaceVerticesSampled':all_points,'samplesMoreThan2mmInsideBoneVoxelBoundary':deep_points,'maximumSampledDepthMm':deepest,'meshesWithSkullLabelSamples':len(collisions),'findings':collisions}
report['alignmentVerdict']='Anatomical alignment not accepted: gross collision screen identifies brain surface samples within fitted skull bone, including samples more than 2 mm inside its voxel-centre boundary. Further registration and independent review required. The 2 mm screen is a diagnostic threshold, not a clinical acceptance criterion.'
if worst:
    name,lps=worst; xyz=np.rint(ras_to_indices((lps*np.array([-1,-1,1]))[None,:],ct_image)[0]).astype(int)
    proof=Image.new('RGB',(1080,390),'#101820');d=ImageDraw.Draw(proof)
    d.text((12,10),'ALIGNMENT CONCERN: '+name+' maps into source skull label',fill='white')
    d.text((12,30),'Red = skull label. Yellow cross = mapped brain vertex. Sampled bone depth: '+str(round(deepest,2))+' mm. Not an accuracy percentage.',fill='white')
    for col,(slice_,seg,x,y) in enumerate([(ct[xyz[2],:,:],labels[xyz[2],:,:],xyz[0],xyz[1]),(ct[:,xyz[1],:],labels[:,xyz[1],:],xyz[0],xyz[2]),(ct[:,:,xyz[0]],labels[:,:,xyz[0]],xyz[1],xyz[2])]):
        gray=np.clip((slice_.astype(float)+200)/1200*255,0,255).astype('uint8');rgb=np.repeat(gray[:,:,None],3,axis=2)
        rgb[seg==10]=(rgb[seg==10]*0.4+np.array([255,50,50])*0.6).astype('uint8')
        im=Image.fromarray(rgb);dd=ImageDraw.Draw(im);dd.line((x-5,y,x+5,y),fill='yellow');dd.line((x,y-5,x,y+5),fill='yellow')
        proof.paste(im.resize((340,310)),(col*360+10,65))
    proof.save(base/'brain-skull-collision-review.png')
(base/'vessel-source-review.json').write_text(json.dumps(report,indent=2))
canvas.save(base/'vessel-source-review.png')
print(json.dumps({'vessels':[(v['name'],v['sampledAbsoluteDistanceToPublishedLabelBoundaryMm'],v['sourceToRawExportMaxVertexErrorMm']) for v in report['vessels']], 'brainMeshesWithSkullLabelSamples':len(collisions),'skullLabelSamples':sum(c['verticesInsideSourceSkullLabel'] for c in collisions)}))
