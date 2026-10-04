# Head-layer integration workbench

Updated 4 October 2026. Active brain: SPL/NAC `brain-2017-01`. Companion head candidate: SPL `head-neck-2016-09` (source page labels its release September 2015).

## Optional Explorer preview implemented

Open Explorer, select SPL/NAC, expand **Experimental head layers**, and enable
**Show experimental head layers**. Independent skull/mandible, major artery,
and jugular vein switches and opacity controls display the fitted GLB. Loading
is optional and does not hide the existing brain. Brain selection passes through
these context meshes. Layers use the actual brain group's origin and are hidden
on the Allen atlas and while Explode is nonzero. The preview explicitly states
that alignment is not anatomically validated and that dura/intracranial vessels
are unavailable. Source, licence, notices, and experimental provenance accompany
the public assets and are linked on the Data sources & licences page.

Selection update: head meshes now support direct picking, hover and selection
highlighting, isolation, custom colours, and the existing notes panel. An accessible
**Select head structure** dropdown lists enabled structures for picking through
occluding layers. Separate head metadata preserves the brain's 233-structure
inventory; hiding/unloading a selected head layer clears its transient selection
and isolation without deleting saved notes. Hide the skull to click brain structures
underneath. This supersedes the original pass-through picking behavior above.

The historical workbench entries below describe preparation before this opt-in
preview existed; the preview does not change their validation limitations.

## Prepared candidate

`artifacts/anatomy/spl-head-neck/skull-vessels.glb` contains 12 selected surfaces:
skull, mandible, and bilateral common/internal/external carotid arteries,
vertebral arteries, and internal jugular veins. `regions.json` preserves source
IDs and system categories. All geometry passes finite-coordinate and triangle
index validation. Licence and modification notices accompany the bundle.

The files are deliberately outside `frontend/public`: **unregistered** does not
mean aligned, and bounding-box enclosure does not establish anatomical fit.
No new anatomy is enabled in Explorer yet.

Reproduce from the official extracted atlas:

```powershell
node scripts/convert-spl-atlas.mjs <head-neck-2016-09-directory> --head-neck
node scripts/audit-head-layer-registration.mjs
```

The audit records mesh counts, geometry hashes, coverage, bounds, the brain's
shared origin, missing structures, and the explicit null registration transform.

## Coordinate evidence

Both source volumes declare **LPS** physical coordinates. This differs from the
proposed **RAS** convention of the Slicer VTK models: flip X and Y when converting
volume physical positions between LPS and RAS; never infer orientation from names.
The source MRML contains no supplied cross-atlas registration transform.

| Volume | Grid | Axis directions in LPS millimetres | Origin in LPS millimetres |
|---|---|---|---|
| Brain T1, 1 mm resample | 256 × 256 × 256 | (0,1,0), (0,0,-1), (1,0,0) | (-127.5,-127.5,127.5) |
| MANIX reduced CT | 255 × 255 × 229 | (-0.9765625,0,0), (0,-0.9765625,0), (0,0,1.4000244) | (124.0234375,124.0234375,-159.6027816) |

These are different acquisitions, not two layers from one registered head.
The brain GLB's combined centre after viewer rotation is
`[2.4075698853, -10.2401809692, 7.5896072388]` mm. This is a renderer origin,
not an anatomical landmark or a CT-to-MRI alignment.

Required transform order:

1. Confirm model coordinates against the respective source label/scan volumes.
2. Estimate CT-to-brain-MRI registration in physical coordinates, initially rigid,
   then assess whether affine or constrained deformation is justified for different
   individuals. Preserve the skull/vessel relationships with the same transform.
3. Convert registered RAS to viewer coordinates: `(R,S,-A)`.
4. Subtract the **brain's** centre and multiply by `0.01`.

Do not independently centre each system, fit the skull by overall width, or label
an automatically optimised image similarity score as anatomical validation.

## Registration acceptance

### Affine refinement and staged surface fit

A subsequent rigid-then-affine experiment converged at affine iteration 61
(47.2 seconds total). Principal scale factors of the CT-to-MRI affine were
approximately 1.153, 1.068, and 1.032; determinant 1.271. This indicates material
cross-subject reshaping, particularly along one axis, not just repositioning.
The updated overlays show a closer gross cranial-vault fit, but cranial-base
and fine anatomical correspondence remain unvalidated. The initial rigid report
and image are preserved separately as `rigid-registration.json` and
`rigid-registration-review.png`.

Applied the inverse registration in RAS consistently to all 12 staged head
surfaces, before viewer rotation. The resulting
`skull-vessels-experimental-fit.glb` passes finite-vertex and triangle-index
checks. Its audit is `experimental-geometry-audit.json`. This is a **review
prototype**, not a released layer. The manifest status remains unreviewed;
the app continues to display its existing brain-only anatomy.

Reproduce the fitted staging geometry after running the registration with
`--affine`:

```powershell
node scripts/convert-spl-atlas.mjs <head-neck-directory> --head-neck --registration=artifacts/anatomy/spl-head-neck/experimental-registration.json
node scripts/audit-head-layer-registration.mjs --experimental
```

### Initial rigid baseline

