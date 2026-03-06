import { db, type Expense, type Income, type Setting } from '../db';

const BACKUP_KEY = 'finanzapro.backup.v1';

type BackupPayload = {
  version: 1;
  savedAt: string;
  settings: Setting[];
  expenses: Array<Omit<Expense, 'date'> & { date: string }>;
  incomes: Array<Omit<Income, 'date'> & { date: string }>;
};

const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const toBackupPayload = (settings: Setting[], expenses: Expense[], incomes: Income[]): BackupPayload => ({
  version: 1,
  savedAt: new Date().toISOString(),
  settings,
  expenses: expenses.map((expense) => ({
    ...expense,
    date: new Date(expense.date).toISOString()
  })),
  incomes: incomes.map((income) => ({
    ...income,
    date: new Date(income.date).toISOString()
  }))
});

const parseBackup = (raw: string): BackupPayload | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<BackupPayload>;

    if (!parsed || parsed.version !== 1) {
      return null;
    }

    if (!Array.isArray(parsed.settings) || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.incomes)) {
      return null;
    }

    return {
      version: 1,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date(0).toISOString(),
      settings: parsed.settings as Setting[],
      expenses: parsed.expenses as Array<Omit<Expense, 'date'> & { date: string }>,
      incomes: parsed.incomes as Array<Omit<Income, 'date'> & { date: string }>
    };
  } catch {
    return null;
  }
};

export const saveBackupFromDb = async () => {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const [settings, expenses, incomes] = await Promise.all([
      db.settings.toArray(),
      db.expenses.toArray(),
      db.incomes.toArray()
    ]);

    const payload = toBackupPayload(settings, expenses, incomes);
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('No fue posible guardar respaldo local.', error);
  }
};

export const clearBackup = () => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(BACKUP_KEY);
};

export const restoreBackupToDbIfNeeded = async () => {
  if (!canUseLocalStorage()) {
    return false;
  }

  const raw = window.localStorage.getItem(BACKUP_KEY);
  if (!raw) {
    return false;
  }

  const payload = parseBackup(raw);
  if (!payload) {
    window.localStorage.removeItem(BACKUP_KEY);
    return false;
  }

  const [settingsCount, expensesCount, incomesCount] = await Promise.all([
    db.settings.count(),
    db.expenses.count(),
    db.incomes.count()
  ]);

  const hasDbData = settingsCount > 0 || expensesCount > 0 || incomesCount > 0;
  if (hasDbData) {
    return false;
  }

  const hasBackupData = payload.settings.length > 0 || payload.expenses.length > 0 || payload.incomes.length > 0;
  if (!hasBackupData) {
    return false;
  }

  try {
    await db.transaction('rw', db.settings, db.expenses, db.incomes, async () => {
      await db.settings.clear();
      await db.expenses.clear();
      await db.incomes.clear();

      if (payload.settings.length > 0) {
        await db.settings.bulkPut(payload.settings);
      }

      if (payload.expenses.length > 0) {
        await db.expenses.bulkPut(
          payload.expenses.map((expense) => ({
            ...expense,
            date: new Date(expense.date)
          }))
        );
      }

      if (payload.incomes.length > 0) {
        await db.incomes.bulkPut(
          payload.incomes.map((income) => ({
            ...income,
            date: new Date(income.date)
          }))
        );
      }
    });

    return true;
  } catch (error) {
    console.error('No fue posible restaurar respaldo local.', error);
    return false;
  }
};
