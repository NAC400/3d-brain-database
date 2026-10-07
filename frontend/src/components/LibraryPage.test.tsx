import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LibraryPage from './LibraryPage';
import AddSourceModal from './AddSourceModal';
import { useBrainStore } from '../store/brainStore';
import type { Source } from '../types/source';

jest.mock('../lib/id', () => ({ newId: () => 'test-id' }));

const paper = (id: string, tags: string[] = []): Source => ({
  id, title: `Paper ${id}`, authors: ['Researcher'], tags,
  isGlobal: false, createdAt: '2026-10-07', notes: [],
});

beforeEach(() => {
  useBrainStore.setState({ sources: [], structureLinks: [], projects: [], activeProjectId: null, brainRegions: [] });
});

test('library imports an unlinked paper without opening explorer', () => {
  render(<LibraryPage />);
  fireEvent.click(screen.getByText('Find your first paper'));
  fireEvent.click(screen.getByText('Manual Entry'));
  fireEvent.change(screen.getByPlaceholderText('Title *'), { target: { value: 'Independent research' } });
  fireEvent.click(screen.getByText('Save Source'));
  expect(screen.getByText('Independent research')).toBeInTheDocument();
  expect(useBrainStore.getState().structureLinks).toHaveLength(0);
});

test('bulk topics preserve existing tags and region filtering finds unlinked papers', () => {
  useBrainStore.setState({ sources: [paper('a', ['Memory']), paper('b')], structureLinks: [{
    id: 'link', sourceId: 'a', regionMeshName: 'hippocampus', regionName: 'Hippocampus', verified: false, createdAt: '2026-10-07',
  }] });
  render(<LibraryPage />);
  fireEvent.click(screen.getByLabelText('Select all shown'));
  fireEvent.change(screen.getByLabelText('Topic name'), { target: { value: 'Working memory' } });
  fireEvent.click(screen.getByText('Add topic'));
  expect(useBrainStore.getState().sources.map((s) => s.tags)).toEqual([['Memory', 'Working memory'], ['Working memory']]);
  fireEvent.change(screen.getByLabelText('Filter by brain region'), { target: { value: 'unlinked' } });
  expect(screen.queryByText('Paper a')).not.toBeInTheDocument();
  expect(screen.getByText('Paper b')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Select Paper b'));
  fireEvent.change(screen.getByLabelText('Filter by topic'), { target: { value: 'Memory' } });
  expect(screen.queryByLabelText('Topic name')).not.toBeInTheDocument();
});

test('DOI imports reject papers already saved under a normalized DOI', () => {
  useBrainStore.setState({ sources: [{ ...paper('a'), doi: '10.1234/example' }] });
  render(<AddSourceModal onClose={() => {}} initialMode="manual" />);
  fireEvent.change(screen.getByPlaceholderText('Title *'), { target: { value: 'Duplicate paper' } });
  fireEvent.change(screen.getByPlaceholderText('DOI (optional)'), { target: { value: 'https://doi.org/10.1234/EXAMPLE' } });
  fireEvent.click(screen.getByText('Save Source'));
  expect(screen.getByText(/already in your library/)).toBeInTheDocument();
  expect(useBrainStore.getState().sources).toHaveLength(1);
});

test('selected project settings expose Personal and Community and retain papers', async () => {
  useBrainStore.setState({ projects: [{ id: 'p', name: 'My project', mode: 'private', color: '#a5e2cf', createdAt: '' }], activeProjectId: 'p', sources: [{ ...paper('a'), projectId: 'p' }] });
  render(<LibraryPage />);
  fireEvent.click(screen.getByText('Project settings'));
  fireEvent.click(screen.getByRole('button', { name: 'Community' }));
  fireEvent.click(screen.getByText('Save Changes'));
  expect(useBrainStore.getState().projects[0].mode).toBe('community');
  expect(useBrainStore.getState().explorerMode).toBe('community');
  expect(useBrainStore.getState().sources[0].projectId).toBe('p');
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.click(screen.getByRole('button', { name: 'Personal' }));
  fireEvent.click(screen.getByText('Save Changes'));
  expect(useBrainStore.getState().projects[0].mode).toBe('private');
  expect(useBrainStore.getState().explorerMode).toBe('personal');
});
