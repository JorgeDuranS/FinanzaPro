import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, Receipt, Landmark, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, type Expense, type Income } from './db';
import dbService from './services/dbService';
import useStats from './hooks/useStats';
import Header from './components/Header';
import AddExpenseForm from './components/forms/AddExpenseForm';
import BalanceCard from './components/BalanceCard';
import RemindersCarousel from './components/RemindersCarousel';
import ProgressBar from './components/ProgressBar';
import QuickStatsGrid from './components/QuickStatsGrid';
import CreditsProgressCard from './components/CreditsProgressCard';
import VariableExpensesCard from './components/VariableExpensesCard';
import ProjectedExpensesCard from './components/ProjectedExpensesCard';
import AddIncomeForm from './components/forms/AddIncomeForm';
import PayObligationForm from './components/forms/PayObligationForm';
import ManageFixedExpenseForm from './components/forms/ManageFixedExpenseForm';
import TransactionsList from './components/TransactionsList';
// MaintenanceCard is included inside `SettingsPanel` so we don't import it here to avoid duplicates
import IncomesList from './components/IncomesList';
import ObligationsList from './components/ObligationsList';
import SettingsPanel from './components/SettingsPanel';
import NavBar from './components/NavBar';
import Fab from './components/Fab';
import AdvancedDashboard from './components/advanced/AdvancedDashboard';

