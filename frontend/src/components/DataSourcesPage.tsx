import React, { useEffect, useState } from 'react';
import './DataSourcesPage.css';

const DataSourcesPage: React.FC = () => {
  const [documents, setDocuments] = useState<{ license: string; notice: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    // Display the distributed legal documents themselves so the disclosure
    // cannot silently diverge from the licence shipped alongside the model.
    const read = async (name: string) => {
      const response = await fetch(`/models/spl-nac/${name}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Document unavailable');
      return response.text();
    };
    Promise.all([read('LICENSE.txt'), read('NOTICE.md')])
      .then(([license, notice]) => setDocuments({ license, notice }))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);

  return (
    <main className="data-sources-page" aria-labelledby="data-sources-title">
      <div id="data-sources" className="data-sources-content">
        <p className="data-sources-eyebrow">ABOUT MAPPED</p>
        <h1 id="data-sources-title">Data sources & licences</h1>
        <p>MAPPED uses third-party anatomical reference data. Learn where each model comes from, how we have adapted it, and which terms apply to its use.</p>
        <nav aria-label="Data sources on this page"><a href="#spl-source">SPL/NAC</a><a href="#allen-source">Allen</a><a href="#mni-source">MNI reference</a></nav>

        <section id="spl-source" aria-labelledby="spl-title">
          <span className="data-sources-badge">Default bilateral model</span>
          <h2 id="spl-title">SPL/NAC Brain Atlas</h2>
          <p>Released in January 2017 by the Open Anatomy Project. Developed through a collaboration between Brigham and Women’s Hospital and Massachusetts General Hospital, using MRI scans of a healthy 42-year-old male volunteer. Automated labelling was followed by manual segmentation of many structures.</p>
          <dl><dt>In MAPPED</dt><dd>233 selected brain surfaces, including 109 labelled left and 109 labelled right structures, and 15 other structures. Both hemispheres are from the source data.</dd><dt>Adaptations</dt><dd>Converted VTK surfaces to GLB, rotated coordinates for the viewer, and recomputed normals. No mirroring or decimation. Original MRI volumes and external head structures are not included.</dd><dt>Licence</dt><dd>3D Slicer Contribution and Software License Agreement, version 1.0 (20 December 2005), Part B.</dd><dt>Use and redistribution</dt><dd>The licence permits royalty-free use, modification, display, redistribution, and inclusion in proprietary products, subject to its conditions. Preserve notices and applicable licences, identify modifications, and do not imply institutional endorsement. Publication of modifications as open source is optional.</dd></dl>
          <p>Authors: Michael Halle, Florin Talos, Marianna Jakab, Nikos Makris, Dominic Meier, Laurence Wald, Bruce Fischl, and Ron Kikinis. Additional contributors and funding acknowledgements appear in the distributed notice below.</p>
          <div className="data-sources-links"><a href="https://www.openanatomy.org/atlas-pages/atlas-spl-nac-brain.html">Original atlas and contributors ↗</a><a href="/models/spl-nac/NOTICE.md">Download attribution notice</a><a href="/models/spl-nac/LICENSE.txt">Full licence text</a><a href="/models/spl-nac/manifest.json">Conversion provenance</a></div>
          <p>All or portions of this licensed product (such portions are the “Software”) have been obtained under license from The Brigham and Women’s Hospital, Inc. and are subject to the following terms and conditions:</p>
          {failed && <p role="alert">The inline documents could not be loaded. Use the full licence and attribution links above.</p>}
          {!documents && !failed && <p role="status">Loading licence and attribution…</p>}
          {documents && <><details><summary>Read the full licence agreement</summary><pre>{documents.license}</pre></details><details><summary>Read attribution and modification notices</summary><pre>{documents.notice}</pre></details></>}
        </section>

        <section id="allen-source" aria-labelledby="allen-title">
          <span className="data-sources-badge">Original atlas option</span>
          <h2 id="allen-title">Allen Human Reference Atlas — 3D, 2020</h2>
          <p>A 141-structure adult human brain parcellation drawn on the ICBM 2009b nonlinear symmetric reference volume. The original Allen model remains available in the Explorer atlas selector, including access to research saved against its structure identifiers.</p>
          <dl><dt>Source version</dt><dd>1.0.0 · RRID: SCR_017764 · © 2019 Allen Institute for Brain Science.</dd><dt>Adaptations</dt><dd>Distributed as GLB meshes with region metadata for selection, filtering, and research links. This is a processed model, not the original annotation volume. The complete historical mesh-export procedure has not yet been verified.</dd><dt>Licence</dt><dd>Creative Commons Attribution 4.0 International (CC BY 4.0), effective for these materials from 1 September 2022.</dd><dt>Use and redistribution</dt><dd>Commercial use and adaptation are permitted. Provide attribution, retain relevant notices, link to the licence, indicate changes, and avoid additional restrictions on the licensed material. Attribution does not imply endorsement.</dd></dl>
          <p className="data-sources-citation">Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A.C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng, and Ed S. Lein (2020). Allen Human Reference Atlas — 3D, 2020. RRID: SCR_017764, version 1.0.0. Allen Institute for Brain Science.</p>
          <div className="data-sources-links"><a href="https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/">Original dataset ↗</a><a href="https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf">Dataset documentation ↗</a><a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 licence ↗</a><a href="https://alleninstitute.org/legal/citation-policy/">Citation policy ↗</a></div>
        </section>

        <section id="mni-source" aria-labelledby="mni-title">
          <span className="data-sources-badge">Reference underlying the Allen atlas</span>
          <h2 id="mni-title">ICBM 152 nonlinear reference templates — 2009</h2>
          <p>Population-average MRI templates from the McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University. The Allen parcellation uses the ICBM 2009b nonlinear symmetric reference. MAPPED does not present this as a separate selectable model or claim to distribute the original MRI volume.</p>
          <p>The source permits use, copying, modification, and distribution for any purpose without fee, provided its copyright notice appears in all copies. It is supplied without warranty.</p>
          <p>Copyright © 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University.</p>
          <p className="data-sources-citation">Fonov VS, Evans AC, Botteron K, Almli CR, McKinstry RC, Collins DL, and BDCG (2011). Unbiased average age-appropriate atlases for pediatric studies. NeuroImage 54(1). DOI: 10.1016/j.neuroimage.2010.07.033.<br />Fonov VS, Evans AC, McKinstry RC, Almli CR, and Collins DL (2009). Unbiased nonlinear average age-appropriate brain templates from birth to adulthood. NeuroImage 47, Supplement 1, S102. DOI: 10.1016/S1053-8119(09)70884-5.</p>
          <div className="data-sources-links"><a href="https://nist.mni.mcgill.ca/icbm-152-nonlinear-atlases-2009/">Template documentation and licence ↗</a></div>
        </section>

        <section aria-labelledby="limitations-title"><h2 id="limitations-title">Reference-model limitations</h2><p>These models support research and learning. They do not represent a particular user's anatomy, and MAPPED's conversions have not received independent anatomical or clinical validation. The Slicer licence states that clinical applications are not recommended or approved. No source institution endorses MAPPED.</p><p>Skull, vascular, and meningeal models are not currently integrated. Any additional dataset will receive its own source, attribution, modification, and licence disclosure.</p></section>
        <p className="data-sources-updated">Disclosures reviewed 4 October 2026. The original licence terms govern the respective materials; the summaries above do not replace them.</p>
      </div>
    </main>
  );
};
export default DataSourcesPage;
