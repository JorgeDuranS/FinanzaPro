import { db, seedDatabase } from '../db';
import type { Expense, Income, Setting } from '../db';
import { clearBackup, restoreBackupToDbIfNeeded, saveBackupFromDb } from './localBackup';

export type BackupData = {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  incomes: Income[];
  settings: Setting | undefined;
};

const ensureSettingsRow = async () => {
  const settings = await db.settings.get('config');

  if (!settings) {
    await db.settings.put({
      id: 'config',
      savingsPercent: 10,
      themeMode: 'light',
      isCleaned: true
    });
  }
};

export const dbService = {
  initialize: async () => {
    await restoreBackupToDbIfNeeded();
    await seedDatabase();
    await saveBackupFromDb();
  },
  seed: async () => {
    await seedDatabase();
    await saveBackupFromDb();
  },
  getExpenses: async (): Promise<Expense[]> => {
    return db.expenses.toArray();
  },
  getIncomes: async (): Promise<Income[]> => {
    return db.incomes.toArray();
  },
  getSettings: async (): Promise<Setting | undefined> => {
    return db.settings.get('config');
  },
  addExpense: async (exp: Omit<Expense, 'id'>) => {
    const id = await db.expenses.add(exp as Expense);
    await saveBackupFromDb();
    return id;
  },
  addIncome: async (inc: Omit<Income, 'id'>) => {
    const id = await db.incomes.add(inc as Income);
    await saveBackupFromDb();
    return id;
  },
  updateExpense: async (id: number, patch: Partial<Expense>) => {
    const updated = await db.expenses.update(id, patch);
    await saveBackupFromDb();
    return updated;
  },
  deleteExpense: async (id: number) => {
    await db.expenses.delete(id);
    await saveBackupFromDb();
  },
  deleteIncome: async (id: number) => {
    await db.incomes.delete(id);
    await saveBackupFromDb();
  },
  clearAll: async () => {
    await db.expenses.clear();
    await db.incomes.clear();
    await db.settings.clear();
    clearBackup();
  },
  updateSettings: async (patch: Partial<Setting>) => {
    await ensureSettingsRow();
    const updated = await db.settings.update('config', patch as any);
    await saveBackupFromDb();
    return updated;
  },
  exportData: async (): Promise<BackupData> => {
    const expenses = await db.expenses.toArray();
    const incomes = await db.incomes.toArray();
    const settings = await db.settings.get('config');
    
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      expenses,
      incomes,
      settings
    };
  },
  importData: async (data: BackupData): Promise<boolean> => {
    try {
      if (!data || !data.version) {
        throw new Error('Invalid backup data');
      }

      await db.transaction('rw', db.expenses, db.incomes, db.settings, async () => {
        await db.expenses.clear();
        await db.incomes.clear();
        await db.settings.clear();

        if (data.expenses && data.expenses.length > 0) {
          await db.expenses.bulkAdd(data.expenses);
        }

        if (data.incomes && data.incomes.length > 0) {
          await db.incomes.bulkAdd(data.incomes);
        }

        if (data.settings) {
          await db.settings.put(data.settings);
        } else {
          await ensureSettingsRow();
        }
      });

      await saveBackupFromDb();
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
};

export default dbService;
