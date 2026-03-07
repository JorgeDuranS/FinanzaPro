import React from 'react';
import { CheckCircle2, CreditCard, Trash2 } from 'lucide-react';
import { cn } from '../utils/classNames';
import { formatCOP } from '../utils/formatters';
import type { Expense } from '../db';

type CreditItem = Expense & {
  paidAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isCompleted: boolean;
};

type Props = {
  credits: CreditItem[];
  onSelect: (credit: CreditItem) => void;
  onDelete: (id: number) => void;
};

export default function CreditsProgressCard({ credits, onSelect, onDelete }: Props) {
  if (!credits || credits.length === 0) return null;

  return (
    <section className="surface-card p-5 rounded-3xl space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard size={18} className="text-sky-600" />
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Estado de creditos</h3>
      </div>

      <div className="space-y-3">
        {credits.map((credit) => (
          <article
            key={credit.id ?? credit.name}
            className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3 cursor-pointer hover:bg-slate-100/90 dark:hover:bg-slate-700/60 transition-colors"
            onClick={() => onSelect(credit)}
          >
            <div className="flex justify-between items-center gap-3 mb-2">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{credit.name}</p>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md',
                credit.isCompleted
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
              )}>
                {credit.isCompleted ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> Completado</span> : 'En curso'}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  credit.isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                )}
                style={{ width: `${credit.progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-300">{formatCOP(credit.paidAmount)} / {formatCOP(credit.totalDebt || 0)}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-200">{credit.progressPercent.toFixed(0)}%</span>
                <button
                  onClick={(e) => { e.stopPropagation(); credit.id && onDelete(credit.id); }}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  aria-label="Eliminar crédito"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {!credit.isCompleted ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Pendiente: {formatCOP(credit.remainingAmount)}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
