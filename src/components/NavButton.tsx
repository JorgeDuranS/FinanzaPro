import React from 'react';
import { cn } from '../utils/classNames';

export default function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-w-16 rounded-2xl px-2 py-1.5 flex flex-col items-center gap-1 transition-all duration-200',
        active
          ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200 shadow-[inset_0_0_0_1px_rgba(15,118,110,0.18)]'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
    </button>
  );
}
