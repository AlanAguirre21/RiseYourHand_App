import { useChartTooltip } from './useChartTooltip.jsx';
import { SERIES_COLOR } from '../../constants/dashboard.js';

const maxOf = items => Math.max(1, ...items.map(item => item.value));

// One horizontal bar per item ({ key, label, value, color? }), with its value at the tip
export function HorizontalBarChart({ items, unit }) {
  const { show, tooltip } = useChartTooltip();
  const max = maxOf(items);

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div
          key={item.key}
          tabIndex={0}
          className="group flex items-center gap-3 rounded-sm text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          {...show({ rows: [{ value: `${item.value} ${unit}`, label: item.label }] })}
        >
          <span className="w-24 shrink-0 truncate text-right text-text-muted">{item.label}</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 border-l border-border-strong py-0.5">
            <div
              className="h-4 rounded-r transition-[filter] group-hover:brightness-110 group-focus-visible:brightness-110"
              // The value label keeps its room at the end of the longest bar
              style={{ width: `calc((100% - 2rem) * ${item.value / max})`, backgroundColor: item.color ?? SERIES_COLOR }}
            />
            <span className="font-medium tabular-nums text-text">{item.value}</span>
          </div>
        </div>
      ))}
      {tooltip}
    </div>
  );
}

// One vertical bar per item, with its value on the cap and its label under the baseline
export function ColumnChart({ items, unit }) {
  const { show, tooltip } = useChartTooltip();
  const max = maxOf(items);

  return (
    <div>
      <div className="flex h-44 items-stretch border-b border-border-strong">
        {items.map(item => (
          <div
            key={item.key}
            tabIndex={0}
            className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1 text-xs outline-none"
            {...show({ rows: [{ value: `${item.value} ${unit}`, label: item.label }] })}
          >
            <span className="font-medium tabular-nums text-text">{item.value}</span>
            <div
              className="w-6 rounded-t transition-[filter] group-hover:brightness-110 group-focus-visible:brightness-110 group-focus-visible:ring-2 group-focus-visible:ring-accent/40"
              // The value label keeps its room over the tallest bar
              style={{ height: `calc((100% - 1.5rem) * ${item.value / max})`, backgroundColor: item.color ?? SERIES_COLOR }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex">
        {items.map(item => (
          <span key={item.key} className="min-w-0 flex-1 text-center text-xs text-text-muted">{item.label}</span>
        ))}
      </div>
      {tooltip}
    </div>
  );
}
