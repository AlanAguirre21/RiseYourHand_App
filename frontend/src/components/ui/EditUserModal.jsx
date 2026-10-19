import { useEffect, useRef, useState } from 'react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import UserAvatar from '../profile/UserAvatar.jsx';
import { Input, Label } from '../Input.jsx';
import { updateUser } from '../../api/users.js';
import { ROLE_LABELS } from '../../constants/roles.js';
import { CONTACT_HINT, cleanName, cleanEmail, cleanPayroll, isValidName, isValidContact } from '../../utils/userFields.js';

// Users created before these fields existed have no email nor payroll number yet. Only champions
// have an area
const valuesOf = user => ({
  name: user.name, email: user.email ?? '', payroll: user.payroll ?? '',
  ...(user.champion && { area: user.area ?? '' }),
});


// An admin edits the data of any user (and the area in charge of a champion). Mount it only while it is open
export default function EditUserModal({ user, onSaved, onClose }) {
  const ref = useRef(null);
  const [values, setValues] = useState(() => valuesOf(user));
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const clean = {
    name: cleanName(values.name), email: cleanEmail(values.email), payroll: cleanPayroll(values.payroll),
    ...(user.champion && { area: cleanName(values.area) }),
  };
  const current = valuesOf(user);
  // Only the fields that changed are sent, and only those have to be valid
  const changes = Object.fromEntries(Object.entries(clean).filter(([key, value]) => value !== current[key]));
  const changed = Object.keys(changes).length > 0;
  const isValid = (!('name' in changes) || isValidName(clean.name))
    && (!('email' in changes || 'payroll' in changes) || isValidContact(clean))
    && (!('area' in changes) || clean.area.length > 0);

  const setField = key => e => setValues(v => ({ ...v, [key]: e.target.value }));

  function close() {
    if (!busy) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!changed || !isValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateUser(user.id, changes));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="edit-user-modal-title"
      onCancel={e => { e.preventDefault(); close(); }}
      onClick={e => { if (e.target === ref.current) close(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size={44} />
          <div className="min-w-0">
            <h2 id="edit-user-modal-title" className="text-lg font-semibold text-text">Editar usuario</h2>
            <p className="truncate text-sm text-text-muted">{user.name} · {ROLE_LABELS[user.role]}{user.champion ? ' · Champion' : ''}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="edit-user-name">Nombre completo</Label>
            <Input
              id="edit-user-name"
              value={values.name}
              onChange={setField('name')}
              maxLength={100}
              autoFocus={!user.champion && !user.system}
              readOnly={user.champion || user.system}
              autoComplete="off"
              aria-describedby="edit-user-name-hint"
            />
            <p id="edit-user-name-hint" className="mt-1 text-xs text-text-faint">
              {user.system
                ? 'Es el administrador predeterminado: su nombre no se puede cambiar.'
                : user.champion
                  ? 'Es champion: su nombre no se puede cambiar, porque así aparece en las manitas a su cargo.'
                  : 'Es el nombre con el que inicia sesión: si lo cambias, tendrá que usar el nuevo.'}
            </p>
          </div>
          {user.champion && (
            <div>
              <Label htmlFor="edit-user-area">Área o departamento a cargo</Label>
              <Input
                id="edit-user-area"
                value={values.area}
                onChange={setField('area')}
                maxLength={100}
                autoFocus
                autoComplete="off"
                placeholder="p. ej. Mantenimiento"
                aria-describedby="edit-user-area-hint"
              />
              <p id="edit-user-area-hint" className="mt-1 text-xs text-text-faint">
                Así aparece como opción en el formulario de manitas.
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="edit-user-email">Correo electrónico</Label>
            <Input
              id="edit-user-email"
              type="email"
              value={values.email}
              onChange={setField('email')}
              maxLength={100}
              autoComplete="off"
              placeholder="p. ej. miguel.torres@zf.com"
            />
          </div>
          <div>
            <Label htmlFor="edit-user-payroll">Número de nómina</Label>
            <Input
              id="edit-user-payroll"
              value={values.payroll}
              onChange={setField('payroll')}
              maxLength={20}
              autoComplete="off"
              placeholder="p. ej. 123456"
            />
            <p className="mt-1 text-xs text-text-faint">{CONTACT_HINT}</p>
          </div>
        </div>

        {error && <div className="mt-4"><StatusMessage error={error} /></div>}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={close} disabled={busy}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!changed || !isValid || busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
