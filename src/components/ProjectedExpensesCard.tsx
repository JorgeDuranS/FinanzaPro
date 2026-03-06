import React from 'react';
import { Target } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

type Props = {
  totalProjected: number;
};

export const ProjectedExpensesCard = ({ totalProjected }: Props) => {
  return (
    <div className="surface-card p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Target size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Total Proyectado</p>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCOP(totalProjected)}</p>
    </div>
  );
};

export default ProjectedExpensesCard;
