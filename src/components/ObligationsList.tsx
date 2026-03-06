import React from 'react';
import { ArrowUpRight, LayoutDashboard, Trash2 } from 'lucide-react';
import { cn } from '../utils/classNames';
import { formatCOP } from '../utils/formatters';

type Obligation = {
  id?: number;
  name: string;
  value: number;
  dueDay?: number;
  category?: string;
  isAverage?: boolean;
  obligationType?: 'fixed' | 'credit';
  isPaid?: boolean;
  actualValue?: number;
  paymentId?: number;
};

export const ObligationsList = ({
  obligations,
  onPay,
  onEdit,
  onDelete
}: {
  obligations: Obligation[];
  onPay: (obl: Obligation) => void;
  onEdit: (obl: Obligation) => void;
  onDelete: (id: number) => void;
}) => {
  if (!obligations || obligations.length === 0) return (
    <div className="text-center py-8 surface-card rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      <p className="text-slate-500 dark:text-slate-300 text-sm">No hay obligaciones registradas</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {obligations.map((obl) => (
        <div key={obl.id} className="surface-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              obl.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400"
            )}>
              {obl.isPaid ? <ArrowUpRight size={18} /> : <LayoutDashboard size={18} />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{obl.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-bold tracking-widest">Vence el dia {obl.dueDay} • {obl.category}</p>
              {obl.isAverage && (
                <p className="text-[9px] text-amber-600 dark:text-amber-400">Promedio</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              {obl.isAverage ? (
                obl.isPaid ? (
                  <div>
                    <p className={cn('font-bold text-emerald-600')}>
                      {formatCOP(obl.actualValue || 0)}
                    </p>
                    <p className="text-[9px] text-slate-400 line-through">
                      {formatCOP(obl.value)}
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-amber-600">
                    ~{formatCOP(obl.value)}
                  </p>
                )
              ) : (
                <p className={cn('font-bold', obl.isPaid ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-300')}>
                  {obl.isPaid ? formatCOP(obl.actualValue || 0) : formatCOP(obl.value)}
                </p>
              )}
            </div>
            {!obl.isPaid ? (
              <button onClick={() => onPay(obl)} className="text-teal-700 dark:text-teal-300 font-bold text-xs bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-lg">Pagar</button>
            ) : (
              <button onClick={() => obl.paymentId && onDelete(obl.paymentId)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
            )}
            <button onClick={() => onEdit(obl)} className="p-2 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/></svg></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ObligationsList;
