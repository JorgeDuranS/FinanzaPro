import React, { useState } from 'react';
import { PiggyBank, ChevronDown, Moon, Sun, SlidersHorizontal, Database } from 'lucide-react';
import type { Setting } from '../db';
import { formatCOP } from '../utils/formatters';
import { cn } from '../utils/classNames';
import MaintenanceCard from './MaintenanceCard';

type Props = {
  settings: Setting;
  stats: {
    income: number;
    totalSpent: number;
    savingsAmount: number;
    obligationsStatus: Array<{ value: number }>;
  };
  onUpdateSavings: (v: number) => void;
  onUpdateTheme: (mode: 'light' | 'dark') => void;
  onSeed: () => void;
  onClear: () => void;
};

export default function SettingsPanel({ settings, stats, onUpdateSavings, onUpdateTheme, onSeed, onClear }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const currentTheme = settings.themeMode ?? 'light';

  return (
    <div className="space-y-4">
      <div className="surface-card p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={16} className="text-teal-600 dark:text-teal-300" />
          <h4 className="font-bold text-slate-900 dark:text-slate-100">Apariencia y objetivos</h4>
        </div>

        <div className="mb-5 space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tema de la interfaz</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateTheme('light')}
              className={cn('chip-button flex items-center justify-center gap-2', currentTheme === 'light' && 'chip-button-active')}
            >
              <Sun size={14} />
              Claro
            </button>
            <button
              type="button"
              onClick={() => onUpdateTheme('dark')}
              className={cn('chip-button flex items-center justify-center gap-2', currentTheme === 'dark' && 'chip-button-active')}
            >
              <Moon size={14} />
              Oscuro
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Meta de ahorro (%)</label>
            <span className="text-teal-700 dark:text-teal-300 font-bold">{settings.savingsPercent}%</span>
          </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={settings.savingsPercent}
              onChange={(e) => onUpdateSavings(Number(e.target.value))}
              className="w-full h-2 bg-slate-200/60 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/70 dark:border-slate-700">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <PiggyBank size={20} className="text-teal-600 dark:text-teal-300" />
            <p className="text-sm">
              Tu meta de ahorro actual es de <span className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.savingsAmount)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="surface-card p-6 rounded-3xl">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Resumen de planificación</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Ingresos reales (mes):</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.income)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Gastos fijos base:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.obligationsStatus.reduce((acc, curr) => acc + curr.value, 0))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Meta de ahorro:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(stats.savingsAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-900 dark:text-slate-100 font-bold">Presupuesto variable:</span>
            <span className="font-bold text-teal-700 dark:text-teal-300">{formatCOP(stats.income - stats.totalSpent - stats.savingsAmount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setAdvancedOpen(v => !v)}
          className="w-full flex justify-between items-center surface-card p-4 rounded-2xl"
          aria-expanded={advancedOpen}
        >
          <div className="flex items-start gap-3 text-left">
            <Database size={18} className="text-slate-500 dark:text-slate-300 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">Mantenimiento de datos</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Exportar, importar o limpiar datos</div>
            </div>
          </div>
          <ChevronDown className={cn('text-slate-400 dark:text-slate-300 transition-transform', advancedOpen && 'rotate-180')} />
        </button>

        {advancedOpen && (
          <div className="mt-3 surface-card p-4 rounded-2xl">
            <MaintenanceCard onSeed={onSeed} onClear={onClear} />
          </div>
        )}
      </div>
    </div>
  );
}
