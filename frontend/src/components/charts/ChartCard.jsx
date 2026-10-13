import { PANEL } from '../../constants/styles.js';

// Card of one chart: its title, an optional legend line and the plot
export function ChartCard({ title, subtitle, legend, empty, className = '', children }) {
  return (
    <section className={`flex flex-col p-5 ${PANEL} ${className}`}>
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      {legend && !empty && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">{legend}</div>}
      <div className="mt-4 flex flex-1 flex-col justify-center">
        {empty ? <p className="py-10 text-center text-sm text-text-muted">Sin datos en el periodo.</p> : children}
      </div>
    </section>
  );
}

// Key of a legend: a square for filled marks, a short stroke for lines
export function LegendKey({ color, line = false, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={line ? 'h-0.5 w-3.5 rounded-full' : 'size-2.5 rounded-[3px]'}
        style={{ backgroundColor: color }}
      />
      {children}
    </span>
  );
}
