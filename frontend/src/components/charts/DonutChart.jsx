import { useChartTooltip } from './useChartTooltip.jsx';
import { formatPercent } from '../../utils/dashboard.js';

const SIZE = 120;
const RADIUS = 44;
const STROKE = 14;
const GAP = 2;   // empty space between two slices
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Share of each item in the total, as a ring. "items" are { key, label, value, color }; the
// list beside it gives the count and the percentage of each one, so nothing depends on the hover
export default function DonutChart({ items, unit }) {
  const { show, tooltip } = useChartTooltip();
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const slices = items.filter(item => item.value > 0);
  const gap = slices.length > 1 ? GAP : 0;

  const arcs = slices.map((item, i) => {
    const before = slices.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    return {
      ...item,
      offset: (before / total) * CIRCUMFERENCE + gap / 2,
      length: Math.max((item.value / total) * CIRCUMFERENCE - gap, 0.5),
    };
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
      <div className="relative size-40 shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" role="img" aria-label={`${total} ${unit}`}>
          {arcs.map(arc => (
            <circle
              key={arc.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset}
              pointerEvents="stroke"
              tabIndex={0}
              className="outline-none transition-[stroke-width] hover:[stroke-width:17] focus-visible:[stroke-width:17]"
              {...show({ rows: [{ value: `${arc.value} · ${formatPercent((arc.value / total) * 100)}`, label: arc.label, color: arc.color }] })}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-text">{total}</span>
          <span className="text-[11px] text-text-muted">{unit}</span>
        </div>
      </div>

      <ul className="min-w-32 space-y-1.5 text-xs">
        {items.map(item => (
          <li key={item.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
            <span className="flex-1 text-text-muted">{item.label}</span>
            <span className="tabular-nums text-text-muted">{item.value}</span>
            <strong className="w-9 text-right font-semibold tabular-nums text-text">{formatPercent((item.value / total) * 100)}</strong>
          </li>
        ))}
      </ul>
      {tooltip}
    </div>
  );
}
