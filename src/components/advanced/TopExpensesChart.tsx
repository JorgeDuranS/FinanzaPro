import React from 'react';
import type { Expense } from '../../db';
import { formatCOP } from '../../utils/formatters';

type Props = {
  expenses: Expense[];
};

export default function TopExpensesChart({ expenses }: Props) {
  const maxValue = Math.max(1, ...expenses.map((expense) => Number(expense.value || 0)));

  return (
    <section className="surface-card p-5 rounded-3xl space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Impacto</p>
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Top gastos del mes</h3>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Registra gastos para visualizar tus principales consumos del mes.</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense, index) => {
            const width = (Number(expense.value || 0) / maxValue) * 100;
            return (
              <article key={expense.id ?? `${expense.name}-${index}`} className="space-y-1 rounded-2xl bg-slate-50/75 dark:bg-slate-800/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="h-6 w-6 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 grid place-items-center">{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{expense.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600">{formatCOP(expense.value)}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{width.toFixed(0)}% del max</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.max(6, width)}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
