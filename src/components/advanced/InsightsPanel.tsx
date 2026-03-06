import React from 'react';
import type { UseStatsResult } from '../../hooks/useStats';
import { formatCOP } from '../../utils/formatters';

type Props = {
  stats: UseStatsResult;
};

export default function InsightsPanel({ stats }: Props) {
  const topCategory = stats.expensesByCategory[0];
  const hottestMonth = [...stats.monthlySeries].sort((a, b) => b.spent - a.spent)[0];
  const suggestion = stats.spentPercent > 85
    ? 'Prioriza recortar categorias variables esta semana para recuperar margen.'
    : stats.spentPercent > 65
      ? 'Vas en ritmo medio. Controla gastos hormiga para proteger el ahorro.'
      : 'Ritmo saludable. Puedes reforzar tu meta de ahorro este mes.';

  return (
    <section className="premium-surface p-5 rounded-3xl space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Insights</p>
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Lectura rapida del presupuesto</h3>
      </div>

      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
        <li className="metric-pill">
          Tu balance disponible actual es <span className="font-bold">{formatCOP(stats.availableBalance)}</span>.
        </li>
        {topCategory ? (
          <li className="metric-pill">
            La categoria con mayor peso es <span className="font-bold">{topCategory.category}</span> ({topCategory.percent.toFixed(1)}%).
          </li>
        ) : null}
        {hottestMonth ? (
          <li className="metric-pill">
            El mes mas exigente del historial reciente fue <span className="font-bold uppercase">{hottestMonth.label}</span> con {formatCOP(hottestMonth.spent)} en gastos.
          </li>
        ) : null}
        <li className="metric-pill">
          Tu meta de ahorro del mes es <span className="font-bold">{formatCOP(stats.savingsAmount)}</span> y llevas {stats.spentPercent.toFixed(0)}% del presupuesto proyectado.
        </li>
      </ul>

      <div className="rounded-2xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-200/60 dark:border-teal-700/40 p-3">
        <p className="text-xs uppercase tracking-[0.12em] font-bold text-teal-700 dark:text-teal-300">Sugerencia</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{suggestion}</p>
      </div>
    </section>
  );
}
