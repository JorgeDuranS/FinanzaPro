import React from 'react';

export const Header = () => {
  const todayLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="pt-6 px-4">
      <div className="surface-card rounded-3xl px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-teal-700 dark:text-teal-300">Panel financiero</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 leading-tight">FinanzaPro</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Controla ingresos, pagos y ahorro sin friccion.</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize text-right">{todayLabel}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
