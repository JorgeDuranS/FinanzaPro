import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils/classNames';
import { formatCOP } from '../utils/formatters';

type Props = {
  spentPercent: number;
  totalSpent: number;
  totalProjectedObligations?: number;
  totalPaidObligations?: number;
  obligationsPercent?: number;
};

export const ProgressBar = ({ spentPercent, totalSpent, totalProjectedObligations, totalPaidObligations, obligationsPercent }: Props) => {
  const paidPercent = totalProjectedObligations && totalProjectedObligations > 0 && totalPaidObligations
    ? (totalPaidObligations / totalProjectedObligations) * 100
    : 0;

  const displayPercent = obligationsPercent !== undefined ? obligationsPercent : spentPercent;

  return (
    <div className="surface-card p-5 rounded-3xl">
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">Gastos Fijos</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCOP(totalSpent)}</p>
        </div>
        <p className="text-sm font-bold text-teal-700">{Math.round(displayPercent)}%</p>
      </div>
      
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${displayPercent}%` }}
          className={cn(
            "h-full rounded-full flex",
            displayPercent > 90 ? "bg-rose-500" : "bg-indigo-500"
          )}
        >
          {totalPaidObligations !== undefined && totalProjectedObligations && totalProjectedObligations > 0 && (
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${paidPercent}%` }}
              className="h-full bg-teal-500 rounded-full"
            />
          )}
        </motion.div>
      </div>
      
      <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Proyectado
        </span>
        {totalPaidObligations !== undefined && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500" /> Pagado {Math.round(paidPercent)}% ({formatCOP(totalPaidObligations)})
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
