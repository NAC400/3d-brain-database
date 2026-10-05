import React, { useEffect, useRef, useState } from 'react';
import './ExplorerGuide.css';

const storageKey = 'mapped-explorer-guide-v1';
const steps = [
  { target: 'scene', title: 'Explore the bilateral brain', text: 'The SPL/NAC brain is the main model. Drag to rotate, scroll to zoom, and drag with the middle mouse button to pan. On touch screens, use one finger to rotate and two fingers to zoom or pan.' },
  { target: 'search', title: 'Find and select a structure', text: 'Search for a brain region or click it in the model. The information panel lets you inspect the selection, isolate it, highlight it and add notes. Double-click a structure to isolate it.' },
  { target: 'tools', title: 'Look inside the anatomy', text: 'Use Layers in the bottom toolbar to filter anatomical categories, Cross Section to look inside, and Explode to separate brain structures. The atlas selector switches brain datasets. Return Explode to zero before viewing experimental layers.' },
  { target: 'head', title: 'Explore one anatomy source at a time', text: 'Open Anatomy sources to choose the brain, SPL skull and neck vessels, BodyParts3D central arteries, or Z-Anatomy dural folds and sinuses. These experimental fits are not validated against the main brain. Shared provenance does not prove accuracy. Outer dura, arachnoid, pia and fine vascular coverage are still incomplete.' },
  { target: 'research', title: 'Connect anatomy to research', text: 'Open Research with a structure selected to find papers, add references using a DOI or link, and connect sources to that structure. Personal and Community modes let you explore your own work or shared research.' },
  { target: 'projects', title: 'Organize your work', text: 'Use Projects to organize research, then visit Library to manage sources, citations and saved notes. Sign in for account features; check the interface for the availability of each feature.' },
  { target: 'help', title: 'Keep sources and limitations in view', text: 'Data sources & licences explains model provenance, licences and validation limits. Contact lets you send feedback or report an issue. Shortcuts: R resets the camera, S focuses search, L opens Research, E toggles Explode and H toggles highlights. Replay this guide any time.' },
];

export default function ExplorerGuide() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'seen'; } catch { return true; }
  });
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const finish = () => {
    try { localStorage.setItem(storageKey, 'seen'); } catch { /* Storage restrictions must not prevent dismissal. */ }
    setOpen(false);
  };
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) { element.close(); launch.current?.focus(); }
    return () => { if (element.open) element.close(); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${steps[step].target}"]`);
    const details = target instanceof HTMLDetailsElement ? target : null;
    const wasOpen = details?.open;
    if (details) details.open = true;
    target?.classList.add('explorer-tour-target');
    return () => {
      target?.classList.remove('explorer-tour-target');
      if (details) details.open = Boolean(wasOpen);
    };
  }, [open, step]);
  return <>
    <button ref={launch} className="explorer-guide-launch" onClick={() => { setStep(0); setOpen(true); }}>Explorer guide</button>
    <dialog ref={dialog} className="explorer-guide" data-explorer-tour-open={open ? 'true' : undefined}
      aria-labelledby="explorer-guide-title" aria-describedby="explorer-guide-description"
      onCancel={event => { event.preventDefault(); finish(); }}>
      <p className="explorer-guide-progress">QUICK TOUR · {step + 1} OF {steps.length}</p>
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
