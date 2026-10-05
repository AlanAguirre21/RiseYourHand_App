import { ChevronRight } from 'lucide-react';
import { ACCENT_THEME } from '../constants/styles.js';

export default function OptionCard({ option, status }) {
  const { title, description, Icon, actionLabel = 'Iniciar formulario' } = option;
  const enabled = status === 'available';
  const theme = ACCENT_THEME;

  const label = {
    loading: 'Cargando…',
    available: actionLabel,
    unavailable: 'Próximamente',
  }[status];

  return (
    <>
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-control ${
          enabled ? theme.icon : 'bg-white/50 text-text-faint'
        }`}
      >
        <Icon size={28} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-text">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-text-muted">{description}</p>
      <span
        className={`mt-6 flex w-full items-center justify-center gap-1 rounded-control px-4 py-3 text-sm font-semibold transition-all ${
          enabled ? theme.button : 'bg-white/50 text-text-faint'
        }`}
      >
        {label}
        {enabled && <ChevronRight size={16} />}
      </span>
    </>
  );
}
