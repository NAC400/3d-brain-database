"""Run with Blender --disable-autoexec --background <Startup.blend> --python ...
Export evaluated, world-space source mesh geometry without executing atlas scripts.
"""
import bpy,json,sys
from pathlib import Path
out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(parents=True,exist_ok=True)
depsgraph=bpy.context.evaluated_depsgraph_get();meshes=[];inventory=[]
for o in bpy.data.objects:
 if o.type not in ['MESH','CURVE','SURFACE']:continue
 name=o.name
 inventory.append({'name':name,'type':o.type})
 if not any(word in name.lower().replace('_',' ') for word in ['sinus','tentorium','falx cerebri','putamen','caudate nucleus','hippocampus','pons']):continue
 evaluated=o.evaluated_get(depsgraph);m=evaluated.to_mesh()
 if m is None:continue
 m.calc_loop_triangles();points=[c for v in m.vertices for c in (o.matrix_world@v.co)];indices=[i for t in m.loop_triangles for i in t.vertices]
 meshes.append({'name':name,'points':points,'indices':indices})
 evaluated.to_mesh_clear()
(out/'canonical-inventory.json').write_text(json.dumps(inventory,indent=2));(out/'canonical-selected.json').write_text(json.dumps({'meshes':meshes}))
print(json.dumps([{'name':m['name'],'vertices':len(m['points'])//3} for m in meshes]))
