"""CT/MRI rigid registration experiment; NOT an anatomical release certificate.

Usage: python scripts/register-head-layer-experiment.py <brain-T1.nrrd> <head-CT.nrrd>
Dependencies: SimpleITK 2.5.6 (isolated in artifacts/anatomy/python-deps).
Writes an explicit unreviewed transform, provenance, and an image for review.
"""
from pathlib import Path
import hashlib
import json
import sys
import time

sys.path.insert(0, str(Path('artifacts/anatomy/python-deps').resolve()))
import SimpleITK as sitk

sitk.ProcessObject.SetGlobalDefaultNumberOfThreads(4)
fixed_path, moving_path = map(Path, sys.argv[1:3])
fixed = sitk.ReadImage(str(fixed_path), sitk.sitkFloat32)
moving_original = sitk.ReadImage(str(moving_path), sitk.sitkFloat32)
# CT clipping limits domination by extremely bright bone/metal and air values.
# Mutual information accommodates different modalities; it cannot prove fit.
moving = sitk.Clamp(moving_original, lowerBound=-1000, upperBound=1500)
initial = sitk.CenteredTransformInitializer(
    fixed, moving, sitk.Euler3DTransform(),
    sitk.CenteredTransformInitializerFilter.GEOMETRY)
registration = sitk.ImageRegistrationMethod()
registration.SetMetricAsMattesMutualInformation(50)
registration.SetMetricSamplingStrategy(registration.RANDOM)
registration.SetMetricSamplingPercentage(0.05, 20261004)
registration.SetInterpolator(sitk.sitkLinear)
registration.SetOptimizerAsRegularStepGradientDescent(
    learningRate=2.0, minStep=0.01, numberOfIterations=150,
    relaxationFactor=0.5, gradientMagnitudeTolerance=1e-6)
registration.SetOptimizerScalesFromPhysicalShift()
registration.SetShrinkFactorsPerLevel([4, 2, 1])
registration.SetSmoothingSigmasPerLevel([2, 1, 0])
registration.SmoothingSigmasAreSpecifiedInPhysicalUnitsOn()
registration.SetInitialTransform(initial, inPlace=False)
start = time.time()
result = registration.Execute(fixed, moving)
rigid_stop = registration.GetOptimizerStopConditionDescription()
rigid_metric = registration.GetMetricValue()
# Optional cross-subject affine experiment. It is still one shared transform
# for skull and vessels, never a per-mesh visual fit or an acceptance verdict.
if '--affine' in sys.argv:
    rigid = sitk.Euler3DTransform(result.GetBackTransform())
    affine = sitk.AffineTransform(3)
    affine.SetCenter(rigid.GetCenter())
    affine.SetMatrix(rigid.GetMatrix())
    affine.SetTranslation(rigid.GetTranslation())
    registration.SetInitialTransform(affine, inPlace=False)
    registration.SetOptimizerAsGradientDescentLineSearch(
        learningRate=1.0, numberOfIterations=100,
        convergenceMinimumValue=1e-5, convergenceWindowSize=10)
    registration.SetOptimizerScalesFromPhysicalShift()
    registration.SetShrinkFactorsPerLevel([4, 2])
    registration.SetSmoothingSigmasPerLevel([2, 1])
    result = registration.Execute(fixed, moving)

def matrix(transform):
    # TransformPoint includes rotation about the transform's nonzero centre.
    # Exporting parameters directly as a 4x4 would lose that translation.
    origin = transform.TransformPoint((0., 0., 0.))
    columns = [transform.TransformPoint(tuple(float(i == j) for i in range(3))) for j in range(3)]
    return [[columns[j][i] - origin[i] for j in range(3)] + [origin[i]] for i in range(3)] + [[0, 0, 0, 1]]

inverse_lps = matrix(result.GetInverse())
# Slicer model positions use RAS, while SimpleITK image physical positions use LPS.
flips = [-1, -1, 1, 1]
inverse_ras = [[inverse_lps[i][j] * flips[i] * flips[j] for j in range(4)] for i in range(4)]

def image_info(path, image):
    return {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'size': image.GetSize(), 'spacing': image.GetSpacing(),
            'originLPS': image.GetOrigin(), 'directionLPS': image.GetDirection()}

output = Path('artifacts/anatomy/spl-head-neck')
sitk.WriteTransform(result, str(output / 'experimental-mri-to-ct-lps.tfm'))
resampled = sitk.Resample(moving_original, fixed, result, sitk.sitkLinear, -1000, sitk.sitkFloat32)
sitk.WriteImage(resampled, str(output / 'experimental-ct-in-brain-space.mha'), True)
report = {'status': 'EXPERIMENTAL / UNREVIEWED / DO NOT USE IN EXPLORER',
          'method': ('Rigid Euler3D then affine' if '--affine' in sys.argv else 'Rigid Euler3D') + '; Mattes mutual information; geometry-centre initialization; no landmarks or masks',
          'library': 'SimpleITK ' + sitk.Version_VersionString(),
          'fixed': image_info(fixed_path, fixed), 'moving': image_info(moving_path, moving_original),
          'elapsedSeconds': round(time.time() - start, 2),
          'finalSampledMetric': registration.GetMetricValue(),
          'optimizerStop': registration.GetOptimizerStopConditionDescription(),
          'affineExperiment': '--affine' in sys.argv,
          'rigidOptimizerStop': rigid_stop, 'rigidSampledMetric': rigid_metric,
          'fixedMRIToMovingCTLPS': matrix(result), 'movingCTToFixedMRIRAS': inverse_ras,
          'landmarkResidualsMillimetres': None, 'anatomicalReviewer': None,
          'limitations': ['Different individuals: a rigid transform cannot establish detailed anatomical correspondence.',
                         'Mutual-information optimisation may converge to an incorrect local optimum.',
                         'Needs orthogonal volume overlays, independent landmarks, and anatomical review.',
                         'Do not treat a common coordinate system or convergence as validation.']}
(output / 'experimental-registration.json').write_text(json.dumps(report, indent=2))
print(json.dumps({key: report[key] for key in ['status', 'elapsedSeconds', 'finalSampledMetric', 'optimizerStop']}))
