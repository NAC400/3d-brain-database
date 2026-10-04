# Meninges, sinuses and alignment investigation — 5 October 2026

## Implemented preview

Explorer → Experimental head layers → Show experimental head layers offers separate **Dural folds (falx & tentorium)** and **Dural venous sinuses** controls, both off by default. Selected geometry is inspectable, selectable, highlightable and isolatable. Dural-fold opacity has a separate slider. Enable Layers and hide skull/other vessels to see these layers through the brain.

The source is the Z-Anatomy Unity project's actual `NervousSystem100.fbx` and `CardioVascular41.fbx` files. Source hashes, original object inventories, extracted geometry, fit and topology results are recorded in `artifacts/anatomy/z-anatomy`. Three.js FBXLoader preserves hierarchy/world transforms; individual mesh bounds exclude children and annotation helpers. Extraction never treats empty helper objects as anatomy.

| Requested structure | Actual source coverage | Preview |
|---|---|---|
| Outer cranial dura | Not established in BodyParts3D, SPL or inspected Z-Anatomy nervous file | Unavailable; no procedural substitute |
| Falx cerebri | Z-Anatomy named mesh | One selectable source-backed mesh; topology warning |
| Tentorium | Z-Anatomy left and right meshes; BodyParts3D also has FJ1843 | Two Z-Anatomy folds, sharing the sinus fit |
| Arachnoid / pia membranes | Not established in inspected files | Unavailable; subarachnoid space is not a membrane |
| Superior / inferior sagittal, straight, occipital sinuses | Named vascular meshes | Four selectable meshes; straight-sinus junction gaps flagged |
| Transverse / sigmoid sinuses | Left/right named meshes | Four selectable meshes |
| Cavernous / superior petrosal / inferior petrosal sinuses | Left/right named meshes | Six selectable meshes; cavernous topology/disconnection warning |
| Anterior / posterior intercavernous sinuses | Named meshes | Two selectable meshes |
| Confluence | Empty annotation helper | No separate mesh displayed |
| Falx cerebelli / diaphragma sellae | No separately named usable mesh established | Unavailable as separate structures |

Total: 3 dural folds and 16 venous sinus meshes. This is a partial illustrative atlas assembly, not complete meninges or certified venous drainage.

## Checks and observed limitations

- One shared, proper similarity transform uses pons, bilateral putamen and bilateral caudate bounding-box centres, with held-out hippocampal centre checks. FBX world coordinates are mapped to RAS using source-labeled laterality, centimetres to millimetres, then the same viewer rotation/runtime brain origin used by other anatomy layers. A positive-determinant mapping preserves handedness; MAPPED generates no new mirrored geometry.
- Held-out proxy differences are 9.80 mm right and 9.35 mm left. These are not independent anatomical landmarks or vessel target registration errors. No anatomical reviewer accepted this fit. The separate skull and arterial references are not registered to these structures as a coherent subject.
- Welded topology flags 552 nonmanifold edges in the falx and 26/27 in the right/left cavernous sinuses. Each cavernous source object has two components. The other selected objects have one component and no nonmanifold edges at the recorded numerical welding tolerance. Original source shape is preserved, not automatically repaired.
- Minimum vertex proximity is about 0.07–0.52 mm for the tested lateral sinus junctions and superior sagittal/transverse junctions. However inferior sagittal → straight is approximately 11.89 mm and straight → transverse approximately 39.38 mm. This is a substantial source-layout concern, not a tolerance pass. No synthetic connector was made. Minimum vertex distance does not establish lumen continuity, surface contact, or a complete drainage route.
- UI and public reports disclose these limitations; nothing is presented as an anatomically validated outer dura shell.

## Existing alignment alternatives

`scripts/compare-anatomy-alignment.py` compares the existing rigid skull fit with the released affine fit on exactly the same target brain surface samples. Rigid: 137,866 bone-label samples and 10,468 samples more than 2 mm inside its boundary; affine: 23,981 and 121. Maximum sampled depths are 5.19 and 3.91 mm respectively in source CT space. Both remain unvalidated; switching back to rigid would worsen this particular screen.

A five-proxy arterial affine trial reduces training proxy error but increases held-out hippocampal centre differences to 20.50/20.30 mm from 9.79/9.34 mm, with principal scales of approximately 2.64, 0.80 and 0.59. It is rejected and not applied. Existing transforms and alignment warnings remain intact. Better training fit is not independent validation. These results are published as `alignment-comparison.json`.

Resolving the remaining alignment issues needs independent CT/MRI/vascular landmarks or a coherent same-subject head dataset and anatomical expert review. This investigation does not claim that computational screens can certify anatomy.

## Missing-resource decisions and licences

- **BodyParts3D:** full official element mapping confirms only FJ1843 for dura/tentorium; no named dural sinuses, outer dura, falx, pia or arachnoid membrane. Source brain archive also contains no named dural folds/sinuses. Catalogue names alone are not treated as coverage.
- **Z-Anatomy:** actual geometry confirmed for the folds/sinuses above. These adapted asset files retain CC BY-SA 4.0 terms and the source's BodyParts3D CC BY-SA 2.1 Japan attribution. Related NonCommercial ear/kidney assets are excluded. Current BodyParts3D relicensing is not applied retroactively to this derivative. Public `NOTICE.md`, `SOURCE-LICENSE.txt` and `LICENSE.txt` preserve required source notices and adaptation disclosures. Public GLB adaptations remain ShareAlike.
- **MIDA:** a promising coherent head-model source with dura and venous anatomy. Its official 2024 agreement was downloaded and visually read. Section 2.3.2 prohibits redistribution of original or derived model data. It cannot be shipped as web-delivered geometry under that agreement; specific additional permission would be required. No MIDA model data was acquired or integrated.
- **Zygote:** advertises dura including falx/tentorium and arachnoid, plus separately licensed cerebral circulation. This is a procurement option; redistribution/commercial web delivery must be covered by a vendor agreement. No purchase or agreement was made and no asset was integrated.

The complete outer dura/arachnoid/pia request therefore remains unresolved by accessible assets with verified web redistribution rights. The source-backed folds/sinuses preview is implemented; missing membranes and unvalidated alignment are explicitly reported, not filled with guessed surfaces.

## Reproduction and sources

Run `node scripts/inspect-z-anatomy.mjs <NervousSystem100.fbx> nervous` and likewise `<CardioVascular41.fbx> cardio`, then `scripts/build-meningeal-preview.py` using Python/NumPy. Run `scripts/compare-anatomy-alignment.py <HN-Atlas-labels.nrrd>` with the isolated SimpleITK runtime for the alignment alternatives. Source FBX files remain in temporary download storage; selected source geometry and hashes are retained in the workbench.

- [Z-Anatomy source FBX and model notices](https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models)
- [Z-Anatomy source project and attribution](https://github.com/Z-Anatomy/Models-of-human-anatomy)
- [BodyParts3D official mapping and downloads](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- [MIDA model overview](https://itis.swiss/virtual-population/regional-human-models/mida-model)
- [MIDA official 2024 agreement, section 2.3.2](https://itis.swiss/assets/Downloads/VirtualPopulation/License_Agreements/LicenseAgreementMIDA_2024.pdf)
- [MIDA anatomical methods paper](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0124126)
- [Zygote advertised meningeal anatomy](https://www.zygote.com/cad-models/featured-products/solid-3d-human-brain)
