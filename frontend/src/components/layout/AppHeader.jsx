import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import SM_logo from '../../assets/SF_logo.svg';
import { useAuth } from '../../hooks/useAuth.js';
import UserAvatar from '../profile/UserAvatar.jsx';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';

const linkClass = ({ isActive }) =>
  `rounded-control px-2 py-1.5 text-xs font-medium transition-all ${
    isActive ? 'neu-raised bg-white/60 text-accent' : 'text-text-muted hover:bg-white/50 hover:text-text'
  }`;

export default function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isHome = pathname === '/';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="glass shrink-0 border-b border-white/40 bg-white/40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-20">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Ir al inicio">
          <img src={SM_logo} alt="" className="h-12 w-auto sm:h-16" />
        </Link>

        {user && (
          <div className="flex min-w-0 items-center self-stretch">
          <nav className="flex min-w-0 items-center gap-1 self-stretch overflow-x-auto px-1 whitespace-nowrap [scrollbar-width:none] *:shrink-0 [&::-webkit-scrollbar]:hidden">
            {!isHome && (
              <NavLink to="/" end className={linkClass}>
                Inicio
              </NavLink>
            )}

            {user.role === ROLES.ADMIN && (
              <NavLink to="/dashboard" className={linkClass}>
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </NavLink>
            )}
            {user.role === ROLES.ADMIN && (
              <NavLink to="/registro" className={linkClass}>
                <span className="hidden sm:inline">Registro de respuestas</span>
                <span className="sm:hidden">Registro</span>
              </NavLink>
            )}
            <NavLink to="/seguimiento" className={linkClass}>
              <span className="hidden sm:inline">Seguimiento</span>
              <span className="sm:hidden">Seguimiento</span>
            </NavLink>
            <NavLink to="/historial" className={linkClass}>
              <span className="hidden sm:inline">Mis respuestas</span>
              <span className="sm:hidden">Respuestas</span>
            </NavLink>
            {user.role === ROLES.ADMIN && (
              <NavLink
                to="/usuarios"
                end
                className={state => `${linkClass(state)} inline-flex items-center gap-2`}
              >
                Usuarios
              </NavLink>
            )}
          </nav>

            <NavLink
              to="/perfil"
              className="ml-2 flex shrink-0 items-center gap-2 border-l border-border-strong pl-3 text-sm font-medium text-text-muted hover:text-text"
              title={`Mi perfil · ${user.name} · ${ROLE_LABELS[user.role]}`}
              aria-label="Mi perfil"
            >
              <UserAvatar user={user} size={28} />
              <span className="hidden max-w-40 truncate md:inline">{user.name}</span>
            </NavLink>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title={`Cerrar sesión (${user.name})`}
              className="shrink-0 rounded-control p-2 text-text-muted transition-all hover:bg-white/50 hover:text-danger"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}