# Alignment and sinus refinement — 6 October 2026

## Changes applied

The central arterial and Z-Anatomy fold/sinus previews now use labelled symmetric trimmed ICP similarity fits instead of centre-only fits. Five structures (pons, bilateral putamen and caudate) train each fit; both hippocampi are withheld. The fit preserves handedness and uniform scale, with no unconstrained affine deformation. Deterministic unique-vertex sampling influences the metrics, and individual training structures do not all improve.

| Withheld structure | Z-Anatomy median / p95 before → after, mm | BodyParts3D median / p95 before → after, mm |
|---|---|---|
| Right hippocampus | 4.49 / 10.07 → 3.78 / 9.06 | 4.61 / 10.05 → 3.69 / 8.85 |
| Left hippocampus | 5.19 / 10.91 → 3.82 / 9.41 | 5.05 / 10.83 → 3.79 / 9.34 |

These are sampled, bidirectional reference-surface distances, not vessel registration errors, independently placed landmarks or anatomical accuracy percentages. Numerical acceptance required improvements in median and p95 for both withheld surfaces. The fits remain illustrative and anatomically unvalidated.

## Straight-sinus gap investigation and correction

The official canonical Z-Anatomy `Startup.blend` was opened with Blender 4.2.0, embedded scripts disabled. Evaluated world-space geometry reproduced the large straight-sinus gaps. This rules out an FBX-only export explanation for this source release. The canonical confluence annotation has two line points: one near the actual transverse junction and another displaced toward its label; the correction chooses the point nearest the transverse source geometry. It is used as an annotation anchor, not misrepresented as an actual confluence mesh.

The existing straight-sinus source tube has two open boundary rings. The superior ring was mapped to the posterior inferior-sagittal boundary-ring centre, and the other ring to the source confluence anchor. The proper rotation/translation and approximately 1.049 longitudinal scale preserve radial dimensions and existing topology. No new vessel segment or procedural connector was fabricated. This reconstructs the source tube's placement and requires anatomical review.

Original nearest-vertex gaps were approximately 11.89 mm at inferior sagittal → straight and 39.38 mm at straight → transverse. After source-guided correction and the refined shared fit they are approximately 0.25 mm and 1.05–1.06 mm. These are proximity measurements, not a watertight union, connected lumen, blood-flow test or proof of correct anatomy. The straight-sinus picker label and region information explicitly say **reconstructed placement**.

The full source correction matrix, end-ring centres, longitudinal/radial scales, positive determinant and before/after source distances are retained in `straight-sinus-correction.json`. The script asserts endpoint agreement and singular values of 1, 1 and the longitudinal scale so accidental radial scaling or reflection fails.

## Remaining issues

- The skull/neck CT-to-MRI transform is unchanged. Its previously documented brain–skull overlaps remain unresolved; improved brain-proxy fits of separate vascular references do not validate skull enclosure or cross-dataset junctions. Prior rigid and unconstrained affine alternatives performed worse on the measured checks.
- Cavernous source meshes still have two components and topology flags. Falx topology flags remain. They are not automatically fused or presented as repaired anatomy.
- A clinical or dependable anatomical reference still needs independent anatomy/vascular landmarks, suitable source/target imaging and expert review. The new checks and correction do not establish a coherent same-subject head.

## Reproduction

1. Extract official canonical `Z-Anatomy.zip` and open `Startup.blend` using Blender `--disable-autoexec --background ... --python scripts/extract-canonical-sinuses.py -- <workbench>`.
2. Run `scripts/test-shape-alignment.py` and the `--bodyparts` variant using the isolated SciPy dependency directory. Baseline matrices are retained in the published evaluation reports for repeatability.
3. Run `scripts/repair-straight-sinus.py`, then `scripts/build-meningeal-preview.py --shape-fit --repair-straight`.
4. Run `scripts/build-central-arteries.py <official-mapping-file> --shape-fit`.

The correction and refined fit flags are explicit; omitting them regenerates the earlier illustrative source-space/proxy-fit behaviour. Asset hashes, stable selection IDs, attribution and ShareAlike terms remain tracked. No new claim of anatomical validation is made.

Sources: [canonical Z-Anatomy release](https://github.com/Z-Anatomy/Models-of-human-anatomy), [source FBX models](https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models), [anatomical study of straight-sinus junction variability](https://pubmed.ncbi.nlm.nih.gov/1244434/).
