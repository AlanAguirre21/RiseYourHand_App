// Colors of the dashboard charts. Both sets were checked for color-blind separation; identity
// never depends on the color alone: every mark has its name beside it

// Derived from the tracking of each manita (see toRows in utils/dashboard.js)
export const STATUSES = [
  { key: 'not_started', label: 'Not Started', color: '#eb6834' },
  { key: 'in_progress', label: 'In Progress', color: '#2a78d6' },
  { key: 'completed',   label: 'Completed',   color: '#1baf7a' },
];

// Options of the "color" question of form.json, in the same order
export const MANITA_COLORS = [
  { key: 'Amarilla', label: 'Amarilla', color: '#eda100' },
  { key: 'Roja',     label: 'Roja',     color: '#e34948' },
  { key: 'Verde',    label: 'Verde',    color: '#008300' },
  { key: 'CIS',      label: 'CIS',      color: '#6250d6' },
];
export const OTHER_COLOR = { key: 'other', label: 'Otro', color: '#8a8f98' };

export const SERIES_COLOR = '#2a78d6';        // charts with a single series
export const COMPLETED_COLOR = STATUSES[2].color;

export const AGE_BUCKETS = [
  { key: 'old',    label: 'Más de 30 días' },
  { key: 'medium', label: '8-30 días' },
  { key: 'recent', label: '0-7 días' },
];

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const TOP_CHAMPIONS = 4;
