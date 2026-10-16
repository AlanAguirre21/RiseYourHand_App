import { useEffect, useState } from 'react';
import { Search, Trash2, UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import EditUserModal from '../../components/ui/EditUserModal.jsx';
import UserAvatar from '../../components/profile/UserAvatar.jsx';
import { Input, Label, Select } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser, deleteUser, listUsers, updateUser as saveUser, updateUserRole } from '../../api/users.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';
import { CONTACT_HINT, cleanName, cleanEmail, cleanPayroll, isValidName, isValidContact } from '../../utils/userFields.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Whether a user matches every word searched, in their name, email, payroll number or role
const matches = (user, words) => {
  const text = normalize([user.name, user.email, user.payroll, ROLE_LABELS[user.role], user.champion ? 'champion' : ''].join(' '));
  return words.every(word => text.includes(word));
};

function NewUserForm({ onCreated }) {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [payroll, setPayroll] = useState('');
  const [role, setRole]   = useState(ROLES.USER);
  const [champion, setChampion] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const data = { name: cleanName(name), email: cleanEmail(email), payroll: cleanPayroll(payroll) };
  const isValid = isValidName(data.name) && isValidContact(data);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    setCreated(null);

    try {
      const user = await createUser({ ...data, role, champion });
      onCreated(user);
      setCreated(user);
      setName('');
      setEmail('');
      setPayroll('');
      setChampion(false);
      setRole(ROLES.USER);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="new-user-title" className={`p-5 ${PANEL}`}>
      <h2 id="new-user-title" className="font-semibold text-text">Nuevo usuario</h2>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor="new-user-name">Nombre completo</Label>
          <Input
            id="new-user-name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="p. ej. Juan Pérez"
          />
        </div>
        <div className="min-w-56 flex-1">
          <Label htmlFor="new-user-email">Correo electrónico</Label>
          <Input
            id="new-user-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="p. ej. miguel.torres@zf.com"
          />
        </div>
        <div className="min-w-32">
          <Label htmlFor="new-user-payroll">Número de nómina</Label>
          <Input
            id="new-user-payroll"
            value={payroll}
            onChange={e => setPayroll(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder="p. ej. 123456"
          />
        </div>
        <div>
          <Label htmlFor="new-user-role">Rol</Label>
          <Select id="new-user-role" block={false} value={role} onChange={e => setRole(e.target.value)}>
            {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-2 py-1.5 text-sm text-text">
          <input type="checkbox" checked={champion} onChange={e => setChampion(e.target.checked)} className="size-4 accent-accent" />
          Champion
        </label>
        <Button type="submit" variant="primary" disabled={!isValid || busy}>
          <UserPlus size={16} /> {busy ? 'Agregando…' : 'Agregar'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-text-faint">El usuario inicia sesión con este nombre. No importan mayúsculas ni acentos. {CONTACT_HINT}</p>

      {error && <div className="mt-3"><StatusMessage error={error} /></div>}
      {created && (
        <div role="status" className="glass mt-3 rounded-control border border-success/25 bg-success/10 p-3 text-sm text-text">
          Usuario <strong>{created.name}</strong> agregado ({ROLE_LABELS[created.role]}{created.champion ? ', champion' : ''}).
        </div>
      )}
    </section>
  );
}

export default function UsersPage() {
  const { user: me, updateUser } = useAuth();

  const [users, setUsers]   = useState(null);   
  const [error, setError]   = useState(null);
  const [busyId, setBusyId] = useState(null);   
  const [confirmRole, setConfirmRole] = useState(null);   
  const [editingUser, setEditingUser] = useState(null);
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState(null);       // user asked about in the delete window
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let active = true;
    listUsers()
      .then(items => { if (active) setUsers(items); })
      .catch(e => { if (active) { setUsers([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  async function saveRole(target, role) {
    setBusyId(target.id);
    setError(null);
    try {
      const updated = await updateUserRole(target.id, role);
      setUsers(list => list.map(u => (u.id === updated.id ? updated : u)));
      setConfirmRole(null);
      if (updated.id === me.id) updateUser(updated);   
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function saveChampion(target, champion) {
    setBusyId(target.id);
    setError(null);
    try {
      const updated = await saveUser(target.id, { champion });
      setUsers(list => list.map(u => (u.id === updated.id ? updated : u)));
      if (updated.id === me.id) updateUser(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setBusyId(deleting.id);
    setDeleteError(null);
    try {
      await deleteUser(deleting.id);
      setUsers(list => list.filter(u => u.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleEdited(updated) {
    setUsers(list => list.map(u => (u.id === updated.id ? updated : u)).sort(byName));
    setEditingUser(null);
    if (updated.id === me.id) updateUser(updated);
  }

  function handleRoleChange(target, role) {
    if (role === target.role) return;
    if (target.id === me.id) {
      setError(null);
      setConfirmRole(role);   
    } else {
      saveRole(target, role);
    }
  }

  const admins = users?.filter(u => u.role === ROLES.ADMIN).length ?? 0;
  const champions = users?.filter(u => u.champion).length ?? 0;
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const shown = users?.filter(u => matches(u, words)) ?? [];

  return (
    <PageContainer size="lg">
      <h1 className="text-2xl font-semibold text-text">Usuarios</h1>
      <p className="mt-1 text-sm text-text-muted">Agrega usuarios y define quién es administrador. Haz clic en un usuario para editar sus datos.</p>

      <div className="mt-6 space-y-4">
        <NewUserForm onCreated={created => setUsers(list => [...(list ?? []), created].sort(byName))} />

        {users === null && <StatusMessage loading />}
        {error && !confirmRole && <StatusMessage error={error} />}

        {users?.length > 0 && (
          <>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
              <Input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre, correo, nómina o rol…"
                aria-label="Buscar usuarios"
                className="pl-9"
              />
            </div>

            {shown.length === 0 ? (
              <p className={`py-10 text-center text-sm text-text-muted ${PANEL}`}>Ningún usuario coincide con «{query.trim()}».</p>
            ) : (
            <div className={`overflow-x-auto ${PANEL}`}>
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border bg-white/60 text-xs text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Correo</th>
                    <th className="px-4 py-3 font-medium">Nómina</th>
                    <th className="px-4 py-3 font-medium">Registrado</th>
                    <th className="px-4 py-3 text-center font-medium">Champion</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3"><span className="sr-only">Eliminar</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => setEditingUser(u)}
                      title="Editar usuario"
                      className="cursor-pointer border-b border-white/40 hover:bg-white/50"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size={32} />
                          <button type="button" className="text-left font-medium text-text hover:text-accent hover:underline">{u.name}</button>
                          {u.id === me.id && (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Tú</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-text-muted">{u.email ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">{u.payroll ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">{dateFormat.format(new Date(u.createdAt))}</td>
                      {/* Champion and role are changed in place: their clicks must not open the edit window */}
                      <td className="cursor-default px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={u.champion}
                          onChange={e => saveChampion(u, e.target.checked)}
                          disabled={busyId === u.id}
                          aria-label={`${u.name} es champion`}
                          className="size-4 cursor-pointer align-middle accent-accent disabled:cursor-wait"
                        />
                      </td>
                      <td className="cursor-default px-4 py-2.5" onClick={e => e.stopPropagation()}>
                        <Select
                          block={false}
                          value={u.role}
                          onChange={e => handleRoleChange(u, e.target.value)}
                          disabled={busyId === u.id || (u.role === ROLES.ADMIN && admins === 1)}
                          title={u.role === ROLES.ADMIN && admins === 1 ? 'Debe quedar al menos un administrador' : undefined}
                          aria-label={`Rol de ${u.name}`}
                        >
                          {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </Select>
                      </td>
                      <td className="cursor-default px-2 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => { setDeleteError(null); setDeleting(u); }}
                          disabled={busyId === u.id || u.id === me.id}
                          title={u.id === me.id ? 'No puedes eliminar tu propio usuario' : `Eliminar a ${u.name}`}
                          aria-label={`Eliminar a ${u.name}`}
                          className="rounded-control p-2 text-text-muted transition-all hover:bg-danger/10 hover:text-danger
                            disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            <p className="text-sm text-text-muted">
              {words.length > 0 && `${shown.length} de `}
              {users.length} {users.length === 1 ? 'usuario' : 'usuarios'} · {admins} {admins === 1 ? 'administrador' : 'administradores'} · {champions} {champions === 1 ? 'champion' : 'champions'}
            </p>
          </>
        )}
      </div>

      {editingUser && <EditUserModal user={editingUser} onSaved={handleEdited} onClose={() => setEditingUser(null)} />}

      <ConfirmModal
        open={confirmRole !== null}
        title="¿Dejar de ser administrador?"
        confirmLabel={`Cambiar a ${ROLE_LABELS[confirmRole] ?? ''}`}
        busy={busyId === me.id}
        error={confirmRole ? error : null}
        onConfirm={() => saveRole(me, confirmRole)}
        onCancel={() => { setConfirmRole(null); setError(null); }}
      >
        Saldrás de esta página y ya no podrás gestionar usuarios ni devolverte este rol tú mismo: otro administrador tendrá que asignártelo de nuevo.
      </ConfirmModal>

      <ConfirmModal
        open={deleting !== null}
        title={`¿Eliminar a ${deleting?.name ?? ''}?`}
        confirmLabel="Eliminar"
        busyLabel="Eliminando…"
        busy={deleting !== null && busyId === deleting.id}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleting(null); setDeleteError(null); }}
      >
        <p>Ya no podrá iniciar sesión ni ser elegido en el formulario. Las manitas que reportó o que tiene a su cargo se conservan.</p>
        {deleting?.champion && (
          <p className="mt-2 font-medium text-danger">Es champion: no se le podrán asignar nuevas manitas.</p>
        )}
        <p className="mt-2">Esta acción no se puede deshacer desde la aplicación.</p>
      </ConfirmModal>
    </PageContainer>
  );
}
