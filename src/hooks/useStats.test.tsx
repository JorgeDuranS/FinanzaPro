import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import useStats from './useStats';

const TestComponent = ({ settings, expenses, incomes }: any) => {
  const stats = useStats(settings, expenses, incomes);
  return <div data-testid="out">{JSON.stringify(stats)}</div>;
};

afterEach(() => {
  vi.useRealTimers();
});

describe('useStats', () => {
  it('computes basic totals correctly', () => {
    const settings = { id: 'config', savingsPercent: 10 };
    const now = new Date();
    const incomes = [
      { id: 1, amountCop: 2000000, date: now.toISOString(), type: 'salary', description: 'Sueldo' }
    ];
    const expenses: any[] = [
      { id: 1, name: 'Compra', value: 500000, category: 'Varios', date: now.toISOString(), isFixed: 0 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    expect(stats.income).toBe(2000000);
    expect(stats.totalSpent).toBe(500000);
    expect(stats.savingsAmount).toBe((2000000 * 10) / 100);
    expect(stats.availableBalance).toBe(stats.income - stats.totalSpent - stats.savingsAmount);
  });

  it('marks obligations as paid when a paid record exists', () => {
    const settings = { id: 'config', savingsPercent: 10 };
    const now = new Date();
    const incomes: any[] = [];
    const expenses: any[] = [
      { id: 1, name: 'Internet', value: 155000, category: 'Servicios', date: now.toISOString(), isFixed: 1, dueDay: now.getDate() },
      { id: 2, name: 'Internet', value: 155000, category: 'Servicios', date: now.toISOString(), isFixed: 2 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    const obl = stats.obligationsStatus.find((o: any) => o.name === 'Internet');
    expect(obl.isPaid).toBe(true);
    expect(stats.reminders.length).toBe(0);
  });

  it('computes credit progress using linked payments and clamps values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'));

    const settings = { id: 'config', savingsPercent: 10 };
    const incomes = [
      { id: 1, amountCop: 3000000, date: '2026-03-01T12:00:00.000Z', type: 'salary', description: 'Sueldo' }
    ];
    const expenses: any[] = [
      {
        id: 10,
        name: 'Tarjeta Visa',
        value: 200000,
        category: 'Finanzas',
        date: '2026-01-01T12:00:00.000Z',
        isFixed: 1,
        dueDay: 15,
        obligationType: 'credit',
        creditPaymentMode: 'interest_percent',
        totalDebt: 1000000,
        interestPercent: 20
      },
      { id: 11, name: 'Tarjeta Visa', value: 200000, category: 'Finanzas', date: '2026-01-15T12:00:00.000Z', isFixed: 2, linkedObligationId: 10 },
      { id: 12, name: 'Tarjeta Visa', value: 900000, category: 'Finanzas', date: '2026-03-05T12:00:00.000Z', isFixed: 2, linkedObligationId: 10 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    const credit = stats.creditsStatus.find((c: any) => c.name === 'Tarjeta Visa');
    expect(credit).toBeTruthy();
    expect(credit.paidAmount).toBe(1100000);
    expect(credit.remainingAmount).toBe(0);
    expect(credit.progressPercent).toBe(100);
    expect(credit.isCompleted).toBe(true);
  });

  it('hides completed credits after the completion month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));

    const settings = { id: 'config', savingsPercent: 10 };
    const incomes = [
      { id: 1, amountCop: 3000000, date: '2026-04-01T12:00:00.000Z', type: 'salary', description: 'Sueldo' }
    ];
    const expenses: any[] = [
      {
        id: 20,
        name: 'Credito Moto',
        value: 150000,
        category: 'Transporte',
        date: '2026-01-01T12:00:00.000Z',
        isFixed: 1,
        dueDay: 9,
        obligationType: 'credit',
        creditPaymentMode: 'fixed_value',
        totalDebt: 450000
      },
      { id: 21, name: 'Credito Moto', value: 150000, category: 'Transporte', date: '2026-01-09T12:00:00.000Z', isFixed: 2, linkedObligationId: 20 },
      { id: 22, name: 'Credito Moto', value: 150000, category: 'Transporte', date: '2026-02-09T12:00:00.000Z', isFixed: 2, linkedObligationId: 20 },
      { id: 23, name: 'Credito Moto', value: 150000, category: 'Transporte', date: '2026-03-09T12:00:00.000Z', isFixed: 2, linkedObligationId: 20 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    expect(stats.creditsStatus.find((c: any) => c.name === 'Credito Moto')).toBeUndefined();
    expect(stats.obligationsStatus.find((o: any) => o.name === 'Credito Moto')).toBeUndefined();
  });

  it('builds category breakdown and top expenses for advanced dashboard', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));

    const settings = { id: 'config', savingsPercent: 10 };
    const incomes = [
      { id: 1, amountCop: 1000000, date: '2026-03-01T12:00:00.000Z', type: 'salary', description: 'Sueldo' }
    ];
    const expenses: any[] = [
      { id: 1, name: 'Internet', value: 300000, category: 'Servicios', date: '2026-03-05T12:00:00.000Z', isFixed: 1, dueDay: 8 },
      { id: 2, name: 'Internet', value: 300000, category: 'Servicios', date: '2026-03-07T12:00:00.000Z', isFixed: 2, linkedObligationId: 1 },
      { id: 3, name: 'Mercado', value: 200000, category: 'Alimentacion', date: '2026-03-10T12:00:00.000Z', isFixed: 0 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    expect(stats.expensesByCategory.length).toBeGreaterThan(0);
    expect(stats.expensesByCategory[0].category).toBe('Servicios');
    expect(Math.round(stats.expensesByCategory[0].percent)).toBe(60);
    expect(stats.topExpenses[0].name).toBe('Internet');
    expect(stats.fixedVsVariable.fixed).toBe(300000);
    expect(stats.fixedVsVariable.variable).toBe(200000);
  });

  it('returns a 12-month series with zeros when no data exists', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'));

    const settings = { id: 'config', savingsPercent: 10 };
    const incomes = [
      { id: 1, amountCop: 500000, date: '2026-02-03T12:00:00.000Z', type: 'salary', description: 'Febrero' },
      { id: 2, amountCop: 900000, date: '2026-03-03T12:00:00.000Z', type: 'salary', description: 'Marzo' }
    ];
    const expenses: any[] = [
      { id: 1, name: 'Compra feb', value: 100000, category: 'Varios', date: '2026-02-09T12:00:00.000Z', isFixed: 0 },
      { id: 2, name: 'Compra mar', value: 200000, category: 'Varios', date: '2026-03-09T12:00:00.000Z', isFixed: 0 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    expect(stats.monthlySeries).toHaveLength(12);
    expect(stats.monthlySeries[11].income).toBe(900000);
    expect(stats.monthlySeries[11].spent).toBe(200000);
    expect(stats.monthlySeries[10].income).toBe(500000);
    expect(stats.monthlySeries[0].income).toBe(0);
  });

  it('builds daily heatmap with projected pending and paid-on-time separation', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));

    const settings = { id: 'config', savingsPercent: 10 };
    const incomes = [
      { id: 1, amountCop: 2200000, date: '2026-03-03T12:00:00.000Z', type: 'salary', description: 'Sueldo' }
    ];
    const expenses: any[] = [
      { id: 1, name: 'Internet', value: 120000, category: 'Servicios', date: '2026-01-01T12:00:00.000Z', isFixed: 1, dueDay: 10 },
      { id: 2, name: 'Gimnasio', value: 90000, category: 'Bienestar', date: '2026-01-01T12:00:00.000Z', isFixed: 1, dueDay: 12 },
      { id: 3, name: 'Internet', value: 120000, category: 'Servicios', date: '2026-03-10T12:00:00.000Z', isFixed: 2, linkedObligationId: 1 },
      { id: 4, name: 'Gimnasio', value: 90000, category: 'Bienestar', date: '2026-03-14T12:00:00.000Z', isFixed: 2, linkedObligationId: 2 },
      { id: 5, name: 'Salida', value: 50000, category: 'Ocio', date: '2026-03-14T12:00:00.000Z', isFixed: 0 }
    ];

    render(<TestComponent settings={settings} expenses={expenses} incomes={incomes} />);
    const out = screen.getByTestId('out').textContent || '';
    const stats = JSON.parse(out);

    const day10 = stats.dailyHeatmap.find((d: any) => d.day === 10);
    const day12 = stats.dailyHeatmap.find((d: any) => d.day === 12);
    const day14 = stats.dailyHeatmap.find((d: any) => d.day === 14);
    const day3 = stats.dailyHeatmap.find((d: any) => d.day === 3);

    expect(day10.projectedAmount).toBe(120000);
    expect(day10.projectedPaidOnTimeAmount).toBe(120000);
    expect(day12.projectedAmount).toBe(90000);
    expect(day12.projectedPaidOnTimeAmount).toBe(0);
    expect(day14.actualAmount).toBe(50000);
    expect(day3.incomeAmount).toBe(2200000);
  });
});
