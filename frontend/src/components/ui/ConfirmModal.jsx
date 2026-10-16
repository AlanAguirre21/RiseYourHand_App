import { useEffect, useId, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';

const TONES = {
  danger:  'bg-danger/10 text-danger',
  warning: 'bg-warning/15 text-warning',
};

export default function ConfirmModal({
  open, title, children,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', busyLabel = 'Guardando…', variant = 'danger',
  busy = false, error = null, onConfirm, onCancel,
}) {
  const ref = useRef(null);
  const titleId = useId();   // unique: a page can have more than one of these windows

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function cancel() {
    if (!busy) onCancel();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={e => { e.preventDefault(); cancel(); }}           
      onClick={e => { if (e.target === ref.current) cancel(); }}   
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${TONES[variant]}`}>
            <TriangleAlert size={20} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-text">{title}</h2>
            <div className="mt-1 text-sm text-text-muted">{children}</div>
          </div>
        </div>

        {error && <div className="mt-4"><StatusMessage error={error} /></div>}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={cancel} disabled={busy}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