Ran SimpleITK 2.5.6 rigid registration with Mattes mutual information, 5% seeded
sampling, multiresolution factors 4/2/1, and geometry-centre initialization.
Runtime was 32.6 seconds. The final sampled metric was -0.3742445683; the optimizer
hit its 150-iteration limit. This scalar is not a landmark error or fit certificate.

The transform and source image hashes are saved in
`artifacts/anatomy/spl-head-neck/experimental-registration.json`. The transform
file uses the fixed-MRI-to-moving-CT LPS convention required for resampling; the
JSON also records its inverse in RAS for eventual surface transformation.
The resampled CT volume is a local ignored `.mha` workbench output.

`registration-review.png` shows three orthogonal diagnostic slices. The cranial
vault is roughly positioned around the MRI brain, but the overlay shows mismatch
near cortical boundaries and the cranial base. No independent landmark residuals
or reviewer acceptance exist. This experiment therefore does not authorize public
skull/vessel integration. Next assess a head-only mask, initialization stability,
and a constrained affine fit, followed by independent landmark review. Adding
deformation solely to improve appearance would not establish anatomical truth.

Reproduce with SimpleITK installed in the isolated workbench runtime:

```powershell
python scripts/register-head-layer-experiment.py <brain-T1.nrrd> <MANIX-CT.nrrd>
python scripts/render-registration-review.py <brain-T1.nrrd>
```

Inspect source and transformed volumes in axial, coronal, and sagittal views.
Record independent landmark residuals in millimetres (not just training landmarks)
and the resulting skull enclosure. Review cranial base, foramen magnum, orbital
orientation, internal carotid course, vertebral course, and brainstem relations.
Agree acceptance tolerances with an anatomical reviewer rather than inventing
thresholds. Store the transform, method/version, input hashes, residuals, and
review status. Cross-subject vessels remain atlas illustrations, not vessels
measured from the SPL/NAC brain subject.

## Missing coverage and candidates

The selected SPL archive does not establish an intracranial arterial tree,
dural sinuses, dura, falx, tentorium, arachnoid, or pia. No procedural substitute
is presented as anatomical data.

The official BodyParts3D IS-A catalogue lists `BP5495` (subdivision of cranial dura
mater), `BP5496` (tentorium cerebelli), `BP6340` (basilar artery), and multiple
cerebral artery subdivisions. Catalogue presence is not proof that a downloadable
mesh exists: inspect the OBJ archive, hierarchy expansion, geometry and applicable
licence terms before choosing assets. No separately named falx or arachnoid was
found in the inspected IS-A list. A generic dura-subdivision label must not be
represented as complete cranial dura.

### Downloaded geometry confirmed

Downloaded and inspected the official `isa_BP3D_4.0_obj_99.zip` archive and joined
its FJ element filenames to the official `isa_element_parts.txt` table. Staged
114 unique matched elements and recorded 251 concept-to-element rows in
`artifacts/anatomy/bodyparts3d-candidates/coverage-audit.json`. The broad candidate
filter includes two contextual subarachnoid-space brain elements; these are not
meningeal membranes. Basic OBJ vertex/face counts are recorded, not a complete
mesh integrity or anatomical validation.

**Critical finding:** all three dura/tentorium catalogue names above resolve to
the same `FJ1843.obj`. Actual tentorium geometry exists; no full dura shell is
established. Basilar artery resolves to `FJ1672` and `FJ1844`; cerebral and
communicating artery candidates are also present. All remain in BodyParts3D
source space and have no SPL/NAC registration.

**Licensing update:** the official archive licence page, updated 27 February 2025,
specifies **CC BY 4.0**, with the required credit recorded in the staging notice.
Earlier ShareAlike cautions concern older releases and derived collections, not
the current download's published terms. Z-Anatomy must still be audited separately.
The selected archive uses 99% polygon reduction, so small-vessel shape fidelity
needs comparison with higher-detail geometry before choosing a production asset.

Zygote explicitly advertises arachnoid and dura including falx and tentorium in
its male solid nervous-system collection. This establishes a sourcing option,
not webapp redistribution permission or compatibility with our brain. A vendor
agreement must cover mesh format, web delivery and commercial product rights.

## Sources

- https://www.openanatomy.org/atlas-pages/atlas-spl-head-and-neck.html
- https://www.openanatomy.org/atlas-pages/atlas-spl-nac-brain.html
- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_parts_list_e.txt
- https://www.zygote.com/cad-models/solid-3d-male-systems/solid-3d-male-nervous-system

Next deliverable: actual mesh coverage audit for BodyParts3D and refinement of the
source-volume registration experiment. Public layer controls follow verified alignment and
licence checks. Performance optimisation and the old Allen-model investigation
remain deferred per the owner's request.

### Follow-up implementation — 5 October 2026

The earlier next-deliverable statement is historical. Source-backed central arteries,
falx, tentorium and dural sinus previews have now been added, with opt-in controls
and explicit unvalidated-alignment warnings. See `CENTRAL_ARTERIAL_PREVIEW.md`,
`VESSEL_PREVIEW_VALIDATION.md` and `MENINGES_AND_SINUSES.md` for actual coverage,
source/licence checks, topology and junction concerns, and rejected alignment alternatives.
Outer dura, pia and arachnoid are still missing. No preview is promoted to anatomically
validated status; independent landmarks and expert review remain necessary.
