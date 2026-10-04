# MAPPED anatomy and research experience — upgrade assessment

Reviewed: 3 October 2026. Scope: active renderer, local GLB/region metadata, and primary-source dataset research. This is an exploration and implementation proposal; no model or app behavior was changed. Medical accuracy, actual frame rates, and cross-atlas registration have not been validated visually or by an anatomical reviewer.

## Implementation update — 4 October 2026

The owner has deferred the old model's coordinate investigation, camera continuity repairs, and performance/geometry optimization. Current scope is a usable genuine bilateral brain and a route toward surrounding head layers.

Implemented SPL/NAC release `brain-2017-01` as the default Explorer atlas: 233 converted brain surfaces, 109 labelled left and 109 labelled right structures, plus 15 other structures. Conversion preserves the source geometry without synthetic mirroring or decimation. Provenance, archive checksum, modifications, and licence notices are distributed beside the GLB in `frontend/public/models/spl-nac/`.

The footer atlas selector retains the original Allen model. Saved sources, notes, highlights, and structure links are not migrated or deleted: SPL meshes use their own stable names; existing Allen research is accessed by selecting Allen. Different atlases do not automatically share community placements or anatomical descriptions. SPL label numbers must not be queried as Allen IDs.

Actual archive inspection found bilateral brain, skin, eye, and facial/neck muscle surfaces, but no skull, vascular, or explicitly named meningeal VTK surfaces. Therefore this is a bilateral brain foundation, not a full-head integration. Further anatomy must be registered to its source RAS reference and use the same brain centering transform. Do not simply combine the separately acquired SPL Head and Neck CT atlas without registration.

Next step: inventory a skull/vascular candidate against this reference and compare registration feasibility with obtaining a coherent complete-head asset. Dura remains unconfirmed. Independent anatomical review remains pending; single-subject bilateral data is not proof of superior accuracy for every structure.

Companion archive inspection on 4 October: `head-neck-2016-09.zip` contains `Model_10_skull.vtk`, `Model_25_mandible.vtk`, bilateral vertebral/internal/external/common carotid artery models and internal jugular veins. These are confirmed head/neck assets, not confirmation of a complete intracranial arterial tree or dural venous sinuses. This CT-based archive is a different acquisition from the bilateral MRI brain and has not been integrated or registered.

Validation completed: TypeScript, Three.js GLTFLoader decoding of all 233 surfaces, finite vertices and in-range triangle indices, bilateral hippocampus/amygdala/accumbens inventory, browser rendering and region search/selection, and switching between the two atlases. The development build reports the existing missing MediaPipe source-map warning. Camera continuity repair and performance work remain deferred as requested.

## Recommendation

### Current head-layer work (4 October 2026)

See `HEAD_LAYER_INTEGRATION.md` for the active workbench. Twelve SPL head/neck
surfaces have been converted and technically validated in `artifacts/anatomy/`,
with notices and a registration audit. They remain unregistered and outside the
public viewer. Source-volume LPS headers are recorded; the brain viewer origin
is fixed for future layers. BodyParts3D lists promising tentorium/dura-subdivision
and intracranial artery candidates; downloadable coverage is being checked.
The historical recommendation below predates the owner's choice of SPL/NAC as
the default brain; it is retained as assessment history, not the current plan.

Keep the existing Allen-derived brain as the research anchor. First verify its coordinate handling and hemisphere presentation, then prototype a properly aligned skull layer. In parallel, improve how a selected structure connects to function, explanations, and papers. Add meninges and vessels only after confirming asset coverage, licences, and anatomical alignment.

A complete head is feasible as a staged project. It requires asset preparation and anatomical review as well as UI work. Start with a brain-and-surrounding-anatomy experience; a full head additionally needs an explicit inventory of facial structures, muscles, skin, eyes, ears, cranial nerves, glands, and other intended structures.

## 1. What the current model actually supports

The active scene loads `frontend/public/models/brain.glb` through `BrainScene.tsx` → `BrainModel.tsx`. Older viewers and the STL README do not describe this active path.

