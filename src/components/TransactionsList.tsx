import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

type Expense = {
  id?: number;
  name: string;
  value: number;
  category: string;
  date: string | Date;
  isFixed?: number;
};

type Props = {
  expenses: Expense[];
  onDelete: (id: number) => void;
  onEdit?: (expense: Expense) => void;
};

export const TransactionsList = ({ expenses, onDelete, onEdit }: Props) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="surface-card p-5 rounded-2xl">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Sin movimientos recientes</p>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Cuando registres gastos apareceran aqui para un seguimiento rapido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div key={expense.id} className="surface-card p-4 rounded-2xl flex items-center justify-between">
          <button 
            onClick={() => onEdit && expense.id && onEdit(expense)}
            className="flex-1 text-left"
            disabled={expense.isFixed === 1}
          >
            <p className="font-bold text-slate-900 dark:text-slate-100">{expense.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-bold tracking-widest">{new Date(expense.date).toLocaleDateString()} • {expense.category}</p>
          </button>
          <div className="flex items-center gap-3">
            <p className="font-bold text-rose-500">-{formatCOP(expense.value)}</p>
            {onEdit && expense.isFixed !== 1 && (
              <button 
                onClick={() => expense.id && onEdit(expense)} 
                className="text-slate-400 hover:text-teal-500 transition-colors"
                aria-label="Editar gasto"
              >
                <Pencil size={16} />
              </button>
            )}
            <button onClick={() => expense.id && onDelete(expense.id)} className="text-slate-400 hover:text-rose-500 transition-colors" aria-label="Eliminar gasto"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsList;
