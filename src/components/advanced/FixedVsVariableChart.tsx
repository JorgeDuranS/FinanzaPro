import React from 'react';
import type { FixedVsVariableBreakdown } from '../../hooks/useStats';
import { formatCOP } from '../../utils/formatters';

type Props = {
  data: FixedVsVariableBreakdown;
};

export default function FixedVsVariableChart({ data }: Props) {
  const fixedGoal = 60;
  const fixedWidth = Math.min(100, Math.max(0, data.fixedPercent));
  const variableWidth = Math.min(100, Math.max(0, 100 - fixedWidth));

  return (
    <section className="surface-card p-5 rounded-3xl space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Composicion</p>
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Fijos vs variables</h3>
      </div>

      <div className="relative h-3 w-full rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-700/80">
        <span
          className="absolute top-[-4px] z-10 h-5 w-[2px] bg-amber-500/90"
          style={{ left: `${fixedGoal}%` }}
          aria-hidden
        />
        <div className="flex h-full w-full">
          <div
            className="h-full shrink-0 bg-cyan-600"
            style={{ width: `${fixedWidth}%` }}
          />
          <div
            className="h-full shrink-0 bg-violet-500"
            style={{ width: `${variableWidth}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">Referencia sugerida: 60% fijos / 40% variables.</p>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 p-3">
          <p className="font-bold text-cyan-700 dark:text-cyan-300">Gasto fijo</p>
          <p className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">{formatCOP(data.fixed)}</p>
          <p className="text-slate-500 dark:text-slate-400">{data.fixedPercent.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 p-3">
          <p className="font-bold text-violet-700 dark:text-violet-300">Gasto variable</p>
          <p className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">{formatCOP(data.variable)}</p>
          <p className="text-slate-500 dark:text-slate-400">{data.variablePercent.toFixed(1)}%</p>
        </div>
      </div>
    </section>
  );
}