| Local audit | Result |
|---|---|
| GLB size | 23,855,660 bytes, approximately 23.9 MB |
| GLB meshes | 142; 141 match entries in `regions.json` |
| Unmapped mesh | `Object`, excluded once region metadata loads |
| Missing labelled meshes | None: all 141 metadata entries have a corresponding GLB node |
| Labelled geometry | 652,788 vertices; 1,302,166 triangles |
| Full file geometry | 659,514 vertices; 1,315,614 triangles |
| Pilot coverage | Nucleus accumbens, amygdaloid complex, hypothalamus, hippocampal head/body/tail, and cerebellar subdivisions are present |
| External anatomy | No skull, named meningeal, arterial, or venous entries found in the region inventory |
| Rendering | Selection, hover, isolation, category filters, explode, three clipping planes, and optional mirrored geometry |
| Research interactions | Structure notes, region–source links, research sidebar, and optional Allen descriptions |

This verifies inventory consistency, not the shape accuracy or completeness of each region. A match between label and mesh does not establish correct segmentation.

The Allen reference is a 141-structure brain parcellation on the ICBM 2009b nonlinear symmetric MRI reference. It is a defensible source for brain-region context, rather than evidence that this exported GLB is a complete head or retains the source coordinates correctly. The dataset README identifies CC BY 4.0 terms. [Allen dataset documentation](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf)

## 2. High-priority issues before more anatomy

### Coordinate transforms — investigate first

All 141 labelled GLB nodes contain the quaternion `[0.7071068286895752, 0, 0, 0.7071068286895752]`, approximately a 90-degree X rotation. `BrainModel` extracts geometry and rebuilds meshes with positions, but does not transfer node rotation/scale or parent transforms. Its bounding boxes also use local geometry directly.

This means the displayed geometry does not preserve the GLB scene transforms. Whether that rotation was deliberately compensated elsewhere during export remains unverified. Do not simply apply it without checking anterior/posterior, superior/inferior, left/right, and clipping conventions. The comment calling vertices MNI millimetres is not a stored coordinate provenance record.

Required check: recover the source volume/export transformation, display trusted landmarks and anatomical axes, and compare orthogonal views with the source reference. Record a single model-to-world transform and use it for rendering, picking, centroids, clipping, and imported layers.

### Hemisphere handling — visual mirroring is not bilateral data

The code treats the source as one hemisphere. Its optional mirrored side is non-interactive and does not share all original selection, visibility, and fading behavior. Mirroring is disabled by default.

The original geometry is recentered at its bounding-box center; the mirrored group reflects that shifted geometry around world X=0. This does not establish that reflection occurs around the anatomical midsagittal plane. Raw labelled bounds are X −134.12 to −51.74, Y −108 to −26.74, Z 96.88 to 187.37; these are local coordinates, not certified anatomical axes.

Required check: locate the true midsagittal plane, identify midline structures, and determine whether source labels already span the midline. Keep synthetic mirroring explicitly labelled. Prefer real bilateral source geometry when available; use distinct hemisphere identities and preserve existing paper/note links through a mapping.

### Camera continuity — verify controls registration

`CameraController` reads `useThree().controls` to animate the OrbitControls target, while `BrainScene` supplies OrbitControls without `makeDefault` and keeps an otherwise unused local ref. This is a likely target-registration gap to reproduce, not a confirmed runtime failure.

Required check: synchronize camera position and orbit target through one controller; trigger the first frame explicitly under demand rendering; cancel safely on user interaction; finish based on both position and target. Preserve user orientation when selecting a structure or changing anatomy systems.

### Performance and geometry quality

Rendering the optional mirror duplicates the labelled geometry, giving approximately 2.6 million submitted triangles before other layers. This is a workload estimate, not a measured frame rate. Frequent per-mesh frame allocations and subscriptions to the full store also deserve profiling.

Required check: measure load time, memory, frame time, picking latency, and draw calls on a representative laptop. Check winding, disconnected components, holes, normals, and mesh distortion against source labels. Use independently reviewed low-detail meshes and lazy loading for additional systems; do not decimate away small important anatomy.

## 3. Candidate assets and integration routes

