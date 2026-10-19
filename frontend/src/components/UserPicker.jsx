import { useEffect, useState } from 'react';
import { Circle, CircleCheck, UserPlus } from 'lucide-react';
import MenuOption from './MenuOption.jsx';
import NewUserModal from './ui/NewUserModal.jsx';
import { Input } from './Input.jsx';
import { listUserNames } from '../api/users.js';

const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

// Answer of a "user" question: one of the registered users, picked from a list that can be
// searched. Whoever is missing can be registered right here. "value" is the name of the user;
// "listClassName" sets how tall the list is before it scrolls.
// The question for champions does not use it: it lists the registered champions, by area
export default function UserPicker({
  id, value = '', onPick, disabled = false, autoFocus = false,
  listClassName = 'max-h-44 overflow-y-auto',
}) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    listUserNames()
      .then(items => { if (active) setUsers(items); })
      .catch(e => { if (active) { setUsers([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matching = (users ?? []).filter(u => words.every(word => normalize(u.name).includes(word)));
  const unknown = value && users && !users.some(u => u.name === value);

  // A user that was just registered is added to the list and picked
  function pickSaved(user) {
    setUsers(list => [...(list ?? []).filter(u => u.id !== user.id), user].sort(byName));
    setAdding(false);
    setQuery('');
    onPick(user.name);
  }

  const emptyText = users?.length && query ? 'Ningún usuario coincide con la búsqueda.' : 'Todavía no hay usuarios registrados.';

  return (
    <div>
      <Input
        id={id}
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        // Inside another form, Enter must not send it
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder="Buscar usuario…"
        aria-label="Buscar usuario"
      />
      {unknown && (
        <p className="mt-1.5 text-xs text-warning">
          «{value}» no es un usuario registrado: elige uno de la lista o regístralo.
        </p>
      )}
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}

      <div className={`mt-1.5 ${listClassName}`}>
        {users === null && <p className="px-3 py-2 text-xs text-text-muted">Cargando usuarios…</p>}
        {users !== null && matching.length === 0 && !error && <p className="px-3 py-2 text-xs text-text-muted">{emptyText}</p>}
        {matching.map(u => (
          <MenuOption
            key={u.id}
            icon={u.name === value ? <CircleCheck size={16} /> : <Circle size={16} />}
            onClick={() => onPick(u.name)}
            disabled={disabled}
          >
            {u.name}
          </MenuOption>
        ))}
      </div>

      <div className="mt-1 border-t border-white/60 pt-1">
        <MenuOption icon={<UserPlus size={16} />} color="success" onClick={() => setAdding(true)} disabled={disabled}>
          Registrar nuevo usuario
        </MenuOption>
      </div>

      {adding && <NewUserModal initialName={query.trim()} onCreated={pickSaved} onClose={() => setAdding(false)} />}
    </div>
  );
}
