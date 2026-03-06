import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils/classNames';
import { formatCOP } from '../utils/formatters';

type Props = {
  variablePercent: number;
  totalVariable: number;
  income: number;
};

export const VariableExpensesCard = ({ variablePercent, totalVariable, income }: Props) => {
  const budget = income - (income * 0.6); // 40% de los ingresos como presupuesto variable de referencia
  const referencePercent = 40;
  const displayPercent = Math.min(100, Math.max(0, variablePercent));
  const isOverReference = variablePercent > referencePercent;

  return (
    <div className="surface-card p-5 rounded-3xl">
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">Gastos Variables</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCOP(totalVariable)}</p>
        </div>
        <p className={cn('text-sm font-bold', isOverReference ? 'text-amber-600 dark:text-amber-400' : 'text-teal-700')}>
          {Math.round(displayPercent)}%
        </p>
      </div>
      
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${displayPercent}%` }}
          className={cn(
            "h-full rounded-full",
            isOverReference ? "bg-amber-500" : "bg-violet-500"
          )}
        />
      </div>
      
      <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-500" /> Ejecutado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Referencia: {referencePercent}%
        </span>
      </div>
    </div>
  );
};

export default VariableExpensesCard;
