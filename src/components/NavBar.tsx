import React from 'react';
import NavButton from './NavButton';
import { LayoutDashboard, ArrowUpRight, History, Settings as SettingsIcon } from 'lucide-react';

export default function NavBar({ activeTab, setActiveTab }: { activeTab: 'dashboard' | 'history' | 'incomes' | 'settings'; setActiveTab: (tab: 'dashboard' | 'history' | 'incomes' | 'settings') => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 safe-bottom z-30">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl px-4 py-3 flex justify-between items-center shadow-lg border border-slate-200 dark:border-slate-700">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard size={22} />}
          label="Inicio"
        />
        <NavButton 
          active={activeTab === 'incomes'} 
          onClick={() => setActiveTab('incomes')}
          icon={<ArrowUpRight size={22} />}
          label="Ingresos"
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          icon={<History size={22} />}
          label="Gastos"
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
          icon={<SettingsIcon size={22} />}
          label="Ajustes"
        />
      </div>
    </nav>
  );
}
