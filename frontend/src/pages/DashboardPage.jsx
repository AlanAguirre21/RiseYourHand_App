import { useMemo, useState } from 'react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import Button from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import { ChartCard, LegendKey } from '../components/charts/ChartCard.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import { ColumnChart, HorizontalBarChart } from '../components/charts/BarCharts.jsx';
import MonthlyChart from '../components/charts/MonthlyChart.jsx';
import { useLiveData } from '../hooks/useLiveData.js';
import { listDashboard } from '../api/forms.js';
import { PANEL } from '../constants/styles.js';
import { COMPLETED_COLOR, MANITA_COLORS, SERIES_COLOR, STATUSES, TOP_CHAMPIONS } from '../constants/dashboard.js';
import { filterByDate, formatPercent, summarize, toRows } from '../utils/dashboard.js';
import zfLogo from '../assets/ZF_logo.svg';

const UNIT = 'manitas';
const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

// The filter starts on the current year
function currentYear() {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function StatTile({ label, value, hint }) {
  return (
    <div className={`p-4 ${PANEL}`} title={hint}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}

// What the colors of the charts mean
function Legend({ title, items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-semibold text-text">{title}</span>
      {items.map(item => <LegendKey key={item.key} color={item.color}>{item.label}</LegendKey>)}
    </div>
  );
}

export default function DashboardPage() {
  const { data: responses, error } = useLiveData(listDashboard);
  const [range, setRange] = useState(currentYear);

  const rows = useMemo(() => (responses ? toRows(responses) : null), [responses]);
  const stats = useMemo(
    () => (rows ? summarize(filterByDate(rows, range.from, range.to)) : null),
    [rows, range],
  );

  const invalidRange = range.from && range.to && range.from > range.to;
  const oneYear = range.from && range.to && range.from.slice(0, 4) === range.to.slice(0, 4);
  const empty = stats?.total === 0;

  return (
    <PageContainer size="xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={zfLogo} alt="" className="size-12 shrink-0 object-contain" />
          <hgroup>
            <h1 className="text-2xl font-semibold text-text">Gestión de Manitas</h1>
            <p className="mt-1 text-sm text-text-muted">Indicadores de las manitas, según su fecha de creación.</p>
          </hgroup>
        </div>

        {/* Scopes every figure and chart of the page */}
        <div className="flex flex-wrap items-end gap-2 text-xs font-medium text-text-muted">
          <label className="flex flex-col gap-1">
            Desde
            <Input
              type="date"
              block={false}
              value={range.from}
              max={range.to || undefined}
              onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            Hasta
            <Input
              type="date"
              block={false}
              value={range.to}
              min={range.from || undefined}
              onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
            />
          </label>
          <Button onClick={() => setRange({ from: '', to: '' })} disabled={!range.from && !range.to}>Todas las fechas</Button>
        </div>
      </div>

      <div className={`mt-5 flex flex-wrap gap-x-10 gap-y-2 px-5 py-3 text-xs text-text-muted ${PANEL}`}>
        <Legend title="Estatus:" items={STATUSES} />
        <Legend title="Color manita:" items={MANITA_COLORS} />
      </div>

      <div className="mt-4 space-y-4">
        {error && <StatusMessage error={error} />}
        {!error && !stats && <StatusMessage loading />}
        {invalidRange && <StatusMessage error="La fecha «Desde» es posterior a la fecha «Hasta»." />}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Manitas totales" value={stats.total} />
              <StatTile label="Manitas abiertas" value={stats.open} hint="Las que todavía no llegan al 100% de avance" />
              <StatTile label="Manitas completas" value={stats.completed} hint="Las que llegaron al 100% de avance" />
              <StatTile label="% Completadas" value={formatPercent(stats.completedPercent)} hint="Completas entre totales" />
              <StatTile
                label="Días promedio completar"
                value={stats.averageDays == null ? '—' : numberFormat.format(stats.averageDays)}
                hint="De la fecha de creación al día en que se completó"
              />
              <StatTile
                label="% Cumplimiento"
                value={formatPercent(stats.compliancePercent)}
                hint="De las completas, las que se completaron a más tardar en su fecha de vencimiento"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Manitas por color" empty={empty}>
                <DonutChart items={stats.byColor} unit={UNIT} />
              </ChartCard>
              <ChartCard title="Estatus" empty={empty}>
                <HorizontalBarChart items={stats.byStatus} unit={UNIT} />
              </ChartCard>
              <ChartCard
                title="Manitas abiertas por champion"
                subtitle={`Los ${TOP_CHAMPIONS} con más manitas abiertas`}
                empty={stats.topChampions.length === 0}
              >
                <HorizontalBarChart items={stats.topChampions} unit="manitas abiertas" />
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Antigüedad manitas abiertas" subtitle="Días desde su fecha de creación" empty={stats.open === 0}>
                <ColumnChart items={stats.aging} unit="manitas abiertas" />
              </ChartCard>
              <ChartCard
                title="Manitas completadas por mes"
                subtitle={oneYear ? `Mes de creación, ${range.from.slice(0, 4)}` : 'Mes de creación (se suman los años del periodo)'}
                legend={(
                  <>
                    <LegendKey color={SERIES_COLOR}>Manitas registradas</LegendKey>
                    <LegendKey color={COMPLETED_COLOR} line>% completadas</LegendKey>
                  </>
                )}
                empty={empty}
                className="lg:col-span-2"
              >
                <MonthlyChart months={stats.monthly} />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
