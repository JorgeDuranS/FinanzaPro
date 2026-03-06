import Dexie, { type Table } from 'dexie';

export interface Setting {
  id: 'config';
  savingsPercent: number;
  themeMode?: 'light' | 'dark';
  isCleaned?: boolean;
}

export interface Income {
  id?: number;
  amountCop: number;
  date: Date;
  type: 'salary' | 'extra';
  description: string;
}

export interface Expense {
  id?: number;
  name: string;
  value: number;
  category: string;
  date: Date;
  isFixed?: number; // 0: Variable, 1: Obligación (Plantilla), 2: Pago Realizado
  dueDay?: number;
  isAverage?: boolean;
  obligationType?: 'fixed' | 'credit';
  creditPaymentMode?: 'interest_percent' | 'fixed_value';
  totalDebt?: number;
  interestPercent?: number;
  installmentCount?: number;
  paymentKind?: 'installment' | 'capital';
  principalPaid?: number;
  linkedObligationId?: number;
}

export class MyDatabase extends Dexie {
  settings!: Table<Setting>;
  expenses!: Table<Expense>;
  incomes!: Table<Income>;

  constructor() {
    super('FinanzaDB');
    this.version(3).stores({
      settings: 'id',
      expenses: '++id, name, category, date, isFixed, dueDay',
      incomes: '++id, date, type'
    });
    this.version(4).stores({
      settings: 'id',
      expenses: '++id, name, category, date, isFixed, dueDay, linkedObligationId, obligationType',
      incomes: '++id, date, type'
    });
  }
}

export const db = new MyDatabase();

// Initial Fixed Expenses Data updated with Calendar dates (No emojis)
export const INITIAL_FIXED_EXPENSES: Omit<Expense, 'id'>[] = [
  { name: 'Recibo Luz', value: 90000, category: 'Servicios', date: new Date(), isFixed: 1, dueDay: 2, isAverage: true },
  { name: 'Recibo Agua', value: 80000, category: 'Servicios', date: new Date(), isFixed: 1, dueDay: 12, isAverage: true },
  { name: 'Nevera papas', value: 155000, category: 'Hogar', date: new Date(), isFixed: 1, dueDay: 14, isAverage: false },
  { name: 'Recibo internet', value: 155000, category: 'Servicios', date: new Date(), isFixed: 1, dueDay: 17, isAverage: false },
  { name: 'Pagar planilla', value: 518000, category: 'Impuestos', date: new Date(), isFixed: 1, dueDay: 20, isAverage: false },
  { name: 'Recibo gas', value: 25000, category: 'Servicios', date: new Date(), isFixed: 1, dueDay: 28, isAverage: true },
  { name: 'Gimnasio', value: 110000, category: 'Bienestar', date: new Date(), isFixed: 1, dueDay: 5, isAverage: false },
  { name: 'Mercado', value: 900000, category: 'Alimentación', date: new Date(), isFixed: 1, dueDay: 1, isAverage: true },
  { name: 'Celular Tigo', value: 30000, category: 'Servicios', date: new Date(), isFixed: 1, dueDay: 10, isAverage: false },
  { name: 'Asistencia Medica', value: 155000, category: 'Salud', date: new Date(), isFixed: 1, dueDay: 15, isAverage: false },
];

let isSeeding = false;
const AUTO_SEED = (import.meta.env.VITE_AUTO_SEED === 'true');

type LegacyIncome = Income & {
  amountUsd?: number;
  exchangeRate?: number;
};

const normalizeLegacyIncomes = async () => {
  const incomes = await db.incomes.toArray();

  for (const income of incomes) {
    const legacyIncome = income as LegacyIncome;
    const hasLegacyFields = 'amountUsd' in legacyIncome || 'exchangeRate' in legacyIncome;
    const hasValidAmountCop = Number.isFinite(legacyIncome.amountCop);

    if (!hasLegacyFields && hasValidAmountCop) {
      continue;
    }

    const computedAmountCop = Number.isFinite(legacyIncome.amountUsd) && Number.isFinite(legacyIncome.exchangeRate)
      ? Number(legacyIncome.amountUsd) * Number(legacyIncome.exchangeRate)
      : 0;

    const normalizedIncome: Income = {
      id: legacyIncome.id,
      amountCop: hasValidAmountCop ? Number(legacyIncome.amountCop) : computedAmountCop,
      date: new Date(legacyIncome.date),
      type: legacyIncome.type === 'extra' ? 'extra' : 'salary',
      description: legacyIncome.description || (legacyIncome.type === 'extra' ? 'Extra' : 'Ingreso')
    };

    await db.incomes.put(normalizedIncome);
  }
};

export const seedDatabase = async () => {
  if (isSeeding) return;
  isSeeding = true;

  try {
    await normalizeLegacyIncomes();

    const settings = await db.settings.get('config');

    // If automatic seeding is disabled, ensure we do NOT inject demo data.
    // We also clean known demo rows without removing user data.
    if (!AUTO_SEED) {
      if (!settings) {
        await db.settings.add({ id: 'config', savingsPercent: 10, themeMode: 'light', isCleaned: true });
      } else {
        if (!settings.isCleaned) {
          const seedNames = new Set(INITIAL_FIXED_EXPENSES.map((e) => e.name.trim().toLowerCase()));
          const seededExpenses = await db.expenses
            .filter((e) => e.isFixed === 1 && seedNames.has(e.name.trim().toLowerCase()))
            .toArray();

          if (seededExpenses.length > 0) {
            await db.expenses.bulkDelete(
              seededExpenses
                .map((e) => e.id)
                .filter((id): id is number => typeof id === 'number')
            );
          }

          const seededIncomes = await db.incomes
            .filter((i) => (i.description || '').toLowerCase().trim() === 'sueldo inicial del mes')
            .toArray();

          if (seededIncomes.length > 0) {
            await db.incomes.bulkDelete(
              seededIncomes
                .map((i) => i.id)
                .filter((id): id is number => typeof id === 'number')
            );
          }

          await db.settings.update('config', { isCleaned: true });
        }
      }

      return;
    }

    // Deduplicate fixed expenses by name (safety measure) - Case insensitive
    const allExpenses = await db.expenses.toArray();
    const seenFixedNames = new Set<string>();
    for (const exp of allExpenses) {
      if (exp.isFixed === 1) {
        const normalizedName = exp.name.trim().toLowerCase();
        if (seenFixedNames.has(normalizedName)) {
          console.log(`Deleting duplicate fixed expense: ${exp.name}`);
          await db.expenses.delete(exp.id!);
        } else {
          seenFixedNames.add(normalizedName);
        }
      }
    }

    // Deduplicate incomes for current month (safety measure)
    const allIncomes = await db.incomes.toArray();
    const seenIncomeKeys = new Set<string>();
    for (const inc of allIncomes) {
      const dateKey = new Date(inc.date).toDateString();
      const key = `${inc.amountCop}-${dateKey}-${inc.description.toLowerCase().trim()}`;
      if (seenIncomeKeys.has(key)) {
        console.log(`Deleting duplicate income: ${inc.description}`);
        await db.incomes.delete(inc.id!);
      } else {
        seenIncomeKeys.add(key);
      }
    }

    // Ensure there is at least one income for the current month for demo purposes
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyIncomes = await db.incomes
      .filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .toArray();

    if (monthlyIncomes.length === 0) {
      await db.incomes.add({
        amountCop: 2000000,
        date: new Date(),
        type: 'salary',
        description: 'Sueldo inicial del mes'
      });
    }
  } finally {
    isSeeding = false;
  }
};
