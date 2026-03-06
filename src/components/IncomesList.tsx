import React from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

type Income = {
  id?: number;
  amountCop: number;
  date: string | Date;
  type: 'salary' | 'extra';
  description: string;
};

export const IncomesList = ({ incomes, onDelete }: { incomes: Income[]; onDelete: (id: number) => void }) => {
  if (!incomes || incomes.length === 0) return (
    <div className="text-center py-12 surface-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      <p className="text-slate-500 dark:text-slate-300">No has registrado ingresos aun</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {incomes.slice().reverse().map((income) => (
        <div key={income.id} className="surface-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{income.description || 'Ingreso'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-bold tracking-widest">{income.type === 'salary' ? 'Sueldo' : 'Extra'} • {new Date(income.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-bold text-emerald-600">+{formatCOP(income.amountCop)}</p>
            <button onClick={() => income.id && onDelete(income.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IncomesList;
