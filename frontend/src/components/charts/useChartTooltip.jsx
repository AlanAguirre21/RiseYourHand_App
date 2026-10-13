import { useState } from 'react';
import { createPortal } from 'react-dom';

// Tooltip shared by the marks of a chart. "show(content)" gives the handlers of one mark, for the
// pointer and for the keyboard focus; "content" is { title?, rows: [{ value, label, color? }] }.
// Render "tooltip" anywhere in the chart
export function useChartTooltip() {
  const [tip, setTip] = useState(null);

  const show = content => ({
    onPointerMove: e => setTip({ x: e.clientX, y: e.clientY, content }),
    onPointerLeave: () => setTip(null),
    onFocus: e => {
      const box = e.currentTarget.getBoundingClientRect();
      setTip({ x: box.left + box.width / 2, y: box.top, content });
    },
    onBlur: () => setTip(null),
  });

  const tooltip = tip && createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-control border border-border-strong bg-white px-3 py-2 text-xs shadow-lg"
      style={{ left: tip.x, top: tip.y - 10 }}
    >
      {tip.content.title && <p className="mb-1 font-medium text-text-muted">{tip.content.title}</p>}
      {tip.content.rows.map(row => (
        <p key={row.label} className="flex items-center gap-2 whitespace-nowrap">
          {row.color && <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: row.color }} />}
          <strong className="font-semibold text-text">{row.value}</strong>
          <span className="text-text-muted">{row.label}</span>
        </p>
      ))}
    </div>,
    document.body,
  );

  return { show, tooltip };
}
