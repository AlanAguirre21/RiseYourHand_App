import { useState } from 'react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import { Input, Label } from '../Input.jsx';
import { updateMe } from '../../api/users.js';
import { PANEL } from '../../constants/styles.js';
import { cleanName, cleanEmail, cleanPayroll, isValidName, isValidEmail, isValidPayroll } from '../../utils/userFields.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long' });

// Users created before these fields existed have no email nor payroll number yet
const valuesOf = user => ({ name: user.name, email: user.email ?? '', payroll: user.payroll ?? '' });

const VALIDATORS = { name: isValidName, email: isValidEmail, payroll: isValidPayroll };

export default function PersonalInfoCard({ user, onSaved }) {
  const [values, setValues] = useState(() => valuesOf(user));
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const [saved, setSaved]   = useState(false);

  const clean = { name: cleanName(values.name), email: cleanEmail(values.email), payroll: cleanPayroll(values.payroll) };
  const current = valuesOf(user);
  // Only the fields that changed are sent, and only those have to be valid
  const changes = Object.fromEntries(Object.entries(clean).filter(([key, value]) => value !== current[key]));
  const changed = Object.keys(changes).length > 0;
  const isValid = Object.entries(changes).every(([key, value]) => VALIDATORS[key](value));

  const setField = key => e => { setValues(v => ({ ...v, [key]: e.target.value })); setSaved(false); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!changed || !isValid || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await updateMe(changes);
      onSaved(updated);
      setValues(valuesOf(updated));
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
            value={values.name}
            onChange={setField('name')}
            maxLength={100}
            autoComplete="name"
            aria-describedby="profile-name-hint"
          />
          <p id="profile-name-hint" className="mt-1 text-xs text-text-faint">
            Es el nombre con el que inicias sesión. Si lo cambias, usa el nuevo la próxima vez.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-email">Correo electrónico</Label>
            <Input
              id="profile-email"
              type="email"
              value={values.email}
              onChange={setField('email')}
              maxLength={100}
              autoComplete="email"
              placeholder="p. ej. miguel.torres@zf.com"
            />
          </div>
          <div>
            <Label htmlFor="profile-payroll">Número de nómina</Label>
            <Input
              id="profile-payroll"
              value={values.payroll}
              onChange={setField('payroll')}
              maxLength={20}
              autoComplete="off"
              placeholder="p. ej. 123456"
            />
          </div>
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
          {changed && !busy && <Button onClick={() => { setValues(valuesOf(user)); setError(null); }}>Descartar</Button>}
          {saved && !changed && <span role="status" className="text-sm text-text-muted">Cambios guardados.</span>}
        </div>
      </form>
    </section>
  );
}
