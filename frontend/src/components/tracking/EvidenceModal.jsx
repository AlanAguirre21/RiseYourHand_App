import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import { Label } from '../Input.jsx';
import { FIELD } from '../../constants/styles.js';

export const EVIDENCE_COMMENT_MAX = 1000;
const IMAGE_MAX_SIDE = 1280;                 // px; the server takes up to ~500 KB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// The picture, at most 1280 px on its longest side, as a JPEG data URL
async function toEvidenceImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Asked every time the progress of a manita changes: a comment (required) and a picture (optional).
// onConfirm gets { comment, image }; the window stays open until the parent closes it.
// "optional" (admins): it can be left empty, and then onConfirm gets null (no evidence)
export default function EvidenceModal({ open, from, to, optional = false, busy = false, error = null, onConfirm, onCancel }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const titleId = useId();
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      setComment('');
      setImage(null);
      setImageError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function cancel() {
    if (!busy) onCancel();
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = '';   // the same file can be picked again
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith('image/') || file.size > MAX_FILE_SIZE) {
      setImageError('Elige una imagen (JPG, PNG o WebP) de hasta 25 MB.');
      return;
    }
    setReading(true);
    try {
      setImage(await toEvidenceImage(file));
    } catch {
      setImageError('No se pudo leer la imagen. Prueba con otra.');
    } finally {
      setReading(false);
    }
  }

  const text = comment.trim();
  const skipping = optional && text === '' && !image;   // an admin saving without evidence
  // A picture always goes with a comment
  const canSave = (text !== '' || skipping) && !busy && !reading;

  function handleSubmit(e) {
    e.preventDefault();
    if (canSave) onConfirm(skipping ? null : { comment: text, image });
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={e => { e.preventDefault(); cancel(); }}
      onClick={e => { if (e.target === ref.current) cancel(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 id={titleId} className="text-lg font-semibold text-text">Evidencia</h2>
        <p className="mt-1 text-sm text-text-muted">
          Avance de <strong className="text-text">{from}%</strong> a <strong className="text-text">{to}%</strong>.
          {optional
            ? ' Como administrador puedes guardar sin evidencia.'
            : ' Explica qué se hizo; puedes agregar una foto.'}
        </p>

        <div className="mt-4">
          <Label htmlFor={`${titleId}-comment`}>
            {optional ? 'Comentario (obligatorio si agregas una foto)' : 'Comentario (obligatorio)'}
          </Label>
          <textarea
            id={`${titleId}-comment`}
            rows={4}
            maxLength={EVIDENCE_COMMENT_MAX}
            value={comment}
            onChange={e => setComment(e.target.value)}
            disabled={busy}
            required={!optional || image !== null}
            placeholder="p. ej. Se cambió la rampa dañada de la línea B1."
            className={`${FIELD} w-full resize-y`}
          />
          <p className="mt-1 text-right text-xs text-text-faint">{comment.length}/{EVIDENCE_COMMENT_MAX}</p>
        </div>

        <div className="mt-2">
          <span className="mb-1 block text-xs font-medium text-text-muted">Foto (opcional)</span>
          {image ? (
            <div className="relative inline-block">
              <img src={image} alt="Foto de la evidencia" className="max-h-48 rounded-control border border-border" />
              <button
                type="button"
                onClick={() => setImage(null)}
                disabled={busy}
                aria-label="Quitar la foto"
                className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white transition-all hover:bg-black/75"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <Button onClick={() => fileRef.current.click()} disabled={busy || reading}>
              <ImagePlus size={16} /> {reading ? 'Leyendo…' : 'Agregar foto'}
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          {imageError && <p role="alert" className="mt-1.5 text-xs text-danger">{imageError}</p>}
        </div>

        {error && <div className="mt-4"><StatusMessage error={error} /></div>}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={cancel} disabled={busy}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!canSave}>
            {busy ? 'Guardando…' : skipping ? 'Guardar sin evidencia' : 'Guardar avance'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