// Utilities and components are imported from utils/components

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'incomes' | 'settings'>('dashboard');
  const [dashboardView, setDashboardView] = useState<'resumen' | 'avanzado'>('resumen');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'expense' | 'income' | 'pay_obligation' | 'manage_fixed' | 'manage_credit' | 'edit_expense'>('expense');
  const [selectedObligation, setSelectedObligation] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    if (diff > 100) {
      setIsModalOpen(false);
    }
  };

  // Database queries
  const settings = useLiveQuery(() => db.settings.get('config'));
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const incomes = useLiveQuery(() => db.incomes.toArray());

  useEffect(() => {
    dbService.initialize().then(() => setIsInitialized(true));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if ((settings?.themeMode ?? 'light') === 'dark') {
      root.classList.add('dark');
      return;
    }

    root.classList.remove('dark');
  }, [settings?.themeMode]);

  useEffect(() => {
    if (isModalOpen || (activeTab !== 'dashboard' && activeTab !== 'history')) {
      setIsFabMenuOpen(false);
    }
  }, [isModalOpen, activeTab]);

  // Calculations moved to useStats hook
  const stats = useStats(settings, expenses || [], incomes || []);

  if (!isInitialized || !stats) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-500 rounded-full mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando FinanzaPro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-teal-200/35 blur-3xl" />
      <div className="pointer-events-none absolute top-52 -right-20 h-56 w-56 rounded-full bg-slate-300/35 blur-3xl" />
      {/* Header */}
      <Header />

      <main className="px-5 pt-4 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="segment-control rounded-2xl p-1.5 inline-flex gap-1">
                <button
                  onClick={() => setDashboardView('resumen')}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                    dashboardView === 'resumen'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Resumen
                </button>
                <button
                  onClick={() => setDashboardView('avanzado')}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                    dashboardView === 'avanzado'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Avanzado
                </button>
              </div>

              {dashboardView === 'resumen' ? (
                <>
                  {/* Balance Card */}
                  <BalanceCard stats={{ availableBalance: stats.availableBalance, savingsAmount: stats.savingsAmount }} />

                  {/* Reminders Section */}
                  <RemindersCarousel
                    reminders={stats.reminders}
                    onPay={(obl) => { setSelectedObligation(obl); setModalType('pay_obligation'); setIsModalOpen(true); }}
                  />

                  {/* Progress Bar */}
                  <ProgressBar 
                    spentPercent={stats.spentPercent} 
                    totalSpent={stats.totalFixedCost}
                    totalProjectedObligations={stats.totalProjectedObligations}
                    totalPaidObligations={stats.totalPaidObligations}
                    obligationsPercent={stats.obligationsPercent}
                  />

                  {/* Variable Expenses Card */}
                  <VariableExpensesCard 
                    variablePercent={stats.fixedVsVariable.variablePercent}
                    totalVariable={stats.fixedVsVariable.variable}
                    income={stats.income}
                  />

                  {/* Quick Stats Grid */}
                  <QuickStatsGrid stats={{ income: stats.income, monthlyIncomesCount: stats.monthlyIncomesCount, savingsAmount: stats.savingsAmount }} />

                  <CreditsProgressCard
                    credits={stats.creditsStatus}
                    onSelect={(credit) => { setSelectedObligation(credit); setModalType('pay_obligation'); setIsModalOpen(true); }}
                  />

                  {/* Recent Transactions Preview */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Gastos Recientes</h3>
                      <button
                        onClick={() => setActiveTab('history')}
                        className="text-teal-700 dark:text-teal-300 text-sm font-semibold"
                      >
                        Ver Todo
                      </button>
                    </div>
                    <div className="space-y-3">
                        <TransactionsList 
                          expenses={stats.recentExpenses.slice(-3).reverse()} 
                          onDelete={(id) => dbService.deleteExpense(id)} 
                          onEdit={(expense) => { setSelectedExpense(expense); setModalType('edit_expense'); setIsModalOpen(true); }}
                        />
                    </div>
                  </div>
                </>
              ) : (
                <AdvancedDashboard stats={stats} onGoHistory={() => setActiveTab('history')} />
              )}
            </motion.div>
          )}

          {activeTab === 'incomes' && (
            <motion.div
              key="incomes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">Ingresos Recibidos</h3>
                <button onClick={() => { setModalType('income'); setIsModalOpen(true); }} className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><Plus size={20} /></button>
              </div>

              <IncomesList incomes={incomes} onDelete={(id) => dbService.deleteIncome(id)} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">Estado de Obligaciones</h3>
              
              <div className="space-y-3">
                <ObligationsList
                  obligations={stats.obligationsStatus}
                  onPay={(obl) => { setSelectedObligation(obl); setModalType('pay_obligation'); setIsModalOpen(true); }}
                  onEdit={(obl) => {
                    setSelectedObligation(obl);
                    setModalType(obl.obligationType === 'credit' ? 'manage_credit' : 'manage_fixed');
                    setIsModalOpen(true);
                  }}
                  onDelete={(id) => dbService.deleteExpense(id)}
                />
              </div>

              <ProjectedExpensesCard totalProjected={stats.totalProjectedObligations} />

              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 pt-4">Gastos Recientes</h3>
              <div className="space-y-3">
                <TransactionsList 
                  expenses={stats.recentExpenses.slice().reverse()} 
                  onDelete={(id) => dbService.deleteExpense(id)} 
                  onEdit={(expense) => { setSelectedExpense(expense); setModalType('edit_expense'); setIsModalOpen(true); }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">Configuración</h3>
              
              {/* Settings content is rendered by SettingsPanel (avoids duplicate controls) */}

              <SettingsPanel
                settings={settings}
                stats={stats}
                onUpdateSavings={(v) => dbService.updateSettings({ savingsPercent: v })}
                onUpdateTheme={(mode) => dbService.updateSettings({ themeMode: mode })}
                onSeed={async () => { await dbService.updateSettings({ isCleaned: false }); await dbService.seed(); setIsInitialized(true); }}
                onClear={async () => { await dbService.clearAll(); setIsInitialized(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {(activeTab === 'dashboard' || activeTab === 'history') && (
        <>
          <AnimatePresence>
            {isFabMenuOpen && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFabMenuOpen(false)}
                  className="fixed inset-0 z-20"
                  aria-label="Cerrar acciones rápidas"
                />
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="fixed right-6 bottom-44 z-30 flex flex-col gap-2 items-end"
                >
                  <button
                    onClick={() => { setModalType('expense'); setIsModalOpen(true); }}
                    className="bg-white dark:bg-slate-800 shadow-lg chip-button chip-button-active px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <Receipt size={14} /> Nuevo gasto
                  </button>
                  <button
                    onClick={() => { setSelectedObligation(null); setModalType('manage_fixed'); setIsModalOpen(true); }}
                    className="bg-white dark:bg-slate-800 shadow-lg chip-button px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <Landmark size={14} /> Nueva obligacion
                  </button>
                  <button
                    onClick={() => { setSelectedObligation(null); setModalType('manage_credit'); setIsModalOpen(true); }}
                    className="bg-white dark:bg-slate-800 shadow-lg chip-button px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <CreditCard size={14} /> Nuevo credito
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <Fab onClick={() => setIsFabMenuOpen((v) => !v)} ariaLabel="Acciones de gastos">
            <motion.div animate={{ rotate: isFabMenuOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus size={28} />
            </motion.div>
          </Fab>
        </>
      )}

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              ref={modalRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="fixed bottom-0 left-0 right-0 surface-card rounded-t-[40px] p-8 z-50 shadow-2xl safe-bottom max-w-md mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
                  {modalType === 'expense' ? 'Nuevo Gasto' : 
                   modalType === 'edit_expense' ? 'Editar Gasto' :
                   modalType === 'income' ? 'Nuevo Ingreso' : 
                   modalType === 'pay_obligation'
                     ? (selectedObligation?.obligationType === 'credit' ? 'Detalle de Crédito' : 'Pagar Obligación')
                     : modalType === 'manage_credit'
                     ? (selectedObligation ? 'Editar Crédito' : 'Nuevo Crédito')
                     : selectedObligation ? 'Editar Obligación' : 'Nueva Obligación'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                  <X size={20} />
                </button>
              </div>

              {modalType === 'expense' ? (
                <AddExpenseForm onComplete={() => { setIsModalOpen(false); setSelectedExpense(null); }} />
              ) : modalType === 'edit_expense' ? (
                <AddExpenseForm editExpense={selectedExpense} onComplete={() => { setIsModalOpen(false); setSelectedExpense(null); }} />
              ) : modalType === 'income' ? (
                <AddIncomeForm onComplete={() => setIsModalOpen(false)} />
              ) : modalType === 'pay_obligation' ? (
                <PayObligationForm obligation={selectedObligation!} onComplete={() => setIsModalOpen(false)} />
              ) : (
                <ManageFixedExpenseForm
                  obligation={selectedObligation}
                  mode={modalType === 'manage_credit' ? 'credit' : 'fixed'}
                  onComplete={() => setIsModalOpen(false)}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// NavButton extracted to src/components/NavButton.tsx

// `AddExpenseForm` component is extracted to `src/components/forms/AddExpenseForm.tsx`

// `AddIncomeForm` extracted to `src/components/forms/AddIncomeForm.tsx`
