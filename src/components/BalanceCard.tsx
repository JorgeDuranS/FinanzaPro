import React from 'react';
import { cn } from '../utils/classNames';
import { formatCOP } from '../utils/formatters';

type Stats = {
  availableBalance: number;
  savingsAmount: number;
};

export const BalanceCard = ({ stats }: { stats: Stats }) => {
  const { availableBalance, savingsAmount } = stats;
  return (
    <div className={cn(
      "p-6 rounded-3xl shadow-lg transition-colors duration-500",
      availableBalance > 0 ? "bg-indigo-600 text-white" : "bg-rose-600 text-white"
    )}>
      <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Disponible</p>
      <h2 className="text-4xl font-display font-bold mb-4">{formatCOP(availableBalance)}</h2>

      <div className="flex justify-between items-center pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            availableBalance > 0 ? "bg-emerald-400" : "bg-amber-400"
          )} />
          <span className="text-xs font-medium uppercase tracking-wider">
            {availableBalance > 0 ? "Estado: Saludable" : "Estado: Crítico"}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase opacity-70">Meta de Ahorro</p>
          <p className="text-sm font-bold">{formatCOP(savingsAmount)}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
