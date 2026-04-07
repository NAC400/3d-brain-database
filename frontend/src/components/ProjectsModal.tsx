import React, { useState } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { Project } from '../types/source';

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#84cc16',
];

interface Props { onClose: () => void; }

const ProjectsModal: React.FC<Props> = ({ onClose }) => {
  const { projects, addProject, removeProject, updateProject } = useBrainStore();

  const [editingId, setEditingId]       = useState<string | null>(null);
  const [name, setName]                 = useState('');
  const [description, setDescription]   = useState('');
  const [mode, setMode]                 = useState<'private' | 'community'>('private');
  const [color, setColor]               = useState(PRESET_COLORS[0]);
  const [formOpen, setFormOpen]         = useState(false);

  const resetForm = () => {
    setName(''); setDescription(''); setMode('private'); setColor(PRESET_COLORS[0]);
    setEditingId(null); setFormOpen(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
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
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 6, color: '#e2e8f0', fontSize: 12, outline: 'none', marginBottom: 8,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(7,11,22,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 480, maxHeight: '80vh', overflowY: 'auto',
        background: 'rgba(15,23,42,0.98)',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 14, padding: '28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Projects</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              Organise your sources into private or community research projects
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Project list */}
        {projects.length === 0 && !formOpen && (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: 12, padding: '24px 0' }}>
            No projects yet. Create one to organise your sources.
          </div>
        )}
        {projects.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8, marginBottom: 8,
            background: 'rgba(30,41,59,0.5)',
            border: `1px solid ${p.color}30`,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{p.name}</div>
              {p.description && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.description}
                </div>
              )}
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, flexShrink: 0,
              background: p.mode === 'community' ? 'rgba(34,211,238,0.1)' : 'rgba(99,102,241,0.1)',
              border: `1px solid ${p.mode === 'community' ? 'rgba(34,211,238,0.3)' : 'rgba(99,102,241,0.3)'}`,
              color: p.mode === 'community' ? '#22d3ee' : '#a5b4fc',
              letterSpacing: 0.3,
            }}>
              {p.mode === 'community' ? 'Community' : 'Private'}
            </span>
            <button
              onClick={() => startEdit(p)}
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
            >
              Edit
            </button>
            <button
              onClick={() => { if (window.confirm(`Delete project "${p.name}"?`)) removeProject(p.id); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
            >
              Del
            </button>
          </div>
        ))}

        {/* Create / Edit form */}
        {formOpen ? (
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(30,41,59,0.8)', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>
              {editingId ? 'Edit Project' : 'New Project'}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name *"
              style={inputStyle}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              style={inputStyle}
            />

            {/* Mode toggle */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>MODE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['private', 'community'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${mode === m ? 'rgba(59,130,246,0.6)' : 'rgba(100,116,139,0.2)'}`,
                      background: mode === m ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: mode === m ? '#60a5fa' : '#475569',
                    }}
                  >
                    {m === 'private' ? '🔒 Private Atlas' : '🌐 Community Atlas'}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#334155', marginTop: 6 }}>
                {mode === 'private'
                  ? 'Sources stay local — not shared to the Community Atlas.'
                  : 'Sources can be submitted to the global Community Atlas for peer review.'}
              </div>
            </div>

            {/* Color presets */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>COLOR</div>
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
                style={{ flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 12, background: 'transparent', border: '1px solid rgba(100,116,139,0.3)', color: '#64748b', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                style={{
                  flex: 2, padding: '9px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)',
                  color: '#60a5fa', opacity: name.trim() ? 1 : 0.5,
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
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa', cursor: 'pointer',
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
