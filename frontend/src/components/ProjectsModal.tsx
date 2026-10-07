import React, { useState, useEffect } from 'react';
import { useBrainStore } from '../store/brainStore';
import { newId } from '../lib/id';
import type { Project } from '../types/source';
import { fetchCommunityProjects, publishCommunityProject, unpublishCommunityProject, isSupabaseConfigured } from '../lib/supabase';

const genId = newId;

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#84cc16',
];

interface Props { onClose: () => void; initialProjectId?: string; }

const ProjectsModal: React.FC<Props> = ({ onClose, initialProjectId }) => {
  const { projects, addProject, removeProject, updateProject, sources, structureLinks, user } = useBrainStore();

  const [editingId, setEditingId]       = useState<string | null>(null);
  const [name, setName]                 = useState('');
  const [description, setDescription]   = useState('');
  const [mode, setMode]                 = useState<'private' | 'community'>('private');
  const [color, setColor]               = useState(PRESET_COLORS[0]);
  const [formOpen, setFormOpen]         = useState(false);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sharingMessage, setSharingMessage] = useState('');
  const [publishPreview, setPublishPreview] = useState<Project | null>(null);

  useEffect(() => {
    const project = useBrainStore.getState().projects.find((p) => p.id === initialProjectId);
    if (project) {
      setEditingId(project.id); setName(project.name); setDescription(project.description ?? '');
      setMode(project.mode); setColor(project.color); setFormOpen(true);
    }
  }, [initialProjectId]);

  useEffect(() => {
    let cancelled = false;
    if (!user || !isSupabaseConfigured()) return;
    fetchCommunityProjects(user.id).then((data) => { if (!cancelled) setPublishedIds(data.map((p) => p.id)); })
      .catch(() => { if (!cancelled) setSharingMessage('Could not load public projects. Try again when the community service is available.'); });
    return () => { cancelled = true; };
  }, [user]);

  const shareProject = async (project: Project, remove = false) => {
    if (!user) return;
    setBusyId(project.id); setSharingMessage('');
    try {
      if (remove) {
        await unpublishCommunityProject(project.id);
        setPublishedIds((ids) => ids.filter((id) => id !== project.id));
      } else {
        await publishCommunityProject(project, user.id, sources, structureLinks);
        setPublishedIds((ids) => Array.from(new Set([...ids, project.id])));
      }
      setPublishPreview(null);
      setSharingMessage(remove ? 'Public copy removed.' : 'Project published. Future changes stay local until you update the public copy.');
    } catch {
      setSharingMessage('Could not update the public project. Check your connection and community service, then try again.');
    } finally { setBusyId(null); }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setMode('private'); setColor(PRESET_COLORS[0]);
    setEditingId(null); setFormOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId && mode === 'private' && publishedIds.includes(editingId)) {
      setBusyId(editingId);
      try { await unpublishCommunityProject(editingId); setPublishedIds((ids) => ids.filter((id) => id !== editingId)); }
      catch { setSharingMessage('Could not remove the public copy. Try again before switching this published project to Personal.'); return; }
      finally { setBusyId(null); }
    }
    if (editingId) {
      updateProject(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
        mode, color,
      });
    } else {
      addProject({
        id: genId(),
        name: name.trim(),
        description: description.trim() || undefined,
        mode, color,
        createdAt: new Date().toISOString(),
      });
    }
    resetForm();
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description ?? '');
    setMode(p.mode);
    setColor(p.color);
    setFormOpen(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px',
    background: 'var(--product-surface)', border: '1px solid rgba(165,226,207,0.25)',
    borderRadius: 6, color: 'var(--product-text)', fontSize: 12, outline: 'none', marginBottom: 8,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(7,11,22,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div role="dialog" aria-modal="true" aria-label="Project settings" style={{
        width: 480, maxWidth: 'calc(100vw - 32px)', maxHeight: '80vh', overflowY: 'auto',
        background: 'var(--product-surface)',
        border: '1px solid rgba(165,226,207,0.3)',
        borderRadius: 14, padding: '28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--product-text)' }}>Projects</div>
            <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 2 }}>
              Organise your sources into private or community research projects
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--product-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Project list */}
        <p style={{ fontSize: 12, color: 'var(--product-muted)' }}>Publishing shares project details, paper metadata, topics, and brain links. Your notes stay private.</p>
        <div role="status" style={{ fontSize: 12, color: 'var(--product-accent)', marginBottom: 8 }}>{sharingMessage}</div>
        {publishPreview && <section style={{ border: '1px solid var(--product-line)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
          <strong>Publish {publishPreview.name}?</strong>
          <p style={{ fontSize: 12 }}>{sources.filter((s) => s.projectId === publishPreview.id).length} papers and their topics and region links will be visible to everyone.</p>
          <button disabled={busyId !== null} onClick={() => shareProject(publishPreview)}>Publish public copy</button>
          <button disabled={busyId !== null} onClick={() => setPublishPreview(null)}>Cancel</button>
        </section>}
        {projects.length === 0 && !formOpen && (
          <div style={{ textAlign: 'center', color: 'var(--product-muted)', fontSize: 12, padding: '24px 0' }}>
            No projects yet. Create one to organise your sources.
          </div>
        )}
        {projects.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8, marginBottom: 8,
            background: 'var(--product-line)',
            border: `1px solid ${p.color}30`,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--product-text)' }}>{p.name}</div>
              {p.description && (
                <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.description}
                </div>
              )}
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, flexShrink: 0,
              background: p.mode === 'community' ? 'rgba(34,211,238,0.1)' : 'rgba(99,102,241,0.1)',
              border: `1px solid ${p.mode === 'community' ? 'rgba(34,211,238,0.3)' : 'rgba(99,102,241,0.3)'}`,
              color: p.mode === 'community' ? '#22d3ee' : '#a5b4fc',
              letterSpacing: 0.3,
            }}>
              {p.mode === 'community' ? 'Community' : 'Personal'}
            </span>
            <button
              disabled={busyId !== null}
              onClick={() => startEdit(p)}
              style={{ background: 'none', border: 'none', color: 'var(--product-accent)', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}
            >
              Edit
            </button>
            <button
              disabled={busyId !== null || publishedIds.includes(p.id)}
              title={publishedIds.includes(p.id) ? 'Unpublish the public copy before deleting this project.' : 'Delete local project'}
              onClick={() => { if (window.confirm(`Delete project "${p.name}"?`)) removeProject(p.id); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}
            >
              Del
            </button>
            {(p.mode === 'community' || publishedIds.includes(p.id)) && <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button disabled={!user || !isSupabaseConfigured() || busyId !== null} onClick={() => setPublishPreview(p)}>{publishedIds.includes(p.id) ? 'Update public copy' : 'Publish project'}</button>
              {publishedIds.includes(p.id) && <button disabled={busyId !== null} onClick={() => shareProject(p, true)}>Unpublish</button>}
              {(!user || !isSupabaseConfigured()) && <span style={{ fontSize: 11, color: 'var(--product-muted)' }}>{!isSupabaseConfigured() ? 'Community service unavailable' : 'Sign in to publish'}</span>}
            </div>}
          </div>
        ))}

        {/* Create / Edit form */}
        {formOpen ? (
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(30,41,59,0.8)', paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--product-muted)', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>
              {editingId ? 'Edit Project' : 'New Project'}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name *" maxLength={120}
              style={inputStyle}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)" maxLength={4000}
              style={inputStyle}
            />

            {/* Mode toggle */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--product-muted)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>MODE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['private', 'community'] as const).map((m) => (
                  <button
                    key={m}
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${mode === m ? 'rgba(165,226,207,0.6)' : 'rgba(100,116,139,0.2)'}`,
                      background: mode === m ? 'rgba(165,226,207,0.15)' : 'transparent',
                      color: mode === m ? 'var(--product-accent)' : 'var(--product-muted)',
                    }}
                  >
                    {m === 'private' ? 'Personal' : 'Community'}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 6 }}>
                {mode === 'private'
                  ? 'Show this project in Personal research. Switching a published project to Personal removes its public copy.'
                  : 'Show this project in your Community research workspace. Publish a public copy separately when ready.'}
              </div>
            </div>

            {/* Color presets */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--product-muted)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>COLOR</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 22, height: 22, borderRadius: 4, background: c, padding: 0, cursor: 'pointer',
                      border: color === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: color === c ? `0 0 6px ${c}` : 'none',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  title="Custom color"
                  style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetForm}
                style={{ flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 12, background: 'transparent', border: '1px solid rgba(100,116,139,0.3)', color: 'var(--product-muted)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || busyId !== null}
                style={{
                  flex: 2, padding: '9px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(165,226,207,0.2)', border: '1px solid rgba(165,226,207,0.5)',
                  color: 'var(--product-accent)', opacity: name.trim() ? 1 : 0.5,
                }}
              >
                {editingId ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFormOpen(true)}
            style={{
              width: '100%', marginTop: projects.length > 0 ? 8 : 0,
              padding: '10px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
              background: 'rgba(165,226,207,0.1)', border: '1px solid rgba(165,226,207,0.3)',
              color: 'var(--product-accent)', cursor: 'pointer',
            }}
          >
            + New Project
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsModal;
