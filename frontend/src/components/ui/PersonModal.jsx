import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import UserAvatar from '../profile/UserAvatar.jsx';
import { ROLE_LABELS } from '../../constants/roles.js';

export default function PersonModal({ user, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (user && !dialog.open) dialog.showModal();
    if (!user && dialog.open) dialog.close();
  }, [user]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="person-modal-name"
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-xs rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      {user && (
        <div className="relative flex flex-col items-center p-6 text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded-control p-1.5 text-text-muted hover:bg-white/60 hover:text-text"
          >
            <X size={18} />
          </button>

          <UserAvatar user={user} size={208} className="neu-raised" />
          <h2 id="person-modal-name" className="mt-4 text-lg font-semibold text-text">{user.name}</h2>
          {user.role && <p className="text-sm text-text-muted">{ROLE_LABELS[user.role]}</p>}
        </div>
      )}
    </dialog>
  );
}
