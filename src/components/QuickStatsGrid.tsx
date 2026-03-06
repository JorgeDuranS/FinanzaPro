import React from 'react';
import { TrendingUp, PiggyBank } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

type Stats = {
  income: number;
  monthlyIncomesCount: number;
  savingsAmount: number;
};

export const QuickStatsGrid = ({ stats }: { stats: Stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="surface-card p-4 rounded-2xl">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 mb-3">
          <TrendingUp size={18} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ingresos (Mes)</p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.income)}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-300">{stats.monthlyIncomesCount} pagos recibidos</p>
      </div>
      <div className="surface-card p-4 rounded-2xl">
        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 mb-3">
          <PiggyBank size={18} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ahorro</p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.savingsAmount)}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-300">Meta mensual recomendada</p>
      </div>
    </div>
  );
};

export default QuickStatsGrid;
