// States sent by the backend (utils/tracking.js)
export const TRACKING_STATES = {
  not_started: { label: 'Sin iniciar',              badge: 'bg-white/70 text-text-muted', bar: 'bg-text-faint' },
  in_progress: { label: 'En curso',                 badge: 'bg-accent-soft text-accent',  bar: 'bg-gradient-to-br from-accent to-[#409CFF]' },
  overdue:     { label: 'Vencida',                  badge: 'bg-danger/10 text-danger',    bar: 'bg-danger' },
  done:        { label: 'Terminada a tiempo',       badge: 'bg-success/15 text-success',  bar: 'bg-success' },
  done_late:   { label: 'Terminada fuera de tiempo', badge: 'bg-warning/15 text-warning', bar: 'bg-warning' },
};

export const isDone = state => state === 'done' || state === 'done_late';

// Questions of the form shown on each card
export const TRACKING_KEYS = {
  name: 'name',
  champion: 'champion',
  area: 'area',
  start: 'creation_date',
  end: 'expiration_date',
};
