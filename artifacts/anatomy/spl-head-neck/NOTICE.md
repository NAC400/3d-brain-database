# SPL Head and Neck staging assets — modified, unregistered

All or portions of this licensed product (such portions are the "Software") have been obtained under license from The Brigham and Women's Hospital, Inc. and are subject to the terms and conditions in the adjacent LICENSE.txt, including all paragraphs of Part B.

Source: https://www.openanatomy.org/atlas-pages/atlas-spl-head-and-neck.html
Archive: https://www.openanatomy.org/atlases/nac/head-neck-2016-09.zip
Archive SHA256: C224F054569B284C9A948F6F96B0299EAEE13D3AC661A3386657A743FA8552C4
Inspected: 4 October 2026. Page release date: September 2015; archive identifier: head-neck-2016-09. These are recorded separately rather than assumed equivalent.

Authors: Marianna Jakab and Ron Kikinis, Surgical Planning Laboratory, Department of Radiology, Brigham and Women's Hospital, Harvard Medical School, Boston, MA, USA.
Other contributors: Neha Agrawal, Matthew D'Artista, Susan Kikinis, Dashawn Richardson, Daniel Sachs.
Sponsors: P41 RR013218/RR/NCRR NIH HHS/United States; P41 EB015902/EB/NIBIB NIH HHS/United States. The source page acknowledges NIH NCRR/NIBIB support and the Google Faculty Research Award.

Derived from a reduced-resolution MANIX CT dataset from OSIRIX, with labelled surfaces supplied by SPL. Original CT and label volumes are not redistributed here. Review any upstream third-party rights before public release.

MAPPED modifications: selected 12 VTK surfaces; converted to GLB; applied the same proposed RAS-to-viewer rotation as the brain (x=R, y=S, z=-A); recomputed normals; retained original colours and source IDs. No mirroring, decimation, fitting, or cross-subject registration applied.

This is a technical staging bundle, not the original atlas and not a registered or anatomically validated combined head. It must not be exposed as an aligned layer in Explorer. No institution endorses MAPPED. Research-only licence limitations and warranty disclaimers apply; see LICENSE.txt.

The separately named `skull-vessels-experimental-fit.glb` additionally applies one automatically estimated CT-to-MRI affine transform to all twelve structures before viewer rotation. It includes nonuniform scaling (principal factors approximately 1.153, 1.068, 1.032). The source hashes, library, matrix and optimization status appear in `experimental-registration.json`. This modified prototype has no independent landmark validation or anatomical acceptance, and is not released in the app.
