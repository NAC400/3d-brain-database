# Explorer source views and first-entry guide

Implemented 2026-10-06. Geometry is unchanged: this work establishes how to explore the existing collections without implying a validated whole head.

## Recommended views

- **Brain · SPL/NAC:** main bilateral brain, experimental collections off.
- **Skull & neck vessels · SPL:** skull, mandible, neck arteries and jugular veins from the SPL head/neck collection. This is a different subject/dataset from the SPL/NAC brain.
- **Central arteries · BodyParts3D:** central arterial collection alone.
- **Dural folds & sinuses · Z-Anatomy:** folds and sinus collection together, including the previously reconstructed straight-sinus placement.

Experimental presets hide the main brain and disable other collections. The optional “Show main brain for comparison” checkbox supports explicitly illustrative overlays. Switching presets clears selection/isolation/hover, resets Explode and cross sections, and selects the SPL atlas if needed. Brain metadata remains loaded; hidden meshes are excluded from pointer hits.

A single consolidated experimental disclosure recommends separate source collections, explains that fits and connections remain unvalidated, and does not claim complete head anatomy. Technical findings and missing layers are in “Validation details & missing anatomy”. Existing selected-structure provenance and licence information remain available.

Shared provenance is a useful grouping rule, not proof of anatomical accuracy. Existing transforms remain applied in source views. Full outer dura, arachnoid, pia and fine vascular coverage remain unavailable: this UX change does not meet a requirement for complete neuroanatomy.

## Guide

Seven steps cover navigation, selection, inspection tools, anatomy sources, research, projects/library and provenance/contact/shortcuts. A native modal dialog provides keyboard focus containment; Escape or “I would like to explore alone” dismisses it. Completion and skipping are remembered in this browser with `mapped-explorer-guide-v1`; “Explorer guide” replays it. Blocked browser storage falls back to a dismissible guide for each entry.

The guide highlights relevant controls and temporarily opens the source panel on its anatomy step. It restores that panel's prior open state and does not change scene or research settings. App keyboard shortcuts are suppressed while the guide is open.

## Verification

TypeScript checks passed. Production build passed with the pre-existing MediaPipe missing-source-map warning. Browser checks covered all seven guide steps, Back, skip, completion, remembered dismissal after reload, replay, all three experimental presets, main-brain comparison, dropdown selection and direct pointer selection of the basilar artery with the brain hidden. Preview: artifacts/ui/explorer-source-guide.png.
