import React from 'react';
import { useBrainStore } from '../store/brainStore';
import type { BrainState } from '../store/brainStore';
import './HomePage.css';
import ContactLink from './ContactLink';

const FEATURES: { title: string; description: string; page: BrainState['appPage']; action: string }[] = [
  { title: 'Explore anatomy', description: 'Explore both brain hemispheres in three dimensions. Isolate structures, filter anatomy, and explore cross-sections.', page: 'explorer', action: 'Open Brain Explorer' },
  { title: 'Connect the evidence', description: 'Import papers from PubMed or DOI, link sources to brain regions, and export citations.', page: 'library', action: 'View Research Library' },
  { title: 'Build shared knowledge', description: 'Explore community contributions and share connections between brain structures and scientific literature.', page: 'community', action: 'Explore Community Atlas' },
];

const HomePage: React.FC = () => {
  const { setAppPage, sources, structureLinks, user, brainAtlas } = useBrainStore();
  const bilateral = brainAtlas === 'spl';
  return (
    <div className="mapped-home">
      <a className="home-skip" href="#home-main">Skip to content</a>
      <header className="home-header">
        <div className="home-brand"><span className="home-wordmark">MAPPED<span>.</span></span><span className="home-brand-caption">ANATOMY / EVIDENCE / DISCOVERY</span></div>
        <nav className="home-nav" aria-label="Main navigation">
          {(['explorer', 'library', 'community'] as const).map(page => <button key={page} onClick={() => setAppPage(page)}>{page.charAt(0).toUpperCase() + page.slice(1)}</button>)}
          <button className="home-account" onClick={() => setAppPage('auth')}>{user ? user.email.split('@')[0] : 'Sign In'}</button>
        </nav>
      </header>
      <main id="home-main" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-intro">
            <p className="home-eyebrow"><span className="home-alpha">ALPHA</span> Neuroscience research & learning</p>
            <h1 id="home-title">Explore brain anatomy.<br /><span>Connect it to evidence.</span></h1>
            <p className="home-description">MAPPED connects brain anatomy with a community-curated collection of scientific evidence. Explore structures, organize research, and discover how they relate.</p>
            <div className="home-actions">
              <button className="home-primary" onClick={() => setAppPage('explorer')}>Open Brain Explorer <span aria-hidden="true">↗</span></button>
              <button className="home-secondary" onClick={() => setAppPage('library')}>View Research Library <span aria-hidden="true">→</span></button>
            </div>
          </div>
          <aside className="home-atlas" aria-label="Atlas and workspace overview">
            <svg className="home-anatomy-art" viewBox="0 0 360 190" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="home-anatomy-stroke" x1="60" y1="40" x2="300" y2="160" gradientUnits="userSpaceOnUse"><stop stopColor="#7db6ff"/><stop offset="1" stopColor="#97e0d4"/></linearGradient>
              </defs>
              <ellipse className="home-art-orbit" cx="180" cy="98" rx="157" ry="72" transform="rotate(-12 180 98)" />
              <ellipse className="home-art-orbit" cx="180" cy="98" rx="132" ry="87" transform="rotate(18 180 98)" />
              <path className="home-art-guide" d="M180 8V180M14 98H346"/>
              <g stroke="url(#home-anatomy-stroke)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path className="home-art-brain" d="M178 47C163 30 137 32 123 47C103 44 83 60 83 78C64 91 65 116 84 126C87 148 112 159 132 150C147 166 169 157 178 142Z M184 47C199 30 225 32 239 47C259 44 279 60 279 78C298 91 297 116 278 126C275 148 250 159 230 150C215 166 193 157 184 142Z"/>
                <path d="M124 48C140 52 139 70 128 78C112 77 106 89 112 103M87 78C101 72 114 78 116 86M84 126C97 124 101 111 96 102M132 150C123 139 126 125 139 121C152 118 156 105 150 94M177 64C160 60 151 70 154 80M176 139C162 141 152 134 152 123M113 137C104 124 111 113 123 113M238 48C222 52 223 70 234 78C250 77 256 89 250 103M275 78C261 72 248 78 246 86M278 126C265 124 261 111 266 102M230 150C239 139 236 125 223 121C210 118 206 105 212 94M185 64C202 60 211 70 208 80M186 139C200 141 210 134 210 123M249 137C258 124 251 113 239 113"/>
              </g>
              <g className="home-art-node"><circle cx="128" cy="78" r="3"/><circle cx="223" cy="121" r="3"/><circle cx="154" cy="80" r="3"/><circle cx="278" cy="126" r="3"/></g>
              <path className="home-art-link" d="M128 78L154 80L223 121L278 126"/>
            </svg>
            <p className="home-eyebrow">ANATOMICAL FOUNDATION</p>
            <div className="home-atlas-count">{bilateral ? 233 : 141}<span>brain structures</span></div>
            <h2>{bilateral ? 'SPL/NAC Bilateral Brain Atlas' : 'Allen Human Reference Atlas'}</h2>
            <p className="home-atlas-meta">{bilateral ? 'Atlas release 2017 · Both hemispheres' : 'Atlas version 2020 · Original atlas'}</p>
            {bilateral && <p className="home-atlas-meta">Derived from the Brigham and Women’s Hospital SPL/NAC atlas. <a href="/models/spl-nac/LICENSE.txt" style={{ color: 'var(--home-accent)' }}>Licence and notices</a></p>}
            <div className="home-workspace">
              <p className="home-eyebrow">YOUR WORKSPACE</p>
              <dl><div><dt>Saved sources</dt><dd>{sources.length}</dd></div><div><dt>Region–source links</dt><dd>{structureLinks.length}</dd></div></dl>
              <p className="home-workspace-note">Counts reflect research saved in this browser.</p>
            </div>
          </aside>
        </section>
        <section className="home-workflows" aria-labelledby="home-workflows-title">
          <p className="home-eyebrow">FROM STRUCTURE TO SOURCE</p>
          <h2 id="home-workflows-title">Three ways to explore neuroscience.</h2>
          <div className="home-feature-grid">
            {FEATURES.map((feature, index) => <article className="home-feature" key={feature.page}>
              <span className="home-feature-number" aria-hidden="true">0{index + 1}</span>
              <h3>{feature.title}</h3><p>{feature.description}</p>
              <button onClick={() => setAppPage(feature.page)}>{feature.action}<span aria-hidden="true">→</span></button>
            </article>)}
          </div>
        </section>
      </main>
      <footer className="home-footer"><span>MAPPED / Neuroscience research & learning</span><ContactLink /><span>Alpha · © {new Date().getFullYear()}</span></footer>
    </div>
  );
};
export default HomePage;
