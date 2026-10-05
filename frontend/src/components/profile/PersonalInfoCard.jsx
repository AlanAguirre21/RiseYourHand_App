import { useState } from 'react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import { Input, Label } from '../Input.jsx';
import { updateMe } from '../../api/users.js';
import { PANEL } from '../../constants/styles.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long' });

export default function PersonalInfoCard({ user, onSaved }) {
  const [name, setName]     = useState(user.name);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const [saved, setSaved]   = useState(false);

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const changed = cleanName !== user.name;
  const isValid = cleanName.length >= 3;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!changed || !isValid || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await updateMe({ name: cleanName });
      onSaved(updated);
      setName(updated.name);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="info-title" className={`p-6 ${PANEL}`}>
      <h2 id="info-title" className="font-semibold text-text">Información personal</h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="profile-name">Nombre completo</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={e => { setName(e.target.value); setSaved(false); }}
            maxLength={100}
            autoComplete="name"
            aria-describedby="profile-name-hint"
          />
          <p id="profile-name-hint" className="mt-1 text-xs text-text-faint">
            Es el nombre con el que inicias sesión. Si lo cambias, usa el nuevo la próxima vez.
          </p>
        </div>

        {user.createdAt && (
          <div>
            <p className="mb-1 text-xs font-medium text-text-muted">Registrado desde</p>
            <p className="text-sm text-text">{dateFormat.format(new Date(user.createdAt))}</p>
          </div>
        )}

        {error && <StatusMessage error={error} />}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={!changed || !isValid || busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          {changed && !busy && <Button onClick={() => { setName(user.name); setError(null); }}>Descartar</Button>}
          {saved && !changed && <span role="status" className="text-sm text-text-muted">Cambios guardados.</span>}
        </div>
      </form>
    </section>
  );
}
