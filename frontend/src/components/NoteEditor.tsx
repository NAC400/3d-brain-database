import React, { useState, useRef } from 'react';
import type { Note } from '../types/source';

// ---------------------------------------------------------------------------
// Minimal markdown renderer (no external dependency)
// Handles: **bold**, *italic*, `code`, # headings, - lists, blank lines → paragraphs
// ---------------------------------------------------------------------------
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, (m) => m.startsWith('<') ? m : m)
    .replace(/^(?!<)(.)/gm, '$1');
}

interface NoteEditorProps {
  note:       Note;
  onSave:     (content: string) => void;
  onDelete:   () => void;
  autoFocus?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onDelete, autoFocus }) => {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(note.content);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const save = () => {
    if (draft.trim() !== note.content.trim()) onSave(draft.trim());
    setEditing(false);
  };

  const discard = () => {
    setDraft(note.content);
    setEditing(false);
  };

  const label: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
    color: '#475569', textTransform: 'uppercase',
  };

  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: 8, padding: '12px 14px', marginBottom: 10,
    }}>
      {editing ? (
        <>
          <textarea
            ref={textareaRef}
            autoFocus={autoFocus}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Write a note… supports **bold**, *italic*, `code`, # headings, - lists"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 10px', borderRadius: 6,
              background: 'rgba(7,11,22,0.9)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#e2e8f0', fontSize: 12, lineHeight: 1.6,
              resize: 'vertical', outline: 'none', fontFamily: 'monospace',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={save} style={{
              padding: '4px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600,
              background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
              color: '#60a5fa', cursor: 'pointer',
            }}>Save</button>
            <button onClick={discard} style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11,
              background: 'transparent', border: '1px solid rgba(100,116,139,0.2)',
              color: '#475569', cursor: 'pointer',
            }}>Discard</button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, cursor: 'text', minHeight: 24 }}
            onClick={() => setEditing(true)}
            dangerouslySetInnerHTML={{ __html: note.content ? renderMarkdown(note.content) : '<span style="color:#334155">Click to edit…</span>' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(true)} style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 10,
                background: 'transparent', border: '1px solid rgba(100,116,139,0.2)',
                color: '#475569', cursor: 'pointer',
              }}>Edit</button>
              {note.versions.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 10,
                  background: 'transparent', border: '1px solid rgba(100,116,139,0.2)',
                  color: '#475569', cursor: 'pointer',
                }}>History ({note.versions.length})</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={label}>{new Date(note.updatedAt).toLocaleDateString()}</span>
              <button onClick={onDelete} style={{
                background: 'none', border: 'none', color: '#475569',
                cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
              }}>×</button>
            </div>
          </div>
        </>
      )}

      {/* Version history */}
      {showHistory && !editing && note.versions.length > 0 && (
        <div style={{
          marginTop: 10, borderTop: '1px solid rgba(30,41,59,0.8)', paddingTop: 10,
        }}>
          <div style={{ ...label, marginBottom: 6 }}>Previous versions</div>
          {[...note.versions].reverse().map((v, i) => (
            <div key={i} style={{
              padding: '6px 10px', borderRadius: 5, marginBottom: 4,
              background: 'rgba(7,11,22,0.6)', border: '1px solid rgba(30,41,59,0.6)',
            }}>
              <div style={{ fontSize: 9, color: '#334155', marginBottom: 3 }}>
                {new Date(v.savedAt).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
                {v.content.slice(0, 120)}{v.content.length > 120 ? '…' : ''}
              </div>
              <button
                onClick={() => { setDraft(v.content); setEditing(true); }}
                style={{
                  marginTop: 4, padding: '2px 8px', borderRadius: 4, fontSize: 9,
                  background: 'transparent', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#3b82f6', cursor: 'pointer',
                }}
              >Restore</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// NoteList — renders a list of NoteEditors with an "Add note" button
// ---------------------------------------------------------------------------

interface NoteListProps {
  notes:    Note[];
  onAdd:    () => void;
  onSave:   (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
  compact?: boolean;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, onAdd, onSave, onDelete, compact }) => (
  <div>
    {notes.map((note) => (
      <NoteEditor
        key={note.id}
        note={note}
        onSave={(c) => onSave(note.id, c)}
        onDelete={() => onDelete(note.id)}
      />
    ))}
    <button
      onClick={onAdd}
      style={{
        width: '100%', padding: compact ? '5px 0' : '8px 0', borderRadius: 6,
        background: 'transparent',
        border: '1px dashed rgba(59,130,246,0.25)',
        color: '#3b82f6', fontSize: compact ? 11 : 12, cursor: 'pointer',
        letterSpacing: 0.3,
      }}
    >
      + Add note
    </button>
  </div>
);

export default NoteEditor;
