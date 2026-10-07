import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForumFeed from './ForumFeed';
import { useBrainStore } from '../store/brainStore';
import { fetchForumPosts, fetchForumComments, deleteOwnEngagement, isSupabaseConfigured } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  fetchForumPosts: jest.fn(), fetchForumComments: jest.fn(), deleteOwnEngagement: jest.fn(),
  isSupabaseConfigured: jest.fn(), createForumPost: jest.fn(), createForumComment: jest.fn(), upvoteForumPost: jest.fn(),
}));

const post = { id: 'post', user_id: 'author', user_email: 'author@test.com', title: 'My thread', upvotes: 0, created_at: new Date().toISOString() };
const comment = { id: 'comment', post_id: 'post', user_id: 'author', user_email: 'author@test.com', body: 'My reply', upvotes: 0, created_at: post.created_at };

beforeEach(() => {
  useBrainStore.setState({ user: { id: 'author', email: 'author@test.com' } as any });
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  (fetchForumPosts as jest.Mock).mockResolvedValue([post]);
  (fetchForumComments as jest.Mock).mockResolvedValue([comment]);
  (deleteOwnEngagement as jest.Mock).mockResolvedValue(undefined);
});

test('authors delete replies and threads only after confirming', async () => {
  render(<ForumFeed />);
  fireEvent.click(await screen.findByText('Comments & Discussion'));
  fireEvent.click(await screen.findByLabelText('Delete comment: My reply'));
  expect(deleteOwnEngagement).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Delete permanently'));
  await waitFor(() => expect(screen.queryByText('My reply')).not.toBeInTheDocument());
  expect(deleteOwnEngagement).toHaveBeenCalledWith('forum_comments', 'comment');
  fireEvent.click(screen.getByLabelText('Delete post: My thread'));
  fireEvent.click(screen.getByText('Delete permanently'));
  await waitFor(() => expect(screen.queryByText('My thread')).not.toBeInTheDocument());
  expect(deleteOwnEngagement).toHaveBeenCalledWith('forum_posts', 'post');
});

test('failed deletes preserve saved content and cancel never deletes', async () => {
  (deleteOwnEngagement as jest.Mock).mockRejectedValue(new Error('RLS denied'));
  render(<ForumFeed />);
  fireEvent.click(await screen.findByLabelText('Delete post: My thread'));
  fireEvent.click(screen.getByText('Cancel'));
  expect(deleteOwnEngagement).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('Delete post: My thread'));
  fireEvent.click(screen.getByText('Delete permanently'));
  expect(await screen.findByRole('alert')).toHaveTextContent('It is still saved');
  expect(screen.getByText('My thread')).toBeInTheDocument();
});

test('other users and signed-out visitors get no delete controls', async () => {
  useBrainStore.setState({ user: null });
  render(<ForumFeed />);
  fireEvent.click(await screen.findByText('Comments & Discussion'));
  await screen.findByText('My reply');
  expect(screen.queryByLabelText(/Delete post/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Delete comment/)).not.toBeInTheDocument();
});

test('local thread deletion removes the session copy and its discussion', async () => {
  (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
  const view = render(<ForumFeed />);
  await screen.findByText('No posts yet. Start the conversation!');
  fireEvent.click(screen.getByText('+ New Post'));
  fireEvent.change(screen.getByPlaceholderText('Title *'), { target: { value: 'Local thread' } });
  fireEvent.click(screen.getByText('Post to Community'));
  fireEvent.click(await screen.findByText('Comments & Discussion'));
  fireEvent.change(screen.getByPlaceholderText('Add a comment… (Enter to submit)'), { target: { value: 'Local reply' } });
  fireEvent.click(screen.getByText('Reply'));
  await screen.findByText('Local reply');
  fireEvent.click(screen.getByLabelText('Delete post: Local thread'));
  fireEvent.click(screen.getByText('Delete permanently'));
  await screen.findByText('No posts yet. Start the conversation!');
  view.unmount();
  render(<ForumFeed />);
  await screen.findByText('No posts yet. Start the conversation!');
  expect(screen.queryByText('Local reply')).not.toBeInTheDocument();
});
