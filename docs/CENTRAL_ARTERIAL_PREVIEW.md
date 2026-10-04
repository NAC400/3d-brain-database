# Central intracranial arterial preview

Implemented 5 October 2026 as an optional BodyParts3D layer. Open Explorer → Experimental head layers → Show experimental head layers → Central arteries (BodyParts3D). Hide the skull and SPL neck arteries to inspect it; enable Layers for a translucent brain. Each supplied element can be selected from the structure picker, clicked, highlighted or isolated.

## Coverage

| Structure | Source elements | Scope |
|---|---|---|
| ACA, right / left | FJ1654 / FJ1654M | Supplied ACA representations; subdivisions beyond these elements are not separately certified |
| Anterior communicating artery | FJ1655 | Single supplied connector |
| Posterior communicating arteries | FJ1713 / FJ1713M | Bilateral supplied connectors |
| MCA M1 | FJ1692 / FJ1692M | Bilateral sphenoid segments |
| Selected MCA M2 parts | FJ1660, FJ1694 and M counterparts | Insular parts; two separately selectable elements per side |
| PCA P1 | FJ1723 / FJ1723M | Bilateral precommunicating segments |
| PCA P2 | FJ1714 / FJ1714M | Bilateral postcommunicating segments |
| Basilar | FJ1672 | FJ1844 is an overlapping alternative and is excluded |
| Internal carotids | FJ1682 / FJ1682M | Full supplied ICA representations, including extracranial portions; not relabeled as intracranial-only segments |

18 actual meshes are displayed, with unique dataset-specific selection IDs. The source concept mappings, hashes, counts, topology and junction proximity checks are in the distributed `coverage-and-alignment.json`. The mapping identifies Circle of Willis components; it does not establish a watertight, physiologically connected lumen or variant completeness. No missing connectors were fabricated. Fine branches and perforators are outside this increment.

Every selected OBJ has one connected component and zero nonmanifold edges in the indexed source topology check. Most have open boundary edges, consistent with supplied segmented/open-ended representations but not proof of complete vascular courses. These boundaries are retained rather than automatically capped. Left M-element bounding boxes differ from reflected right counterpart bounds by only approximately 0.0001–0.01 mm; this flags near-symmetric source anatomy and is not evidence of independent bilateral acquisition.

## Alignment and limitations

One proper similarity transform uses centres of bounding boxes of the source and target pons, left/right putamen and left/right caudate. Source laterality is checked from matching labeled structures, and X/Y are flipped into target RAS before fitting. The transformation preserves handedness and applies one uniform scale of approximately 0.914 to every artery. Viewer rotation is applied after fitting; runtime uses the actual brain group's origin and existing millimetre scale.

Fitting proxy errors range from 3.08 to 8.01 mm. Withheld hippocampal centre differences are 9.79 mm (right) and 9.34 mm (left). **This is an illustrative experimental fit, not an anatomically accepted registration.** Structure bounding-box centres are not independently placed anatomical landmarks, and these numbers are not vessel registration errors.

Selected junction minimum vertex gaps range from about 0.07 to 0.22 mm for the circle/trunk junctions. The two M2 elements per side have about 2.14 mm minimum gaps. These measurements screen proximity, not surface contact or lumen continuity; the 3 mm diagnostic screen is not an anatomical acceptance threshold. The source uses 99% polygon-reduced geometry and includes bilateral M elements with symmetric representations. MAPPED did not generate new mirrored anatomy. This is not a subject-specific vascular reconstruction.

The previously fitted SPL skull and neck vessels use a different CT-to-MRI transform with known brain–skull overlap concerns. Combining both references does not establish artery-to-bone or neck-to-intracranial continuity. The BodyParts3D layer is off by default and its warning remains visible when enabled. Independent landmarks, target vascular imaging where available, and expert anatomical review remain necessary before promoting it to a dependable anatomy layer.

## Reproduction and licence

Run `scripts/build-central-arteries.py <official-isa_element_parts.txt>` with Python and NumPy, after extracting the selected source OBJ files and the brain reference proxies into `artifacts/anatomy/bodyparts3d-candidates`. The script builds the GLB, UI metadata, source notice and coverage/alignment report without a new anatomical fit per vessel. Review both the report and the preview after regenerating.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. [Official download](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), [full CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/legalcode). The current official licence page is dated 27 February 2025; the original OBJ headers retain older notices. Source bytes remain intact in the workbench. The public notice records selection, triangulation, normal regeneration, shared fitting and rotation. No endorsement is implied. The app's Data Sources page includes these disclosures.
