import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ResearchPanel from './ResearchPanel';
import { useBrainStore } from '../store/brainStore';
import { fetchCommunityProjects, communityProjectPapers, fetchGlobalContributions, fetchContributionsByRegion, isCommunityProject } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  ...jest.requireActual('../lib/supabase'),
  isSupabaseConfigured: () => true,
  fetchCommunityProjects: jest.fn(),
  fetchGlobalContributions: jest.fn().mockResolvedValue([]),
  fetchContributionsByRegion: jest.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  (fetchGlobalContributions as jest.Mock).mockResolvedValue([]);
  (fetchContributionsByRegion as jest.Mock).mockResolvedValue([]);
  useBrainStore.setState({ researchPanelOpen: true, explorerMode: 'community', selectedRegion: null, regionMap: {}, sources: [], structureLinks: [], projects: [], activeProjectId: null, viewingSourceId: null });
  (fetchCommunityProjects as jest.Mock).mockResolvedValue([{ id: 'p', name: 'Memory project', papers: [{ id: 'a', title: 'Unlinked paper', authors: ['Author'], tags: ['Memory'], regions: [] }], updated_at: '2026-10-07' }]);
});

test('community defaults to projects without a region and opens project papers', async () => {
  render(<ResearchPanel />);
  fireEvent.click(await screen.findByText('Memory project'));
  expect(screen.getByText('Unlinked paper')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Search community projects'), { target: { value: 'unrelated' } });
  expect(screen.queryByText('Memory project')).not.toBeInTheDocument();
});

test('community failures show retry instead of a false empty state', async () => {
  (fetchCommunityProjects as jest.Mock).mockRejectedValue(new Error('Unavailable'));
  render(<ResearchPanel />);
  expect(await screen.findByText('Could not load shared projects. Your community projects remain accessible below.')).toBeInTheDocument();
  expect(screen.getByText('Try again')).toBeInTheDocument();
  expect(screen.queryByText(/No shared projects yet/)).not.toBeInTheDocument();
});

test('empty community project opens even when the public project table is missing', async () => {
  (fetchCommunityProjects as jest.Mock).mockRejectedValue({ code: 'PGRST205' });
  useBrainStore.setState({ projects: [{ id: 'draft', name: 'My empty project', mode: 'community', color: '#ffffff', createdAt: '' }], activeProjectId: 'draft' });
  render(<ResearchPanel />);
  expect(screen.getByText('My empty project')).toBeInTheDocument();
  expect(screen.getByText('No papers yet. Add your first paper in Library.')).toBeInTheDocument();
  expect(await screen.findByText('Shared projects are not available yet. Your community projects remain accessible below.')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Open in Library'));
  expect(useBrainStore.getState().appPage).toBe('library');
  expect(useBrainStore.getState().activeProjectId).toBe('draft');
});

test('personal projects open papers and mode changes keep their work attached', async () => {
  useBrainStore.setState({ explorerMode: 'personal', projects: [{ id: 'mine', name: 'My work', mode: 'private', color: '#ffffff', createdAt: '' }], activeProjectId: 'mine',
    sources: [{ id: 'paper', title: 'My research', authors: [], tags: [], notes: [], isGlobal: false, createdAt: '', projectId: 'mine' }] });
  render(<ResearchPanel />);
  fireEvent.click(screen.getByText('My research'));
  expect(useBrainStore.getState().viewingSourceId).toBe('paper');
  await act(async () => { useBrainStore.getState().updateProject('mine', { mode: 'community' }); });
  expect(screen.getByLabelText('Search community projects')).toBeInTheDocument();
  expect(screen.getByText('My research')).toBeInTheDocument();
  await act(async () => { useBrainStore.getState().updateProject('mine', { mode: 'private' }); });
  expect(screen.getByLabelText('Search personal projects')).toBeInTheDocument();
  expect(screen.getByText('My research')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Open in Library'));
  expect(useBrainStore.getState().activeProjectId).toBe('mine');
  expect(useBrainStore.getState().sources[0].projectId).toBe('mine');
});

test('published snapshot excludes private notes and papers outside the project', () => {
  const source = { id: 'a', title: 'Paper', authors: [], tags: [], isGlobal: false, createdAt: '', projectId: 'p', notes: [{ id: 'note', content: 'Private notes', createdAt: '', updatedAt: '', versions: [] }] };
  const publicPapers = communityProjectPapers('p', [source, { ...source, id: 'b', projectId: 'private' }], []);
  expect(publicPapers).toHaveLength(1);
  expect(publicPapers[0]).not.toHaveProperty('notes');
  expect(publicPapers[0].regions).toEqual([]);
});

test('malformed public snapshots are rejected before rendering', () => {
  expect(isCommunityProject({ id: 'p', user_id: 'u', name: 'Project', color: '#ffffff', updated_at: '', papers: [null] })).toBe(false);
  expect(isCommunityProject({ id: 'p', user_id: 'u', name: 'Project', color: '#ffffff', updated_at: '', papers: [] })).toBe(true);
});