| Candidate | Why investigate it | Main constraint | Recommendation |
|---|---|---|---|
| Existing Allen-derived brain | Existing IDs, notes, and paper mappings | Export provenance, transforms, hemisphere behavior | Retain as the research anchor while validating it |
| SPL Head and Neck Atlas | Official page lists skull, mandible, spine, muscles, cartilage, blood vessels, and glands | Different source from Allen; cranial vessel and meningeal coverage need asset inventory | First open candidate for a skull/vascular feasibility study |
| SPL/NAC Brain Atlas | Whole-head MRI and hundreds of structures; head/neck muscle segmentation | Different subject/ontology; exact external-layer inventory unconfirmed | Compare a coherent replacement head scene against an Allen overlay |
| BodyParts3D | Downloadable anatomy geometry and terminology | Current official archive states CC BY 4.0 (licence page updated February 2025); older releases/derivatives may differ; coordinate changes and anatomical limitations need review | Tentorium and intracranial artery elements confirmed in the current OBJ archive; see HEAD_LAYER_INTEGRATION.md |
| Z-Anatomy | Broad Blender anatomy collection derived partly from BodyParts3D | Repository-wide CC BY-SA claim coexists with explicitly credited NC components | Evaluate individual meshes and source history, not the entire bundle as commercially cleared |
| VOKA | Useful interaction reference; licensed models and iframe embedding services | Asset/licence agreement required; embedded viewer may restrict MAPPED's picking and evidence integration | Commercial option if open assets cannot meet the quality target |

