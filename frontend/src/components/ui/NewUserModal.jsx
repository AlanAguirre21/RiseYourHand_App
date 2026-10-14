import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import { Input, Label } from '../Input.jsx';
import { createUser } from '../../api/users.js';
import { CONTACT_HINT, cleanName, cleanEmail, cleanPayroll, isValidName, isValidContact } from '../../utils/userFields.js';

// Registers a user with the same data as the register page, without leaving the current one.
// Mount it only while it is open (it starts from "initialName"). It is rendered in <body> so it
// can be used inside another form. With "champion" the user is registered as a champion
export default function NewUserModal({ initialName = '', champion = false, onCreated, onClose }) {
  const ref = useRef(null);
  const [name, setName]       = useState(initialName);
  const [email, setEmail]     = useState('');
  const [payroll, setPayroll] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const data = { name: cleanName(name), email: cleanEmail(email), payroll: cleanPayroll(payroll) };
  const isValid = isValidName(data.name) && isValidContact(data);

  function close() {
    if (!busy) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();   // React events cross the portal: keep it away from an outer form
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      onCreated(await createUser(champion ? { ...data, champion: true } : data));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="new-user-modal-title"
      onCancel={e => { e.preventDefault(); close(); }}
      onClick={e => { e.stopPropagation(); if (e.target === ref.current) close(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 id="new-user-modal-title" className="text-lg font-semibold text-text">{champion ? 'Registrar nuevo champion' : 'Registrar nuevo usuario'}</h2>
        <p className="mt-1 text-sm text-text-muted">Podrá iniciar sesión con su nombre.</p>

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="modal-user-name">Nombre completo</Label>
            <Input
              id="modal-user-name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              autoFocus
              autoComplete="off"
              placeholder="p. ej. Juan Pérez"
            />
          </div>
          <div>
            <Label htmlFor="modal-user-email">Correo electrónico</Label>
            <Input
              id="modal-user-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={100}
              autoComplete="off"
              placeholder="p. ej. miguel.torres@zf.com"
            />
          </div>
          <div>
            <Label htmlFor="modal-user-payroll">Número de nómina</Label>
            <Input
              id="modal-user-payroll"
              value={payroll}
              onChange={e => setPayroll(e.target.value)}
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
          <Button type="submit" variant="primary" disabled={!isValid || busy}>
            {busy ? 'Registrando…' : champion ? 'Registrar champion' : 'Registrar usuario'}
          </Button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
