# Archived Allen Human Reference Atlas

Archived 6 October 2026. `allen-atlas.zip` preserves the original GLB,
region metadata (including structure identifiers), and a snapshot of the
project's attribution notices. It is outside `frontend/public`, so new builds
do not distribute it. Existing research, loader code, and API helpers are
retained. No Git history has been rewritten.

`manifest.json` records original paths, byte sizes, SHA-256 hashes, and the ZIP
checksum. Every entry was decompressed and checked against its original hash
before the loose model and metadata were removed. Keep the ZIP and manifest
together and include this directory in your normal repository backup. A local
archive by itself is not a separate backup.

## Restore

From the repository root, run:

```powershell
./scripts/restore-allen-atlas.ps1
```

The script verifies the ZIP and every entry, restores the original asset paths,
and refuses to overwrite differing assets. It leaves the archive intact.
Then add `REACT_APP_ENABLE_ALLEN_ATLAS=true` to `frontend/.env.local` and
restart/rebuild the frontend. Remove that setting to disable selection and
preloading again. The attribution snapshot remains inside the archive for
reference; the current root attribution document is preserved.

## Preservation notes

Source and licensing information is preserved from the existing project, not
independently re-audited. See the bundled `ATTRIBUTIONS.md` and the public Data
sources page. This preserves the processed model, not an original annotation
volume or a verified historical mesh-generation pipeline.

The model and metadata originally totalled 23,898,545 bytes. The ZIP, including
attribution, is 17,854,875 bytes (about 25% smaller). Git retains previous
versions, so this does not shrink historical Git objects. New deployments
omit roughly 23.9 MB of Allen assets.
