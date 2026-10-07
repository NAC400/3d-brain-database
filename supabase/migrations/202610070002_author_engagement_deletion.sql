-- Authors may withdraw their own engagement at any moderation status.
-- Existing post/comment foreign keys cascade replies, votes, and reports.
drop policy if exists "Authors delete own posts" on public.forum_posts;
create policy "Authors delete own posts" on public.forum_posts for delete using (auth.uid() = user_id);
drop policy if exists "Authors delete own comments" on public.forum_comments;
create policy "Authors delete own comments" on public.forum_comments for delete using (auth.uid() = user_id);
drop policy if exists "Users remove own pending contributions" on public.global_contributions;
drop policy if exists "Authors delete own contributions" on public.global_contributions;
create policy "Authors delete own contributions" on public.global_contributions for delete using (auth.uid() = user_id);
grant delete on public.forum_posts, public.forum_comments, public.global_contributions to authenticated;
