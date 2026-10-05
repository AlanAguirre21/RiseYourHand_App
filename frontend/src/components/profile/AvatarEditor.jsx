import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import UserAvatar from './UserAvatar.jsx';
import { updateMe } from '../../api/users.js';
import { PANEL } from '../../constants/styles.js';

const AVATAR_SIZE = 256;                 
const MAX_FILE_SIZE = 15 * 1024 * 1024;

async function toAvatarDataUrl(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const side = Math.min(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = AVATAR_SIZE;
  canvas.getContext('2d').drawImage(
    bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
    0, 0, AVATAR_SIZE, AVATAR_SIZE,
  );
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function AvatarEditor({ user, onSaved }) {
  const inputRef = useRef(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);

  async function save(avatar) {
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateMe({ avatar }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = '';   // so choosing the same file again fires onChange
    if (!file) return;

    if (!file.type.startsWith('image/')) return setError('El archivo debe ser una imagen.');
    if (file.size > MAX_FILE_SIZE) return setError('La imagen no puede pesar más de 15 MB.');

    let avatar;
    try {
      avatar = await toAvatarDataUrl(file);
    } catch {
      return setError('No se pudo leer la imagen. Prueba con un archivo JPG o PNG.');
    }
    await save(avatar);
  }

  return (
    <section aria-labelledby="avatar-title" className={`flex flex-col items-center p-6 text-center ${PANEL}`}>
      <h2 id="avatar-title" className="sr-only">Foto de perfil</h2>
      <UserAvatar user={user} size={112} className="neu-raised" />
      <p className="mt-4 max-w-full truncate text-lg font-semibold text-text">{user.name}</p>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={() => inputRef.current.click()} disabled={busy}>
          <Camera size={16} /> {busy ? 'Guardando…' : user.avatar ? 'Cambiar foto' : 'Subir foto'}
        </Button>
        {user.avatar && (
          <Button onClick={() => save(null)} disabled={busy}>
            <Trash2 size={16} /> Quitar
          </Button>
        )}
      </div>
      <p className="mt-3 text-xs text-text-faint">Se recorta al centro en forma cuadrada.</p>

      {error && <div className="mt-3 w-full text-left"><StatusMessage error={error} /></div>}
    </section>
  );
}
