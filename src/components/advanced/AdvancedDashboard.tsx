import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { UseStatsResult } from '../../hooks/useStats';
import { formatCOP } from '../../utils/formatters';
import BudgetHealthCard from './BudgetHealthCard';
import CategoryBreakdownChart from './CategoryBreakdownChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import DailyCashflowHeatmap from './DailyCashflowHeatmap';
import FixedVsVariableChart from './FixedVsVariableChart';
import TopExpensesChart from './TopExpensesChart';
import InsightsPanel from './InsightsPanel';

type Props = {
  stats: UseStatsResult;
  onGoHistory: () => void;
};

export default function AdvancedDashboard({ stats, onGoHistory }: Props) {
  const lastMonth = stats.monthlySeries[stats.monthlySeries.length - 2];
  const thisMonth = stats.monthlySeries[stats.monthlySeries.length - 1];
  const hasLastMonthData = lastMonth && (lastMonth.spent > 0 || lastMonth.income > 0);
  const spentDelta = hasLastMonthData
    ? (((thisMonth?.spent || 0) - lastMonth.spent) / Math.max(1, lastMonth.spent)) * 100
    : 0;

  return (
    <div className="space-y-5">
      <section className="premium-surface rounded-3xl p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-teal-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-teal-700 dark:text-teal-300">Pulse del presupuesto</p>
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">Panel financiero avanzado</h2>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500/80" aria-hidden />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="metric-pill">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Ingresos</p>
              <p className="text-sm font-display font-bold text-emerald-700 dark:text-emerald-300">{formatCOP(stats.income)}</p>
            </div>
            <div className="metric-pill">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Gastos</p>
              <p className="text-sm font-display font-bold text-rose-600">{formatCOP(stats.totalSpent)}</p>
            </div>
            <div className="metric-pill">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Balance</p>
              <p className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.availableBalance)}</p>
            </div>
          </div>

          {hasLastMonthData && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Frente al mes anterior, el gasto va
              <span className={`ml-1 font-bold ${spentDelta <= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                {spentDelta <= 0 ? 'a la baja' : 'al alza'} ({Math.abs(spentDelta).toFixed(1)}%)
              </span>.
            </p>
          )}
        </div>
      </section>

      <BudgetHealthCard health={stats.budgetHealth} />

      <section className="surface-card p-5 rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Variación Mensual
            </p>
            <p className={`text-2xl font-display font-bold ${
              stats.monthlyVariation >= 0 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-500'
            }`}>
              {stats.monthlyVariation >= 0 ? '+' : ''}{formatCOP(stats.monthlyVariation)}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${
            stats.monthlyVariation >= 0 
              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
              : 'bg-rose-100 dark:bg-rose-900/30'
          }`}>
            {stats.monthlyVariation >= 0 ? (
              <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown size={24} className="text-rose-500" />
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {stats.monthlyVariation >= 0 
            ? 'Ahorrado vs promedio de obligaciones' 
            : 'Gasto adicional vs promedio de obligaciones'}
        </p>
      </section>

      <CategoryBreakdownChart items={stats.expensesByCategory} />
      <MonthlyTrendChart series={stats.monthlySeries} dailyData={stats.dailyHeatmapTimeline} />
      <DailyCashflowHeatmap data={stats.dailyHeatmapTimeline} />
      <FixedVsVariableChart data={stats.fixedVsVariable} />
      <TopExpensesChart expenses={stats.topExpenses} />
      <InsightsPanel stats={stats} />

      <button
        onClick={onGoHistory}
        className="w-full rounded-2xl py-3 text-sm font-bold bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 inline-flex items-center justify-center gap-2"
      >
        Ver detalle completo de gastos
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
