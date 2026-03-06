import React from 'react';
import { motion } from 'motion/react';
import { History } from 'lucide-react';
import type { Expense } from '../db';
import { formatCOP } from '../utils/formatters';

type Reminder = Expense & { dueDay?: number; isPaid?: boolean; actualValue?: number };

type Props = {
  reminders: Reminder[];
  onPay: (r: Reminder) => void;
};

export const RemindersCarousel = ({ reminders, onPay }: Props) => {
  if (!reminders || reminders.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-amber-600">
        <History size={18} />
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Obligaciones Cercanas</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        {reminders.map((obl) => (
          <motion.div
            key={obl.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-shrink-0 w-48 surface-card p-4 rounded-2xl border border-amber-100/70 dark:border-amber-500/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">
                  Dia {obl.dueDay}
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">{obl.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{formatCOP(obl.value)}</p>
            </div>
            <button
              onClick={() => onPay(obl)}
              className="w-full py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
            >
              Pagar Ahora
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RemindersCarousel;
