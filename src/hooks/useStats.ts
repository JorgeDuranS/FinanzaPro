import { useMemo } from 'react';
import type { Expense, Income, Setting } from '../db';

export type ObligationStatus = Expense & {
  isPaid: boolean;
  actualValue: number;
  paymentId?: number;
};

export type CreditStatus = Expense & {
  paidAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isCompleted: boolean;
  completionDate?: Date;
  principalPerInstallment: number;
  paidInstallments: number;
  remainingInstallments: number;
  isPaid: boolean;
  actualValue: number;
  paymentId?: number;
};

export type CategoryBreakdownItem = {
  category: string;
  total: number;
  count: number;
  percent: number;
};

export type MonthlySeriesItem = {
  key: string;
  label: string;
  income: number;
  spent: number;
  savings: number;
  balance: number;
};

export type FixedVsVariableBreakdown = {
  fixed: number;
  variable: number;
  fixedPercent: number;
  variablePercent: number;
};

export type BudgetHealth = {
  score: number;
  status: 'saludable' | 'atencion' | 'critico';
  message: string;
};

export type DailyHeatmapPoint = {
  day: number;
  projectedAmount: number;
  projectedPaidOnTimeAmount: number;
  actualAmount: number;
  paidFixedAmount: number;
  incomeAmount: number;
  projectedCount: number;
  projectedPaidOnTimeCount: number;
  actualCount: number;
  paidFixedCount: number;
  incomeCount: number;
};

export type DailyHeatmapTimelinePoint = DailyHeatmapPoint & {
  key: string;
  date: Date;
};

export type UseStatsResult = {
  income: number;
  savingsAmount: number;
  totalSpent: number;
  totalFixedCost: number;
  availableBalance: number;
  spentPercent: number;
  obligationsPercent: number;
  monthlyIncomesCount: number;
  reminders: ObligationStatus[];
  obligationsStatus: ObligationStatus[];
  creditsStatus: CreditStatus[];
  variableExpenses: Expense[];
  recentExpenses: Expense[];
  expensesByCategory: CategoryBreakdownItem[];
  monthlySeries: MonthlySeriesItem[];
  dailyHeatmap: DailyHeatmapPoint[];
  dailyHeatmapTimeline: DailyHeatmapTimelinePoint[];
  fixedVsVariable: FixedVsVariableBreakdown;
  topExpenses: Expense[];
  budgetHealth: BudgetHealth;
  monthlyVariation: number;
  totalProjectedObligations: number;
  totalPaidObligations: number;
};

