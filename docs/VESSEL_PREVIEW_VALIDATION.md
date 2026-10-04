# Vessel preview validation — 5 October 2026

**Status: technical and source checks completed; current alignment has detected conflicts and is not accepted as anatomically validated. Anatomical accuracy remains unquantified.**

## Follow-up source and anatomy checks

Run `scripts/review-vessel-source.py <extracted-head-atlas-directory>` with Python, NumPy, Pillow and SimpleITK. Results: `vessel-source-review.json`, `vessel-source-review.png` and `brain-skull-collision-review.png` in the head-atlas workbench. Source-label and registration hashes are recorded for reproducibility.

- All ten original VTK vertex arrays and decoded triangle-strip indices exactly match the raw GLB export. Therefore the three topology flags are inherited from the source geometry, rather than introduced by MAPPED. No anatomical repair was applied.
- Against each corresponding published label, nearest-voxel absolute distances to the voxel-centre boundary have a median of 0 mm, 95th percentiles of 0.39–1.38 mm and maxima of 1.40–1.97 mm across the ten vessels. CT spacing is approximately 0.98 × 0.98 × 1.40 mm. This is broadly consistent with the source annotations at their resolution; it is not an independent anatomical accuracy score or a continuous mesh-to-surface Hausdorff distance. Boundary voxel centres have distance zero by definition.
- Orthogonal CT slices were rendered at flagged locations with the published vessel label overlaid. The source review image locates the two mesh-edge issues and one of the small common-carotid fragments. These images locate the issue; they do not certify an entire vessel's course or establish whether small fragments should be deleted.
- A gross alignment screen inverse-mapped all 1,015,064 vertices of the 233 displayed brain meshes into the source CT label grid. There are 23,981 samples in the skull label across 90 meshes; 121 samples lie more than 2 mm inside the skull's voxel-centre boundary. The maximum sampled depth is 3.90625 mm, in a left cerebellar mesh. The provided orthogonal CT image shows the mapped point within bone. This is evidence against accepting the current fit as anatomically coherent.
- These are correlated surface samples, not independent observations, overlap volume, a registration-error distribution or a percentage of anatomical correctness. Nearest-voxel sampling, source segmentation and smoothing affect the screen. The 2 mm diagnostic threshold is not a clinical acceptance criterion. Depths are measured in source CT space, before the affine scale.

**Action implied by these checks:** retain an explicit alignment warning. Improving or replacing the cross-subject fit is necessary before treating the combined anatomy as a dependable anatomical reference. Vessel placement against the target brain still requires independent landmarks or suitable target vascular imaging and expert review. No reviewer sign-off or defensible vessel alignment error can be supplied from these checks alone.

Run `node scripts/check-vessel-preview.mjs` to reproduce the mesh audit. The full machine-readable report is `artifacts/anatomy/spl-head-neck/vessel-validation.json`; a public copy is distributed with the preview assets.

## What was checked

- All ten vessel meshes preserve vertex correspondence between the source export and fitted export. Maximum discrepancy from applying the recorded affine transform is 0.00000793 mm. This measures floating-point export consistency, **not anatomical alignment error**.
- At a 0.0001 mm vertex-welding tolerance, all surfaces have zero boundary edges and no triangles collapse from welding. Closed surfaces can still be truncated or incorrectly segmented.
- Nine meshes have one connected component. The left common carotid has a main component of 5,556 triangles and two small fragments of 12 and 6 triangles. These fragments do not demonstrate a missing main vessel segment.
- The right internal carotid has two edges shared by more than two triangles; the left vertebral artery has four. These topology flags require source inspection and are not evidence of incorrect vessel courses by themselves.
- The preview contains bilateral common, internal and external carotids, vertebral arteries and internal jugular veins. It lacks the Circle of Willis, basilar artery, cerebral arterial network and dural venous sinuses. This is an inventory of supplied meshes, not a medical assessment of the source scan.

## What this cannot establish

The head-and-neck vessels come from a different CT subject than the SPL/NAC MRI brain. A shared experimental affine registration, including nonuniform scaling, provides an illustrative fit. No independent landmark errors or anatomical reviewer approval are recorded. Numerical precision and visually plausible placement do not establish biological accuracy; no defensible accuracy percentage is available.

The audit does not establish the full route, branches, endpoints, lumen dimensions or spatial relationships of any vessel. It does not validate the skull, dura or other tissues.

## How to establish anatomical accuracy

1. Review each vessel surface against the original CT segmentation and image slices, tracing the represented course and recording truncations, fragments and segmentation mistakes. Source agreement checks reproduction; independent image review is needed to assess the original annotation.
2. Have an anatomical reviewer inspect vessel courses and their relationships to the skull and brain. Check named branches and communicating connections individually rather than inferring completeness from a vessel name.
3. Mark corresponding, independently selected anatomical landmarks in the source CT and target MRI. Use landmarks withheld from fitting to report target registration error in millimetres (median, maximum, distribution and regional errors), with landmark uncertainty. Some vascular landmarks cannot be identified reliably on the available MRI; document these limits.
4. Validate anatomical relationships throughout the head, not just global registration similarity. For a coherent anatomical reference, prefer vessels, skull and brain from the same subject or a professionally curated common atlas.

Until these steps are completed, label the preview **incomplete, experimentally aligned, and anatomically unvalidated; for learning and research illustration, not clinical decisions**. Even expert validation would have a defined scope, not guarantee perfect anatomy for every person.

Source provenance: [SPL Head and Neck Atlas](https://www.openanatomy.org/atlas-pages/atlas-spl-head-and-neck.html), [SPL/NAC Brain Atlas](https://www.openanatomy.org/atlas-pages/atlas-spl-nac-brain.html). See `HEAD_LAYER_INTEGRATION.md` for registration provenance and licensing disclosures.
