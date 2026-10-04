"""Render diagnostic volume overlays; these images do not validate registration."""
from pathlib import Path
import json
import sys
sys.path.insert(0, str(Path('artifacts/anatomy/python-deps').resolve()))
import SimpleITK as sitk
import numpy as np
from PIL import Image, ImageDraw

fixed = sitk.GetArrayFromImage(sitk.ReadImage(sys.argv[1]))
ct = sitk.GetArrayFromImage(sitk.ReadImage('artifacts/anatomy/spl-head-neck/experimental-ct-in-brain-space.mha'))
report = json.loads(Path('artifacts/anatomy/spl-head-neck/experimental-registration.json').read_text())
# Specific to the recorded brain direction: array axes are L, -S, P.
views = [('Axial', lambda a: a[:, 105, :].T),
         ('Coronal', lambda a: a[:, :, 128].T),
         ('Sagittal', lambda a: a[128, :, :])]
canvas = Image.new('RGB', (900, 1010), '#101820')
draw = ImageDraw.Draw(canvas)
draw.text((12, 8), 'EXPERIMENTAL CT-to-MRI ' + ('affine' if report.get('affineExperiment') else 'rigid') + ' registration - NOT ANATOMICALLY VALIDATED', fill='white')
draw.text((12, 30), 'No landmark validation. Red = transformed CT voxels above 300 HU.', fill='#ffb0b0')
for column, label in enumerate(['Brain MRI', 'Transformed CT', 'MRI + CT bone overlay']):
    draw.text((column * 300 + 12, 60), label, fill='white')
for row, (name, select) in enumerate(views):
    mri = select(fixed).astype(float)
    bone = select(ct).astype(float)
    values = mri[mri > 0]
    high = np.percentile(values, 99) if len(values) else 1
    gray = np.clip(mri / max(high, 1) * 255, 0, 255).astype('uint8')
    ctgray = np.clip((bone + 1000) / 2500 * 255, 0, 255).astype('uint8')
    rgb = np.repeat(gray[:, :, None], 3, axis=2)
    overlay = rgb.copy()
    mask = bone > 300
    overlay[mask] = (rgb[mask].astype(float) * 0.4 + np.array([255, 65, 65]) * 0.6).astype('uint8')
    for column, pixels in enumerate([rgb, np.repeat(ctgray[:, :, None], 3, axis=2), overlay]):
        image = Image.fromarray(pixels).resize((288, 288))
        canvas.paste(image, (column * 300 + 6, row * 300 + 100))
    draw.text((12, row * 300 + 82), name + ' / diagnostic slice', fill='white')
canvas.save('artifacts/anatomy/spl-head-neck/registration-review.png')
