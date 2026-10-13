import { useEffect, useState } from 'react';
import { ArrowLeft, Award, Circle, CircleCheck, UserPlus } from 'lucide-react';
import MenuOption from './MenuOption.jsx';
import NewUserModal from './ui/NewUserModal.jsx';
import { Input } from './Input.jsx';
import { listUserNames, markChampion } from '../api/users.js';

const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

// Answer of a "user" question: one of the registered users, picked from a list that can be
// searched. Whoever is missing can be registered right here. "value" is the name of the user;
// "listClassName" sets how tall the list is before it scrolls.
// With "championsOnly" the list has just the users marked as champion, and a second list, with
// the rest of the users, to mark one of them as champion and pick it
export default function UserPicker({
  id, value = '', onPick, disabled = false, autoFocus = false, championsOnly = false,
  listClassName = 'max-h-44 overflow-y-auto',
}) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [marking, setMarking] = useState(false);   // listing the users that are not champions
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    listUserNames()
      .then(items => { if (active) setUsers(items); })
      .catch(e => { if (active) { setUsers([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  const listed = (users ?? []).filter(u => !championsOnly || u.champion !== marking);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matching = listed.filter(u => words.every(word => normalize(u.name).includes(word)));
  const unknown = value && users && !users.some(u => u.name === value && (!championsOnly || u.champion));
  const blocked = disabled || busy;

  // A user that was just registered, or marked as champion, replaces its entry and is picked
  function pickSaved(user) {
    setUsers(list => [...(list ?? []).filter(u => u.id !== user.id), user].sort(byName));
    setAdding(false);
    setMarking(false);
    setQuery('');
    onPick(user.name);
  }

  async function handleClick(user) {
    if (!marking) return onPick(user.name);
    setBusy(true);
    setError(null);
    try {
      pickSaved(await markChampion(user.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const emptyText = users?.length && query
    ? 'Ningún usuario coincide con la búsqueda.'
    : marking
      ? 'No hay más usuarios para marcar.'
      : championsOnly ? 'Todavía no hay champions registrados.' : 'Todavía no hay usuarios registrados.';

  return (
    <div>
      {marking && <p className="px-1.5 pb-1.5 text-xs font-medium text-text-muted">Elige a quién marcar como champion:</p>}
      <Input
        id={id}
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        // Inside another form, Enter must not send it
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
        disabled={blocked}
        autoFocus={autoFocus}
        placeholder={championsOnly && !marking ? 'Buscar champion…' : 'Buscar usuario…'}
        aria-label={championsOnly && !marking ? 'Buscar champion' : 'Buscar usuario'}
      />
      {unknown && !marking && (
        <p className="mt-1.5 text-xs text-warning">
          «{value}» no es {championsOnly ? 'un champion registrado' : 'un usuario registrado'}: elige uno de la lista o regístralo.
        </p>
      )}
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}

      <div className={`mt-1.5 ${listClassName}`}>
        {users === null && <p className="px-3 py-2 text-xs text-text-muted">Cargando usuarios…</p>}
        {users !== null && matching.length === 0 && !error && <p className="px-3 py-2 text-xs text-text-muted">{emptyText}</p>}
        {matching.map(u => (
          <MenuOption
            key={u.id}
            icon={marking ? <Award size={16} /> : u.name === value ? <CircleCheck size={16} /> : <Circle size={16} />}
            onClick={() => handleClick(u)}
            disabled={blocked}
          >
            {u.name}
          </MenuOption>
        ))}
      </div>

      <div className="mt-1 border-t border-white/60 pt-1">
        {marking ? (
          <MenuOption icon={<ArrowLeft size={16} />} onClick={() => { setMarking(false); setQuery(''); }} disabled={blocked}>
            Volver a los champions
          </MenuOption>
        ) : (
          <>
            {championsOnly && (
              <MenuOption icon={<Award size={16} />} color="success" onClick={() => { setMarking(true); setQuery(''); }} disabled={blocked}>
                Marcar un usuario como champion
              </MenuOption>
            )}
            <MenuOption icon={<UserPlus size={16} />} color="success" onClick={() => setAdding(true)} disabled={blocked}>
              {championsOnly ? 'Registrar nuevo champion' : 'Registrar nuevo usuario'}
            </MenuOption>
          </>
        )}
      </div>

      {adding && (
        <NewUserModal initialName={query.trim()} champion={championsOnly} onCreated={pickSaved} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