Sources: [SPL Head and Neck](https://www.openanatomy.org/atlas-pages/atlas-spl-head-and-neck.html), [SPL/NAC Brain](https://www.openanatomy.org/atlas-pages/atlas-spl-nac-brain.html), [BodyParts3D version/quality notes](https://lifesciencedb.jp/bp3d/info/index.html), [BodyParts3D licence](https://lifesciencedb.jp/bp3d/info/license/index.html), [Z-Anatomy source and component credits](https://github.com/Z-Anatomy/Models-of-human-anatomy), [VOKA services](https://voka.io/), [VOKA asset terms](https://shop.voka.io/terms-of-use/).

The SPL atlas pages point to the Slicer licence. Its terms permit incorporation into proprietary programs subject to conditions, including preserving notices and identifying modifications. Check bundled third-party rights as well. [Published Slicer licence](https://www.openanatomy.org/atlas-pages/slicer-license.html)

**Dura specifically remains an asset-search gap.** The checked atlas overview pages do not establish separate dura, arachnoid, pia, falx, and tentorium meshes. Do not represent an inflated brain surface as medically faithful dura. Acquire a reviewed asset or commission modelling with expert verification.

Recommended decision experiment: compare (A) retaining Allen and registering selected external layers with (B) loading a coherent head atlas as a separate scene with an explicit correspondence to Allen research entities. Neither cross-atlas geometry nor label equivalence should be assumed.

## 4. How layers should work

Use named systems with independent visibility, opacity, selection, and availability status. Suggested order: brain → skull → confirmed meningeal structures → arteries → veins/sinuses → cranial nerves → remaining head anatomy. A layer marked unavailable must not silently substitute procedural anatomy.

Each asset needs a manifest recording source/version, licence and notices, structures covered, units, axes, reference space, transforms, hemisphere, resolution, and review status. Apply one canonical transform; do not independently center each system. Preserve landmark relationships and check brain enclosure, skull-base passage locations, vessel courses, and meningeal relationships with an anatomical reviewer.

Extend stable structure identities beyond raw mesh names: dataset + source structure ID + laterality. A structure may have multiple render meshes and memberships. Keep personal/community paper placements intact through explicit ID mappings and verify them after any migration.

## 5. Turn the Reddit feedback into product behavior

The comments are useful hypotheses, not proof of demand. VOKA's own product page describes dissection, highlights/pointers, and text/image annotations; use these as interaction references rather than assuming its assets can be copied. [VOKA product features](https://voka.io/product/)

| Feedback | Proposed MAPPED behavior | Useful validation task |
|---|---|---|
| Connect anatomy to function and research | Structure panel with Anatomy, Function, Evidence, and My notes | Select a structure, explain its role, and open the source supporting that explanation |
| Explanations from basic to advanced | Introductory, intermediate, and advanced views sharing stable citations | Change explanation depth without losing the selected structure or source context |
| Understand spatial relationships | Context silhouette, neighbours, orientation widget, named views, optional skull context | Find a deep structure and identify its relationship to visible landmarks |
| Move between systems without losing orientation | Retain camera/target; crossfade systems; show a breadcrumb and return-to-previous-view action | Switch brain → skull → vessels and return without an unexpected camera reset |
| Explore pathways | First one cited, guided sequence with step labels and involved structures | Follow a pathway and explain each step while retaining anatomical orientation |

For every function or connection, store supporting references, source population/species, and whether the statement is established, inferred, or contested. Separate anatomical tracts from conceptual functional networks. A drawn line is a schematic unless verified tract geometry is available; do not imply it is a measured human pathway.

A useful first demonstration is: select hippocampus → see a concise introductory explanation → advance to a cited research explanation → inspect relevant papers → save a note. Choose any guided circuit only after checking required meshes and curating sources.

## 6. Incremental execution plan

1. **Validate the foundation.** Recover export provenance; check rotations, axes, clipping, midline, region coverage, and geometry quality; reproduce camera behavior. Exit: documented orientation and limitations, reviewer checklist, measured baseline.
2. **Improve evidence-linked exploration.** Add the structured panel, explanation depth, orientation cues, and preserved view history. Exit: a tester completes the structure → function → paper → note flow without coaching.
3. **Prototype one skull layer.** Inventory one candidate release, verify rights, convert a small subset to GLB, align it, and lazy-load it. Exit: reviewed fit and acceptable performance, with a simple way to restore brain-only exploration.
4. **Add confirmed meninges and vessels.** Inventory exact available structures; resolve missing meshes; implement layer controls and transparent-material/picking rules. Exit: verified anatomical relationships and independent selection across systems.
5. **Prototype one guided pathway.** Add reviewed steps, cited explanations, synchronized transitions, and a clear schematic/geometry distinction. Exit: testers retain orientation and can reach the evidence for each claim.
6. **Expand toward the full head.** Agree an explicit coverage list, add remaining systems incrementally, and test the same tasks after each expansion.

Priority is validating the model and prototyping external anatomy. Evidence and explanation improvements can proceed without waiting for a complete head. Keep the pilot's existing audience and paper-discovery hypothesis unless the owner deliberately changes them.

## 7. Remaining unknowns

- Exact source volume, hemisphere handling, and conversion script that produced the current GLB.
- Whether imported node rotations were intentionally cancelled upstream.
- Current visual anatomical quality and laptop/mobile performance under real interaction.
- Exact dura and intracranial vessel coverage in candidate asset releases.
- Measured registration quality between the current brain and any candidate head atlas.
- Anatomical reviewer availability, asset budget, and the desired full-head coverage.

Next concrete step: perform the coordinate/hemisphere validation and inventory a single skull candidate. Do not buy assets or replace the production model based solely on this desk assessment.

## Implementation update — 5 October 2026

The earlier next-step statement is historical. A bilateral SPL/NAC brain and an optional SPL skull/neck preview now exist. Source reviews detected brain–skull overlap concerns in their cross-subject fit; see `VESSEL_PREVIEW_VALIDATION.md`.

Central arterial coverage has now been checked element by element against BodyParts3D mappings and geometry. An optional 18-element preview includes the Circle of Willis components, basilar, ACA, MCA M1/selected M2 and PCA P1/P2 representations. Its shared experimental similarity fit has held-out structure-centre differences around 9–10 mm and has not passed anatomical validation. It is off by default and disclosed separately from the skull/neck fit. See `CENTRAL_ARTERIAL_PREVIEW.md` and the distributed coverage/alignment report. Independent vascular alignment and anatomical review, finer source geometry, meninges and venous sinuses remain open work.

Meningeal follow-up: a source-backed Z-Anatomy preview now provides falx, bilateral tentorium and 16 named venous sinus objects, with ShareAlike model notices. Source topology and large straight-sinus junction gaps are disclosed. Tested rigid skull and affine arterial alternatives did not justify changing the existing transforms. Outer dura, arachnoid and pia remain unavailable; MIDA's inspected agreement prohibits model redistribution and Zygote requires a suitable vendor agreement. See `MENINGES_AND_SINUSES.md`; anatomical alignment remains unresolved.
