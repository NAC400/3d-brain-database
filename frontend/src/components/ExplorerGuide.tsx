import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ExplorerGuide.css';

const storageKey = 'mapped-explorer-guide-v1';
const steps = [
  { target: 'scene', title: 'Explore the bilateral brain', text: 'The SPL/NAC brain is the main model. Drag to rotate, scroll to zoom, and drag with the middle mouse button to pan. On touch screens, use one finger to rotate and two fingers to zoom or pan.' },
  { target: 'search', title: 'Find and select a structure', text: 'Search for a brain region or click it in the model. The information panel lets you inspect the selection, isolate it, highlight it and add notes. Double-click a structure to isolate it.' },
  { target: 'tools', title: 'Look inside the anatomy', text: 'Use Layers in the bottom toolbar to filter anatomical categories, Cross Section to look inside, and Explode to separate brain structures. The atlas selector switches brain datasets. Return Explode to zero before viewing experimental layers.' },
  { target: 'head', title: 'Explore one anatomy source at a time', text: 'Open Anatomy sources to choose the brain, SPL skull and neck vessels, BodyParts3D central arteries, or Z-Anatomy dural folds and sinuses. These experimental fits are not validated against the main brain. Shared provenance does not prove accuracy. Outer dura, arachnoid, pia and fine vascular coverage are still incomplete.' },
  { target: 'research', title: 'Connect anatomy to research', text: 'Open Research with a structure selected to find papers, add references using a DOI or link, and connect sources to that structure. Personal and Community modes let you explore your own work or shared research.' },
  { target: 'projects', title: 'Organize your work', text: 'Use Projects to organize research, then visit Library to manage sources, citations and saved notes. Sign in for account features; check the interface for the availability of each feature.' },
  { target: 'guide', title: 'Keep sources and limitations in view', text: 'Find Data sources & licences, Contact and the contact email in the home page footer. They explain model provenance and let you report an issue. Shortcuts: R resets the camera, S focuses search, L opens Research, E toggles Explode and H toggles highlights. Replay this guide any time.' },
];

export default function ExplorerGuide() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'seen'; } catch { return true; }
  });
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const maskId = useId();
  const [placement, setPlacement] = useState<{ left: number; top: number; x: number; y: number; width: number; height: number } | null>(null);
  const finish = () => {
    try { localStorage.setItem(storageKey, 'seen'); } catch { /* Storage restrictions must not prevent dismissal. */ }
    setOpen(false);
  };
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) { element.close(); launch.current?.focus(); }
    return () => { if (element.open) element.close(); };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${steps[step].target}"]`);
    const details = target instanceof HTMLDetailsElement ? target : null;
    const wasOpen = details?.open;
    if (details) details.open = true;
    target?.classList.add('explorer-tour-target');
    const position = () => {
      if (!target || !dialog.current) return;
      const rect = target.getBoundingClientRect();
      const bubble = dialog.current.getBoundingClientRect();
      const padding = 12;
      const gap = 18;
      const x = Math.max(0, rect.left - 6);
      const y = Math.max(0, rect.top - 6);
      const width = Math.max(0, Math.min(window.innerWidth, rect.right + 6) - x);
      const height = Math.max(0, Math.min(window.innerHeight, rect.bottom + 6) - y);
      const candidates = [
        { left: x + width + gap, top: y },
        { left: x - bubble.width - gap, top: y },
        { left: x + (width - bubble.width) / 2, top: y + height + gap },
        { left: x + (width - bubble.width) / 2, top: y - bubble.height - gap },
      ];
      const fits = candidates.find(candidate => candidate.left >= padding && candidate.top >= padding &&
        candidate.left + bubble.width <= window.innerWidth - padding && candidate.top + bubble.height <= window.innerHeight - padding);
      // Wide targets such as the canvas and toolbar need a viewport-clamped position.
      const preferred = fits ?? (y > window.innerHeight / 2 ? candidates[3] : candidates[2]);
      setPlacement({
        left: Math.max(padding, Math.min(preferred.left, window.innerWidth - bubble.width - padding)),
        top: Math.max(padding, Math.min(preferred.top, window.innerHeight - bubble.height - padding)),
        x, y, width, height,
      });
    };
    position();
    const observer = new ResizeObserver(position);
    if (target) observer.observe(target);
    if (dialog.current) observer.observe(dialog.current);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      target?.classList.remove('explorer-tour-target');
      if (details) details.open = Boolean(wasOpen);
    };
  }, [open, step]);
  return <>
    <button ref={launch} data-tour="guide" className="explorer-guide-launch" onClick={() => { setStep(0); setOpen(true); }}>Explorer guide</button>
    {open && placement && createPortal(<svg className="explorer-guide-spotlight" aria-hidden="true">
      <defs><mask id={maskId}>
        <rect width="100%" height="100%" fill="white" />
        <rect x={placement.x} y={placement.y} width={placement.width} height={placement.height} rx="8" fill="black" />
      </mask></defs>
      <rect width="100%" height="100%" fill="#020617" fillOpacity="0.72" mask={`url(#${maskId})`} />
      <rect x={placement.x} y={placement.y} width={placement.width} height={placement.height} rx="8" fill="none" stroke="var(--product-accent)" strokeWidth="2" />
    </svg>, document.body)}
    <dialog ref={dialog} className="explorer-guide" data-explorer-tour-open={open ? 'true' : undefined}
      style={placement ? { left: placement.left, top: placement.top } : undefined}
      aria-labelledby="explorer-guide-title" aria-describedby="explorer-guide-description"
      onCancel={event => { event.preventDefault(); finish(); }}>
      <p className="explorer-guide-progress">Quick tour · {step + 1} of {steps.length}</p>
      <h2 id="explorer-guide-title">{steps[step].title}</h2>
      <p id="explorer-guide-description" aria-live="polite">{steps[step].text}</p>
      <div className="explorer-guide-actions">
        <button disabled={step === 0} onClick={() => setStep(current => current - 1)}>Back</button>
        <button className="explorer-guide-next" onClick={() => step === steps.length - 1 ? finish() : setStep(current => current + 1)}>{step === steps.length - 1 ? 'Start exploring' : 'Next'}</button>
      </div>
      <button className="explorer-guide-skip" onClick={finish}>I would like to explore alone</button>
    </dialog>
  </>;
}
