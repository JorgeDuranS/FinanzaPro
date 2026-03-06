import React from 'react';
import type { CategoryBreakdownItem } from '../../hooks/useStats';
import { formatCOP } from '../../utils/formatters';

type Props = {
  items: CategoryBreakdownItem[];
};

const BAR_COLORS = ['bg-teal-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-rose-500'];

export default function CategoryBreakdownChart({ items }: Props) {
  const donutItems = items.slice(0, 4);
  const palette = ['#0f766e', '#10b981', '#06b6d4', '#f59e0b'];
  const donutBackground = donutItems.length === 0
    ? 'conic-gradient(#cbd5e1 0deg, #cbd5e1 360deg)'
    : (() => {
      let cumulative = 0;
      const stops = donutItems.map((item, index) => {
        const start = cumulative;
        cumulative += item.percent * 3.6;
        return `${palette[index % palette.length]} ${start}deg ${Math.min(360, cumulative)}deg`;
      });
      if (cumulative < 360) {
        stops.push(`rgba(148, 163, 184, 0.25) ${cumulative}deg 360deg`);
      }
      return `conic-gradient(${stops.join(', ')})`;
    })();

  return (
    <section className="surface-card p-5 rounded-3xl space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Distribucion</p>
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Gastos por categoria</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Aun no hay gastos registrados este mes para mostrar la distribucion.</p>
      ) : (
        <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
          <div className="pt-1">
            <div className="mx-auto h-24 w-24 rounded-full grid place-items-center" style={{ background: donutBackground }}>
              <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-900 grid place-items-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Mes</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {items.slice(0, 6).map((item, index) => (
              <article key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                    {item.category}
                  </p>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(item.total)}</p>
                    <p className="text-slate-500 dark:text-slate-400">{item.percent.toFixed(1)}% ({item.count})</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                    style={{ width: `${Math.min(100, Math.max(4, item.percent))}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
