"""Join official anatomy concepts to actual archive elements, without guessing IDs."""
from pathlib import Path
import csv
import hashlib
import json
import re
import sys
import zipfile

archive, mappings = map(Path, sys.argv[1:3])
out = Path('artifacts/anatomy/bodyparts3d-candidates')
out.mkdir(parents=True, exist_ok=True)
targets = re.compile(r'tentorium|dura|falx|arachnoid|pia mater|basilar artery|cerebral artery|communicating artery|dural.*sinus|sagittal sinus|transverse sinus|straight sinus|cavernous sinus', re.I)
rows = list(csv.DictReader(mappings.open(encoding='utf-8-sig'), delimiter='\t'))
records = []
selected_files = {}
with zipfile.ZipFile(archive) as bundle:
    available = {Path(name).stem: name for name in bundle.namelist() if name.endswith('.obj')}
    for row in rows:
        if not targets.search(row['name']):
            continue
        element = row['element file id']
        records.append({**row, 'archiveFile': available.get(element)})
        if element in available:
            selected_files[element] = available[element]
    for element, name in selected_files.items():
        (out / (element + '.obj')).write_bytes(bundle.read(name))

mesh_stats = []
for element in selected_files:
    vertices, faces = 0, 0
    for line in (out / (element + '.obj')).read_text().splitlines():
        if line.startswith('v '): vertices += 1
        elif line.startswith('f '): faces += 1
    mesh_stats.append({'element': element, 'vertices': vertices, 'faces': faces})
report = {'status': 'source-space candidates only; not registered or released',
          'archive': archive.name, 'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
          'mappingSha256': hashlib.sha256(mappings.read_bytes()).hexdigest(),
          'matches': records, 'uniqueExtractedMeshes': len(selected_files), 'geometry': mesh_stats,
          'meningealAliases': [r for r in records if re.search(r'\bdura\b|tentorium|falx|arachnoid mater|pia mater', r['name'], re.I)],
          'warning': 'Multiple concept names may map to the same element. FJ1843 is tentorium, not proof of a complete dura shell.'}
(out / 'coverage-audit.json').write_text(json.dumps(report, indent=2))
print(json.dumps({'matchedConceptElements': len(records), 'uniqueMeshes': len(selected_files),
                  'meningealAliases': report['meningealAliases']}))
