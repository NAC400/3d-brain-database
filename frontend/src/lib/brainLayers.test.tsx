import fs from 'fs';
import path from 'path';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import React from 'react';
import ControlsToolbar, { CATEGORY_GROUPS } from '../components/ControlsToolbar';
import { useBrainStore, type BrainRegion } from '../store/brainStore';
import { refineCategory, categoryIsVisible } from './brainLayers';

const modelDir = path.resolve(process.cwd(), 'public/models/spl-nac');
const rawRegions: BrainRegion[] = JSON.parse(fs.readFileSync(path.join(modelDir, 'regions.json'), 'utf8')).regions;
const regions = rawRegions.map((r) => ({ ...r, category: refineCategory(r.category, r.name, r.parentName) }));

beforeEach(() => {
  useBrainStore.setState({ activeCategories: new Set(), brainRegions: regions });
});
afterEach(cleanup);

test('every SPL structure has geometry and belongs to a reachable layer', () => {
  const glb = fs.readFileSync(path.join(modelDir, 'brain.glb'));
  const jsonSize = glb.readUInt32LE(12);
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonSize).toString('utf8'));
  const meshNames = new Set(gltf.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined).map((n: { name: string }) => n.name));
  const categories = new Set(CATEGORY_GROUPS.flatMap((g) => [...g.children]));
  expect(regions).toHaveLength(233);
  for (const r of regions) {
    expect(meshNames.has(r.meshName)).toBe(true);
    expect(categories.has(r.category)).toBe(true);
    expect(categoryIsVisible(r.category, new Set())).toBe(true);
  }
});

test('SPL diencephalon names resolve to the right subdivisions', () => {
  const expected = { 'Diencephalon – Thalamus': 24, 'Diencephalon – Hypothalamus': 10,
    'Diencephalon – Subthalamus': 2, 'Diencephalon – Epithalamus': 1, Diencephalon: 3 };
  for (const [category, count] of Object.entries(expected)) expect(regions.filter((r) => r.category === category)).toHaveLength(count);
  expect(refineCategory('Diencephalon', 'nucleus', 'Thalamus')).toBe('Diencephalon – Thalamus');
  expect(refineCategory('Diencephalon', 'left subthalamic nucleus', null)).toBe('Diencephalon – Subthalamus');
});

test('every group and available subdivision toggles the actual render filter', () => {
  render(<ControlsToolbar />);
  for (const group of CATEGORY_GROUPS) {
    const available = group.children.filter((c) => regions.some((r) => r.category === c));
    fireEvent.click(screen.getByRole('button', { name: group.label }));
    expect(Array.from(useBrainStore.getState().activeCategories).sort()).toEqual([...available].sort());
    expect(regions.filter((r) => categoryIsVisible(r.category, useBrainStore.getState().activeCategories)).length)
      .toBe(regions.filter((r) => available.includes(r.category)).length);
    fireEvent.click(screen.getByTitle('Clear filter — show all regions'));
    if (available.length > 1) {
      fireEvent.click(screen.getByLabelText(`Choose ${group.label} subdivisions`));
      for (const category of available) {
        const label = category.replace(/^(Telencephalon|Diencephalon|Mesencephalon)\s*[–-]\s*/i, '');
        const button = within(screen.getByRole('group', { name: `${group.label} subdivisions` })).getByRole('button', { name: label });
        fireEvent.click(button);
        expect(Array.from(useBrainStore.getState().activeCategories)).toEqual([category]);
        expect(regions.some((r) => categoryIsVisible(r.category, useBrainStore.getState().activeCategories))).toBe(true);
        fireEvent.click(button);
      }
      fireEvent.click(screen.getByLabelText(`Choose ${group.label} subdivisions`));
    }
  }
  expect(screen.queryByRole('button', { name: 'Olfactory / Paleocortex' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Tegmentum' })).not.toBeInTheDocument();
});
