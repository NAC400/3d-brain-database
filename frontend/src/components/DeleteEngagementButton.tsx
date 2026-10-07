import React, { useState } from 'react';
import { useBrainStore } from '../store/brainStore';

/** One author-only, confirmed delete flow for posts, replies, and contributions. */
const DeleteEngagementButton: React.FC<{
  ownerId: string;
  label: string;
  confirmation: string;
  onDelete: () => Promise<void>;
}> = ({ ownerId, label, confirmation, onDelete }) => {
  const user = useBrainStore((s) => s.user);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!user || user.id !== ownerId) return null;

  const remove = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await onDelete(); setConfirming(false); }
    catch { setError('Could not delete this item. It is still saved. Try again.'); }
    finally { setBusy(false); }
  };
  return <span style={{ fontSize: 12 }}>
    {!confirming ? <button aria-label={label} onClick={() => setConfirming(true)} style={{ color: '#ef8888', background: 'transparent', border: 0, cursor: 'pointer' }}>Delete</button>
      : <span><span>{confirmation} </span><button disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete permanently'}</button> <button disabled={busy} onClick={() => { setConfirming(false); setError(''); }}>Cancel</button></span>}
    {error && <span role="alert" style={{ display: 'block', color: '#ef8888' }}>{error}</span>}
  </span>;
};

export default DeleteEngagementButton;
