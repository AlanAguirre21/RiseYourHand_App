import { useChartTooltip } from './useChartTooltip.jsx';
import { formatPercent } from '../../utils/dashboard.js';
import { COMPLETED_COLOR, SERIES_COLOR } from '../../constants/dashboard.js';

// Top of the count axis: a round number whose half is also round
function niceMax(value) {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 4, 6, 8, 10].map(m => m * power).find(top => value <= top);
}

// Consecutive months that have a percentage, so the line is not drawn across the empty ones
function runsOf(months) {
  const runs = [];
  let run = [];
  months.forEach((m, i) => {
    if (m.percent == null) {
      if (run.length) runs.push(run);
      run = [];
    } else {
      run.push({ x: i + 0.5, y: 100 - m.percent });
    }
  });
  if (run.length) runs.push(run);
  return runs;
}

// Bars: manitas of each month, read on the axis at the left. Line: the percentage of them that
// are completed, from 0% at the baseline to 100% at the top; it has no axis of its own, every
// point carries its value. "months" are { key, label, total, completed, percent }
export default function MonthlyChart({ months }) {
  const { show, tooltip } = useChartTooltip();
  const top = niceMax(Math.max(...months.map(m => m.total)));
  const columns = { gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` };

  return (
    <div className="pt-5">
      <div className="flex gap-2">
        <div className="flex h-44 w-6 shrink-0 flex-col justify-between text-right text-[10px] leading-none tabular-nums text-text-faint">
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>

        <div className="relative h-44 min-w-0 flex-1">
          <div className="absolute inset-x-0 top-0 border-t border-border" />
          <div className="absolute inset-x-0 top-1/2 border-t border-border" />
          <div className="absolute inset-x-0 bottom-0 border-t border-border-strong" />

          <div className="absolute inset-0 grid items-end" style={columns}>
            {months.map(m => (
              <div key={m.key} className="flex h-full items-end justify-center">
                <div className="w-3/5 max-w-6 rounded-t" style={{ height: `${(m.total / top) * 100}%`, backgroundColor: SERIES_COLOR }} />
              </div>
            ))}
          </div>

          <svg className="absolute inset-0 size-full" viewBox={`0 0 ${months.length} 100`} preserveAspectRatio="none" aria-hidden="true">
            {runsOf(months).map(run => (
              <polyline
                key={run[0].x}
                points={run.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={COMPLETED_COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {months.map((m, i) => m.percent != null && (
            <div
              key={m.key}
              className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center"
              style={{ left: `${((i + 0.5) / months.length) * 100}%`, bottom: `${m.percent}%` }}
            >
              <span className="absolute bottom-full mb-0.5 rounded bg-white/85 px-1 text-[10px] font-medium leading-tight tabular-nums text-text">
                {formatPercent(m.percent)}
              </span>
              <span className="size-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: COMPLETED_COLOR }} />
            </div>
          ))}

          {/* One hit area per month, as wide as its column */}
          <div className="absolute inset-0 grid" style={columns}>
            {months.map(m => (
              <div
                key={m.key}
                tabIndex={0}
                className="rounded-sm outline-none hover:bg-white/40 focus-visible:bg-white/40 focus-visible:ring-2 focus-visible:ring-accent/40"
                {...show({
                  title: m.label,
                  rows: [
                    { value: m.total, label: 'manitas registradas', color: SERIES_COLOR },
                    { value: `${m.completed} · ${formatPercent(m.percent)}`, label: 'completadas', color: COMPLETED_COLOR },
                  ],
                })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="ml-8 mt-1.5 grid text-center text-[11px] text-text-muted" style={columns}>
        {months.map(m => <span key={m.key}>{m.label}</span>)}
      </div>
      {tooltip}
    </div>
  );
}
