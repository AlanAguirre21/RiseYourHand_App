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
import { createUser, deleteUser, listUsers, updateUserRole } from '../../api/users.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';
import { CONTACT_HINT, cleanName, cleanEmail, cleanPayroll, isValidName, isValidContact } from '../../utils/userFields.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Whether a user matches every word searched, in their name, email, payroll number, role or area
const matches = (user, words) => {
  const text = normalize([user.name, user.email, user.payroll, ROLE_LABELS[user.role], user.champion ? `champion ${user.area ?? ''}` : ''].join(' '));
  return words.every(word => text.includes(word));
};

// Adds a user. With "champion" it adds a champion instead: it also asks for the area or department
// in their charge, and the email is required (the manitas assigned to them are sent there)
function NewUserForm({ champion = false, onCreated }) {
  const [name, setName]   = useState('');
  const [area, setArea]   = useState('');
  const [email, setEmail] = useState('');
  const [payroll, setPayroll] = useState('');
  const [role, setRole]   = useState(ROLES.USER);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const idPrefix = champion ? 'new-champion' : 'new-user';
  const data = { name: cleanName(name), email: cleanEmail(email), payroll: cleanPayroll(payroll) };
  const cleanArea = cleanName(area);
  const isValid = isValidName(data.name) && isValidContact(data) && (!champion || (cleanArea && data.email));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    setCreated(null);

    try {
      const user = await createUser(champion ? { ...data, role, champion: true, area: cleanArea } : { ...data, role });
      onCreated(user);
      setCreated(user);
      setName('');
      setArea('');
      setEmail('');
      setPayroll('');
      setRole(ROLES.USER);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={`${idPrefix}-title`} className={`p-5 ${PANEL}`}>
      <h2 id={`${idPrefix}-title`} className="font-semibold text-text">{champion ? 'Nuevo champion' : 'Nuevo usuario'}</h2>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor={`${idPrefix}-name`}>Nombre completo</Label>
          <Input
            id={`${idPrefix}-name`}
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="p. ej. Juan Pérez"
          />
        </div>
        {champion && (
          <div className="min-w-56 flex-1">
            <Label htmlFor={`${idPrefix}-area`}>Área o departamento a cargo</Label>
            <Input
              id={`${idPrefix}-area`}
              value={area}
              onChange={e => setArea(e.target.value)}
              maxLength={100}
              autoComplete="off"
              placeholder="p. ej. Mantenimiento"
            />
          </div>
        )}
        <div className="min-w-56 flex-1">
          <Label htmlFor={`${idPrefix}-email`}>Correo electrónico</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="p. ej. miguel.torres@zf.com"
          />
        </div>
        <div className="min-w-32">
          <Label htmlFor={`${idPrefix}-payroll`}>Número de nómina</Label>
          <Input
            id={`${idPrefix}-payroll`}
            value={payroll}
            onChange={e => setPayroll(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder="p. ej. 123456"
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-role`}>Rol</Label>
          <Select id={`${idPrefix}-role`} block={false} value={role} onChange={e => setRole(e.target.value)}>
            {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="primary" disabled={!isValid || busy}>
          <UserPlus size={16} /> {busy ? 'Agregando…' : 'Agregar'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-text-faint">
        {champion
          ? 'Aparecerá como opción del área en el formulario de manitas. El correo es obligatorio: ahí se le avisa de las manitas a su cargo.'
          : `El usuario inicia sesión con este nombre. No importan mayúsculas ni acentos. ${CONTACT_HINT}`}
      </p>

      {error && <div className="mt-3"><StatusMessage error={error} /></div>}
      {created && (
        <div role="status" className="glass mt-3 rounded-control border border-success/25 bg-success/10 p-3 text-sm text-text">
          {champion
            ? <>Champion <strong>{created.name}</strong> agregado ({created.area}, {ROLE_LABELS[created.role]}).</>
            : <>Usuario <strong>{created.name}</strong> agregado ({ROLE_LABELS[created.role]}).</>}
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

  function handleCreated(created) {
    setUsers(list => [...(list ?? []), created].sort(byName));
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
      <p className="mt-1 text-sm text-text-muted">Agrega usuarios y champions, y define quién es administrador. Haz clic en un usuario para editar sus datos.</p>

      <div className="mt-6 space-y-4">
        <NewUserForm onCreated={handleCreated} />
        <NewUserForm champion onCreated={handleCreated} />

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
                placeholder="Buscar por nombre, correo, nómina, rol o área…"
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
                    <th className="px-4 py-3 text-center font-medium">Champion (área)</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3"><span className="sr-only">Eliminar</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(u => (
                    <tr
                      key={u.id}
                      // The default admin cannot be edited by anyone else
                      onClick={u.system ? undefined : () => setEditingUser(u)}
                      title={u.system ? 'El administrador predeterminado no se puede editar' : 'Editar usuario'}
                      className={`border-b border-white/40 ${u.system ? '' : 'cursor-pointer hover:bg-white/50'}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size={32} />
                          {u.system
                            ? <span className="font-medium text-text">{u.name}</span>
                            : <button type="button" className="text-left font-medium text-text hover:text-accent hover:underline">{u.name}</button>}
                          {u.id === me.id && (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Tú</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-text-muted">{u.email ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">{u.payroll ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">{dateFormat.format(new Date(u.createdAt))}</td>
                      {/* Champions are added with their own form: here just their area is shown */}
                      <td className="px-4 py-2.5 text-center">
                        {u.champion
                          ? (
                            <span title="Champion" className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                              {u.area ?? 'Champion'}
                            </span>
                          )
                          : <span className="text-text-faint">—</span>}
                      </td>
                      {/* The role is changed in place: its clicks must not open the edit window */}
                      <td className="cursor-default px-4 py-2.5" onClick={e => e.stopPropagation()}>
                        <Select
                          block={false}
                          value={u.role}
                          onChange={e => handleRoleChange(u, e.target.value)}
                          disabled={busyId === u.id || u.system || (u.role === ROLES.ADMIN && admins === 1)}
                          title={u.system
                            ? 'El administrador predeterminado siempre es administrador'
                            : u.role === ROLES.ADMIN && admins === 1 ? 'Debe quedar al menos un administrador' : undefined}
                          aria-label={`Rol de ${u.name}`}
                        >
                          {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </Select>
                      </td>
                      <td className="cursor-default px-2 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => { setDeleteError(null); setDeleting(u); }}
                          disabled={busyId === u.id || u.id === me.id || u.system}
                          title={u.system
                            ? 'El administrador predeterminado no se puede eliminar'
                            : u.id === me.id ? 'No puedes eliminar tu propio usuario' : `Eliminar a ${u.name}`}
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