export default function useStats(settings?: Setting, expenses: Expense[] = [], incomes: Income[] = []) {
  return useMemo(() => {
    if (!settings || !expenses || !incomes) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isCurrentMonth = (date: Date) => {
      const d = new Date(date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const monthlyIncomes = incomes.filter(i => isCurrentMonth(i.date));
    const income = monthlyIncomes.reduce((acc, curr) => acc + (curr.amountCop ?? 0), 0);

    const savingsGoalPercent = settings.savingsPercent;
    const savingsAmount = (income * savingsGoalPercent) / 100;

    const fixedObligations = expenses.filter(e => e.isFixed === 1);
    const paidObligationExpenses = expenses.filter(e => e.isFixed === 2);
    const paidFixedExpenses = paidObligationExpenses.filter(e => isCurrentMonth(e.date));
    const variableExpenses = expenses.filter(e => (e.isFixed === 0 || !e.isFixed) && isCurrentMonth(e.date));
    const recentExpenses = expenses.filter(e => (e.isFixed === 0 || !e.isFixed || e.isFixed === 2) && isCurrentMonth(e.date));

    const creditObligations = fixedObligations.filter(obl => obl.obligationType === 'credit');

    const getPaymentsForObligation = (obl: Expense) => (
      expenses
        .filter(e => {
          if (e.isFixed !== 2) return false;
          if (obl.id && e.linkedObligationId) {
            return e.linkedObligationId === obl.id;
          }
          return e.name === obl.name;
        })
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    );

    const getCreditProgress = (obl: Expense) => {
      const totalDebt = Number(obl.totalDebt || 0);
      const installmentCount = Number(obl.installmentCount || 0);
      const principalPerInstallment = totalDebt > 0 && installmentCount > 0
        ? totalDebt / installmentCount
        : 0;
      const payments = getPaymentsForObligation(obl);
      let runningPaid = 0;
      let completionDate: Date | undefined;
      let paidInstallments = 0;

      for (const payment of payments) {
        const paymentKind = payment.paymentKind || 'installment';
        if (paymentKind === 'installment') {
          paidInstallments += 1;
        }

        const principalValue = Number.isFinite(payment.principalPaid)
          ? Number(payment.principalPaid)
          : paymentKind === 'capital'
            ? Number(payment.value || 0)
            : principalPerInstallment > 0
              ? principalPerInstallment
              : Number(payment.value || 0);

        runningPaid += Number(principalValue || 0);
        if (!completionDate && totalDebt > 0 && runningPaid >= totalDebt) {
          completionDate = new Date(payment.date);
        }
      }

      const paidAmount = Math.max(0, runningPaid);
      const rawProgress = totalDebt > 0 ? (paidAmount / totalDebt) * 100 : 0;
      const progressPercent = Math.min(100, Math.max(0, rawProgress));
      const remainingAmount = Math.max(totalDebt - paidAmount, 0);
      const isCompleted = totalDebt > 0 && paidAmount >= totalDebt;
      const remainingInstallments = Math.max((installmentCount || 0) - paidInstallments, 0);

      return {
        paidAmount,
        remainingAmount,
        progressPercent,
        isCompleted,
        completionDate,
        principalPerInstallment,
        paidInstallments,
        remainingInstallments
      };
    };

    const isVisibleCredit = (obl: Expense) => {
      if (obl.obligationType !== 'credit') return false;
      const progress = getCreditProgress(obl);
      if (!progress.isCompleted) return true;
      if (!progress.completionDate) return false;
      return isCurrentMonth(progress.completionDate);
    };

    const visibleObligations = fixedObligations.filter(obl => {
      if (obl.obligationType === 'credit') {
        return isVisibleCredit(obl);
      }

      return true;
    });

    const obligationsStatus: ObligationStatus[] = visibleObligations.map(obl => {
      const payment = paidFixedExpenses.find(p => (obl.id && p.linkedObligationId)
        ? p.linkedObligationId === obl.id
        : p.name === obl.name);
      return {
        ...obl,
        isPaid: !!payment,
        actualValue: payment ? payment.value : obl.value,
        paymentId: payment?.id
      };
    }).sort((a, b) => (a.dueDay || 31) - (b.dueDay || 31));

    const creditsStatus: CreditStatus[] = creditObligations
      .filter(isVisibleCredit)
      .map((credit) => {
        const payment = paidFixedExpenses.find(p => (credit.id && p.linkedObligationId)
          ? p.linkedObligationId === credit.id
          : p.name === credit.name);
        const progress = getCreditProgress(credit);

        return {
          ...credit,
          ...progress,
          isPaid: !!payment,
          actualValue: payment ? payment.value : credit.value,
          paymentId: payment?.id
        };
      }).sort((a, b) => (a.dueDay || 31) - (b.dueDay || 31));

    const totalFixedCost = obligationsStatus.reduce((acc, curr) => acc + (curr.actualValue || 0), 0);
    const totalVariableCost = variableExpenses.reduce((acc, curr) => acc + (curr.value || 0), 0);

    const totalSpent = totalFixedCost + totalVariableCost;
    
    // Calcular variación mensual (solo obligaciones promedio pagadas)
    // Fórmula: promedio - pagado = ahorro (positivo = ahorró, negativo = gastó más)
    const monthlyVariation = obligationsStatus
      .filter(obl => obl.isAverage && obl.isPaid)
      .reduce((acc, obl) => {
        const diff = obl.value - (obl.actualValue || 0);
        return acc + diff;
      }, 0);

    // El saldo disponible incluye la variación mensual como ajuste
    const availableBalance = income - totalSpent - savingsAmount + monthlyVariation;
    const spendBase = income - savingsAmount;
    const rawSpentPercent = spendBase > 0 ? (totalSpent / spendBase) * 100 : income > 0 ? 100 : 0;
    const spentPercent = Math.min(100, Math.max(0, rawSpentPercent));

    // Calcular obligaciones proyectadas y pagadas
    const totalProjectedObligations = obligationsStatus.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const totalPaidObligations = obligationsStatus.reduce((acc, curr) => acc + (curr.isPaid ? (curr.actualValue || 0) : 0), 0);

    const today = now.getDate();
    const reminders = obligationsStatus.filter(obl => {
      if (obl.isPaid) return false;
      if (!obl.dueDay) return false;
      return (obl.dueDay || 0) <= today + 3;
    }).sort((a, b) => (a.dueDay || 0) - (b.dueDay || 0));

    const monthExpenses = expenses.filter(e => (e.isFixed === 0 || !e.isFixed || e.isFixed === 2) && isCurrentMonth(e.date));

    const categoryMap = new Map<string, { total: number; count: number }>();
    for (const exp of monthExpenses) {
      const category = exp.category || 'Sin categoria';
      const current = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: current.total + Number(exp.value || 0),
        count: current.count + 1
      });
    }

    const expensesByCategory: CategoryBreakdownItem[] = Array.from(categoryMap.entries())
      .map(([category, val]) => ({
        category,
        total: val.total,
        count: val.count,
        percent: totalSpent > 0 ? (val.total / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short' });
    const monthlySeries: MonthlySeriesItem[] = Array.from({ length: 12 }, (_, idx) => {
      const offset = 11 - idx;
      const ref = new Date(currentYear, currentMonth - offset, 1);
      const refMonth = ref.getMonth();
      const refYear = ref.getFullYear();

      const monthIncome = incomes
        .filter(i => {
          const d = new Date(i.date);
          return d.getMonth() === refMonth && d.getFullYear() === refYear;
        })
        .reduce((acc, curr) => acc + Number(curr.amountCop || 0), 0);

      const monthVariable = expenses
        .filter(e => {
          const d = new Date(e.date);
          return (e.isFixed === 0 || !e.isFixed) && d.getMonth() === refMonth && d.getFullYear() === refYear;
        })
        .reduce((acc, curr) => acc + Number(curr.value || 0), 0);

      const monthPaidFixed = expenses
        .filter(e => {
          const d = new Date(e.date);
          return e.isFixed === 2 && d.getMonth() === refMonth && d.getFullYear() === refYear;
        })
        .reduce((acc, curr) => acc + Number(curr.value || 0), 0);

      const monthSpent = monthVariable + monthPaidFixed;
      const monthSavings = (monthIncome * savingsGoalPercent) / 100;
      const monthBalance = monthIncome - monthSpent - monthSavings;

      return {
        key: `${refYear}-${refMonth + 1}`,
        label: monthFormatter.format(ref).replace('.', ''),
        income: monthIncome,
        spent: monthSpent,
        savings: monthSavings,
        balance: monthBalance
      };
    });

    const rangeStartDate = new Date(currentYear, currentMonth - 4, 1);
    const rangeEndDate = new Date(currentYear, currentMonth + 2, 0, 23, 59, 59, 999);
    const dailyHeatmapTimelineMap = new Map<string, DailyHeatmapTimelinePoint>();
    const cursorDate = new Date(rangeStartDate);

    while (cursorDate <= rangeEndDate) {
      const d = new Date(cursorDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      dailyHeatmapTimelineMap.set(key, {
        key,
        date: d,
        day: d.getDate(),
        projectedAmount: 0,
        projectedPaidOnTimeAmount: 0,
        actualAmount: 0,
        paidFixedAmount: 0,
        incomeAmount: 0,
        projectedCount: 0,
        projectedPaidOnTimeCount: 0,
        actualCount: 0,
        paidFixedCount: 0,
        incomeCount: 0
      });

      cursorDate.setDate(cursorDate.getDate() + 1);
    }

    const getHeatmapPoint = (date: Date) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const point = dailyHeatmapTimelineMap.get(key);
      if (!point) {
        throw new Error(`Invalid date for heatmap: ${key}`);
      }

      return point;
    };

    for (let monthOffset = -4; monthOffset <= 1; monthOffset += 1) {
      const monthRef = new Date(currentYear, currentMonth + monthOffset, 1);
      const monthYear = monthRef.getFullYear();
      const monthIndex = monthRef.getMonth();
      const daysInRefMonth = new Date(monthYear, monthIndex + 1, 0).getDate();

      for (const obligation of visibleObligations) {
        const dueDay = Number(obligation.dueDay || 0);
        if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > daysInRefMonth) {
          continue;
        }

        const dueDate = new Date(monthYear, monthIndex, dueDay);
        const point = getHeatmapPoint(dueDate);
        point.projectedAmount += Number(obligation.value || 0);
        point.projectedCount += 1;

        const paidOnDueDate = paidObligationExpenses.filter((payment) => {
          const paymentDate = new Date(payment.date);
          const isSameMonth = paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === monthYear;
          const isSameDay = paymentDate.getDate() === dueDay;

          if (!isSameMonth || !isSameDay) {
            return false;
          }

          if (obligation.id && payment.linkedObligationId) {
            return payment.linkedObligationId === obligation.id;
          }

          return payment.name === obligation.name;
        });

        const paidOnTimeAmount = paidOnDueDate.reduce((acc, payment) => acc + Number(payment.value || 0), 0);
        if (paidOnTimeAmount > 0) {
          point.projectedPaidOnTimeAmount += paidOnTimeAmount;
          point.projectedPaidOnTimeCount += 1;
        }
      }
    }

    for (const expense of expenses) {
      const expenseDate = new Date(expense.date);
      if (expenseDate < rangeStartDate || expenseDate > rangeEndDate) {
        continue;
      }

      const point = dailyHeatmapTimelineMap.get(
        `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`
      );
      if (!point) continue;

      if (expense.isFixed === 2) {
        point.paidFixedAmount += Number(expense.value || 0);
        point.paidFixedCount += 1;
        continue;
      }

      if (expense.isFixed === 0 || !expense.isFixed) {
        point.actualAmount += Number(expense.value || 0);
        point.actualCount += 1;
      }
    }

    for (const incomeItem of incomes) {
      const incomeDate = new Date(incomeItem.date);
      if (incomeDate < rangeStartDate || incomeDate > rangeEndDate) {
        continue;
      }

      const point = dailyHeatmapTimelineMap.get(
        `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}-${String(incomeDate.getDate()).padStart(2, '0')}`
      );
      if (!point) continue;

      point.incomeAmount += Number(incomeItem.amountCop || 0);
      point.incomeCount += 1;
    }

    const dailyHeatmapTimeline = Array.from(dailyHeatmapTimelineMap.values())
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));

    const dailyHeatmap = dailyHeatmapTimeline
      .filter((point) => {
        const d = new Date(point.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .map(({ day, projectedAmount, projectedPaidOnTimeAmount, actualAmount, paidFixedAmount, incomeAmount, projectedCount, projectedPaidOnTimeCount, actualCount, paidFixedCount, incomeCount }) => ({
        day,
        projectedAmount,
        projectedPaidOnTimeAmount,
        actualAmount,
        paidFixedAmount,
        incomeAmount,
        projectedCount,
        projectedPaidOnTimeCount,
        actualCount,
        paidFixedCount,
        incomeCount
      }));

    const fixedVsVariable: FixedVsVariableBreakdown = {
      fixed: totalFixedCost,
      variable: totalVariableCost,
      fixedPercent: income > 0 ? (totalFixedCost / income) * 100 : 0,
      variablePercent: income > 0 ? (totalVariableCost / income) * 100 : 0
    };

    const topExpenses = [...monthExpenses]
      .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
      .slice(0, 5);

    let score = 100;
    if (income <= 0) {
      score = 20;
    } else {
      const balanceRatio = availableBalance / Math.max(income, 1);
      if (balanceRatio < 0) score -= 35;
      else if (balanceRatio < 0.1) score -= 20;
      else if (balanceRatio < 0.2) score -= 10;

      if (spentPercent > 90) score -= 25;
      else if (spentPercent > 75) score -= 15;
      else if (spentPercent > 60) score -= 8;

      if (reminders.length >= 3) score -= 10;
      else if (reminders.length > 0) score -= 5;
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    const budgetHealth: BudgetHealth = finalScore >= 75
      ? {
        score: finalScore,
        status: 'saludable',
        message: 'Tu presupuesto esta en buen estado para este mes.'
      }
      : finalScore >= 45
        ? {
          score: finalScore,
          status: 'atencion',
          message: 'Hay presion en tus gastos. Conviene ajustar algunas categorias.'
        }
        : {
          score: finalScore,
          status: 'critico',
          message: 'Tu flujo mensual esta comprometido. Revisa gastos y pagos urgentes.'
        };

    const result: UseStatsResult = {
      income,
      savingsAmount,
      totalSpent,
      totalFixedCost,
      availableBalance,
      spentPercent,
      obligationsPercent: income > 0 ? (totalFixedCost / income) * 100 : 0,
      monthlyIncomesCount: monthlyIncomes.length,
      reminders,
      obligationsStatus,
      creditsStatus,
      variableExpenses,
      recentExpenses,
      expensesByCategory,
      monthlySeries,
      dailyHeatmap,
      dailyHeatmapTimeline,
      fixedVsVariable,
      topExpenses,
      budgetHealth,
      monthlyVariation,
      totalProjectedObligations,
      totalPaidObligations
    };

    return result;
  }, [settings, expenses, incomes]);
}

