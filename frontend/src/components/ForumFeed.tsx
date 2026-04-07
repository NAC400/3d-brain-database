import React, { useState, useEffect, useCallback } from 'react';
import { useBrainStore } from '../store/brainStore';
import {
  fetchForumPosts, createForumPost, upvoteForumPost,
  fetchForumComments, createForumComment,
  isSupabaseConfigured,
  type ForumPost, type ForumComment,
} from '../lib/supabase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function initials(email: string): string {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

const FLAIR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];
function flairColor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % FLAIR_COLORS.length;
  return FLAIR_COLORS[h];
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
const Avatar: React.FC<{ email: string; size?: number }> = ({ email, size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: flairColor(email),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 700, color: '#fff',
  }}>
    {initials(email)}
  </div>
);

// ---------------------------------------------------------------------------
// New Post Modal
// ---------------------------------------------------------------------------
const NewPostModal: React.FC<{ onClose: () => void; onPosted: () => void }> = ({ onClose, onPosted }) => {
  const { user, brainRegions } = useBrainStore();
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [tags, setTags]         = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [linkedMesh, setLinkedMesh]     = useState('');
  const [linkedName, setLinkedName]     = useState('');
  const [dropOpen, setDropOpen]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  const regionMatches = regionSearch.trim()
    ? brainRegions.filter((r) =>
        r.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
        r.acronym.toLowerCase().includes(regionSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!user)         { setError('You must be signed in to post.'); return; }
    setSubmitting(true); setError('');
    const { error: err } = await createForumPost({
      user_id:     user.id,
      user_email:  user.email,
      title:       title.trim(),
      body:        body.trim() || undefined,
      region_name: linkedName || undefined,
      mesh_name:   linkedMesh || undefined,
      tags:        tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setSubmitting(false);
    if (err) { setError((err as any).message); return; }
    onPosted();
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px',
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 6, color: '#e2e8f0', fontSize: 12, outline: 'none', marginBottom: 10,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(7,11,22,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 520, maxHeight: '85vh', overflowY: 'auto', background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 14, padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>New Post</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" style={inputStyle} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your insights, questions, or findings… (Markdown supported)"
          rows={6}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />

        {/* Region link */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            value={regionSearch}
            onChange={(e) => { setRegionSearch(e.target.value); setLinkedMesh(''); setLinkedName(''); setDropOpen(true); }}
            onFocus={() => setDropOpen(true)}
            placeholder="Link to brain region (optional)"
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          {linkedMesh && (
            <span style={{ position: 'absolute', right: 10, top: 9, fontSize: 10, color: '#22d3ee' }}>✓ {linkedName}</span>
          )}
          {dropOpen && regionMatches.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, zIndex: 10, maxHeight: 150, overflowY: 'auto' }}>
              {regionMatches.map((r) => (
                <div
                  key={r.meshName}
                  onClick={() => { setLinkedMesh(r.meshName); setLinkedName(r.name); setRegionSearch(r.name); setDropOpen(false); }}
                  style={{ padding: '7px 12px', fontSize: 11, color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid rgba(30,41,59,0.5)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {r.name} <span style={{ color: '#475569', fontSize: 9 }}>{r.acronym}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma-separated, e.g. fMRI, thalamus, review)" style={inputStyle} />

        {error && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 10 }}>{error}</div>}

        {!user && (
          <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 10, padding: '6px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
            Sign in to post to the community forum.
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !user}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(30,64,175,0.8))',
            border: '1px solid rgba(59,130,246,0.5)', color: '#e0eaff',
            opacity: submitting || !user ? 0.6 : 1,
          }}
        >
          {submitting ? 'Posting…' : 'Post to Community'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Comment thread
// ---------------------------------------------------------------------------
const CommentThread: React.FC<{ postId: string; postUserId: string }> = ({ postId }) => {
  const { user } = useBrainStore();
  const [comments, setComments]   = useState<ForumComment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [body, setBody]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setComments(await fetchForumComments(postId));
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const handleComment = async () => {
    if (!body.trim() || !user) return;
    setSubmitting(true);
    await createForumComment({ post_id: postId, user_id: user.id, user_email: user.email, body: body.trim() });
    setBody('');
    setSubmitting(false);
    load();
  };

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(30,41,59,0.6)' }}>
      {loading ? (
        <div style={{ fontSize: 11, color: '#334155', padding: '8px 0' }}>Loading comments…</div>
      ) : (
        <>
          {comments.length === 0 && (
            <div style={{ fontSize: 11, color: '#334155', marginBottom: 10 }}>No comments yet — be the first.</div>
          )}
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Avatar email={c.user_email} size={22} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{c.user_email.split('@')[0]}</span>
                  <span style={{ fontSize: 9, color: '#334155' }}>{timeAgo(c.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>{c.body}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {user && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Avatar email={user.email} size={22} />
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
              placeholder="Add a comment… (Enter to submit)"
              style={{
                flex: 1, padding: '6px 10px', background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6,
                color: '#e2e8f0', fontSize: 11, outline: 'none',
              }}
            />
            <button
              onClick={handleComment}
              disabled={submitting || !body.trim()}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                color: '#60a5fa', opacity: !body.trim() ? 0.5 : 1,
              }}
            >
              {submitting ? '…' : 'Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Post card
// ---------------------------------------------------------------------------
const PostCard: React.FC<{ post: ForumPost; onUpvote: (id: string, current: number) => void }> = ({ post, onUpvote }) => {
  const { setSelectedRegion, setAppPage } = useBrainStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(59,130,246,0.12)',
      borderRadius: 10, padding: '14px 16px', marginBottom: 10,
    }}>
      {/* Vote + content layout */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Upvote column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onUpvote(post.id, post.upvotes)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 14, lineHeight: 1, padding: '2px' }}
            title="Upvote"
          >
            ▲
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: post.upvotes > 0 ? '#f59e0b' : '#475569' }}>
            {post.upvotes}
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Avatar email={post.user_email} size={20} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{post.user_email.split('@')[0]}</span>
            <span style={{ fontSize: 9, color: '#334155' }}>· {timeAgo(post.created_at)}</span>
          </div>

          {/* Title */}
          <div
            onClick={() => setExpanded((e) => !e)}
            style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', cursor: 'pointer', lineHeight: 1.4, marginBottom: 5 }}
          >
            {post.title}
          </div>

          {/* Tags + region */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: expanded ? 8 : 0 }}>
            {post.region_name && (
              <button
                onClick={() => { if (post.mesh_name) { setSelectedRegion(post.mesh_name); setAppPage('explorer'); } }}
                style={{
                  padding: '1px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee',
                }}
              >
                {post.region_name}
              </button>
            )}
            {(post.tags ?? []).map((t) => (
              <span key={t} style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{t}</span>
            ))}
          </div>

          {/* Body (expanded) */}
          {expanded && post.body && (
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
              {post.body}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, padding: 0 }}
            >
              {expanded ? 'Hide' : 'Comments & Discussion'}
            </button>
          </div>

          {expanded && <CommentThread postId={post.id} postUserId={post.user_id} />}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ForumFeed (main export)
// ---------------------------------------------------------------------------
const ForumFeed: React.FC = () => {
  const { user, setAppPage } = useBrainStore();
  const [posts, setPosts]       = useState<ForumPost[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showNew, setShowNew]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPosts(await fetchForumPosts(100));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpvote = async (id: string, current: number) => {
    await upvoteForumPost(id, current);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, upvotes: current + 1 } : p));
  };

  const filtered = posts.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.body ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.region_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Community Forum</h2>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
            Discuss findings, ask questions, share insights — linked to brain regions.
          </p>
        </div>
        <button
          onClick={() => user ? setShowNew(true) : setAppPage('auth')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(30,64,175,0.8))',
            border: '1px solid rgba(59,130,246,0.5)', color: '#e0eaff',
          }}
        >
          + New Post
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search posts by title, region, or tag…"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '8px 14px', marginBottom: 16,
          background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none',
        }}
      />

      {!isSupabaseConfigured() && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 12 }}>
          Supabase not configured — forum posts won't persist. Add <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_ANON_KEY</code> to enable the community forum.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#334155', padding: 40 }}>Loading posts…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, color: '#334155', fontSize: 13 }}>
          {posts.length === 0
            ? 'No posts yet. Start the conversation!'
            : `No posts match "${search}"`
          }
        </div>
      ) : (
        filtered.map((post) => (
          <PostCard key={post.id} post={post} onUpvote={handleUpvote} />
        ))
      )}

      {showNew && <NewPostModal onClose={() => setShowNew(false)} onPosted={load} />}
    </div>
  );
};

export default ForumFeed;
