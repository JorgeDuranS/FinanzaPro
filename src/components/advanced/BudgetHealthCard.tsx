import React from 'react';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { BudgetHealth } from '../../hooks/useStats';
import { cn } from '../../utils/classNames';

type Props = {
  health: BudgetHealth;
};

export default function BudgetHealthCard({ health }: Props) {
  const colorClass = health.status === 'saludable'
    ? 'text-emerald-600 dark:text-emerald-300'
    : health.status === 'atencion'
      ? 'text-amber-600 dark:text-amber-300'
      : 'text-rose-600 dark:text-rose-300';

  const ringColor = health.status === 'saludable'
    ? '#10b981'
    : health.status === 'atencion'
      ? '#f59e0b'
      : '#f43f5e';

  const icon = health.status === 'saludable'
    ? <ShieldCheck size={18} />
    : health.status === 'atencion'
      ? <Activity size={18} />
      : <AlertTriangle size={18} />;

  return (
    <section className="premium-surface p-5 rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Salud financiera</p>
          <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Estado del presupuesto</h3>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em]', colorClass)}>
          {icon}
          {health.status}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-full grid place-items-center text-xl font-display font-bold text-slate-900 dark:text-slate-100"
          style={{
            background: `conic-gradient(${ringColor} ${health.score * 3.6}deg, rgba(148, 163, 184, 0.2) 0deg)`
          }}
        >
          <span className="h-14 w-14 rounded-full bg-white/95 dark:bg-slate-900 grid place-items-center">{health.score}</span>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{health.message}</p>
          <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${health.score}%`, backgroundColor: ringColor }} />
          </div>
        </div>
      </div>
    </section>
  );
}
