import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import dbService from '../../services/dbService';
import type { Expense } from '../../db';
import { cn } from '../../utils/classNames';

type Props = {
  obligation: Expense | null;
  mode?: 'fixed' | 'credit';
  onComplete?: () => void;
};

interface FormErrors {
  name?: string;
  value?: string;
  dueDay?: string;
  totalDebt?: string;
  installmentCount?: string;
  interestPercent?: string;
}

export const ManageFixedExpenseForm = ({ obligation, mode, onComplete }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [obligationType] = useState<'fixed' | 'credit'>(obligation?.obligationType || mode || 'fixed');
  const [name, setName] = useState(obligation?.name || '');
  const [value, setValue] = useState(obligation?.value.toString() || '');
  const [dueDay, setDueDay] = useState(obligation?.dueDay?.toString() || '1');
  const [category, setCategory] = useState(obligation?.category || 'Servicios');
  const [isAverage, setIsAverage] = useState(obligation?.isAverage || false);
  const [creditPaymentMode, setCreditPaymentMode] = useState<'interest_percent' | 'fixed_value'>(obligation?.creditPaymentMode || 'interest_percent');
  const [totalDebt, setTotalDebt] = useState(obligation?.totalDebt?.toString() || '');
  const [interestPercent, setInterestPercent] = useState(obligation?.interestPercent?.toString() || '');
  const [installmentCount, setInstallmentCount] = useState(obligation?.installmentCount?.toString() || '');

  const categories = [
    'Servicios', 'Hogar', 'Impuestos', 'Bienestar', 'Alimentación', 'Salud', 
    'Transporte', 'Suscripciones', 'Cuidado personal', 'Delivery', 
    'Entretenimiento', 'Shopping', 'Regalos', 'Imprevistos', 'Préstamos', 'Otros'
  ];

  const formatNumberInput = (val: string) => {
    const num = val.replace(/[.,]/g, '');
    if (num === '') return '';
    const parsed = Number(num);
    if (isNaN(parsed)) return val;
    return parsed.toLocaleString('es-CO');
  };

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatNumberInput(e.target.value);
      setter(formatted);
    };

  const calculateCreditInstallment = () => {
    const debt = Number(totalDebt.replace(/[.,]/g, ''));
    const installments = Number(installmentCount.replace(/[.,]/g, ''));
    const interest = Number(interestPercent.replace(/[.,]/g, ''));

    if (!Number.isFinite(debt) || !Number.isFinite(installments) || installments <= 0 || !Number.isFinite(interest)) {
      return 0;
    }

    const principalPerInstallment = debt / installments;
    return principalPerInstallment * (1 + (interest / 100));
  };

  const calculateFixedModeTotalDebt = () => {
    const installmentValue = Number(value.replace(/[.,]/g, ''));
    const installments = Number(installmentCount.replace(/[.,]/g, ''));

    if (!Number.isFinite(installmentValue) || !Number.isFinite(installments) || installments <= 0) {
      return 0;
    }

    return installmentValue * installments;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    const numDueDay = Number(dueDay);
    if (!dueDay || numDueDay < 1 || numDueDay > 31 || isNaN(numDueDay)) {
      newErrors.dueDay = 'Día válido (1-31)';
    }

    if (obligationType === 'credit') {
      const numInstallments = Number(installmentCount.replace(/[.,]/g, ''));
      if (!installmentCount || numInstallments <= 0 || isNaN(numInstallments)) {
        newErrors.installmentCount = 'Número de cuotas requerido';
      }

      if (creditPaymentMode === 'interest_percent') {
        const numTotalDebt = Number(totalDebt.replace(/[.,]/g, ''));
        if (!totalDebt || numTotalDebt <= 0 || isNaN(numTotalDebt)) {
          newErrors.totalDebt = 'Deuda total requerida';
        }

        const numInterest = Number(interestPercent.replace(/[.,]/g, ''));
        if (!interestPercent || isNaN(numInterest)) {
          newErrors.interestPercent = 'Interés requerido';
        }
      }
    }

    if (obligationType === 'fixed') {
      const numValue = Number(value.replace(/[.,]/g, ''));
      if (!value || numValue <= 0 || isNaN(numValue)) {
        newErrors.value = 'Valor requerido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedInstallmentCount = installmentCount ? Number(installmentCount.replace(/[.,]/g, '')) : 0;
      
      const normalizedTotalDebt = obligationType === 'credit'
        ? (creditPaymentMode === 'fixed_value' ? calculateFixedModeTotalDebt() : Number(totalDebt.replace(/[.,]/g, '')))
        : 0;

      const computedValue = obligationType === 'credit' && creditPaymentMode === 'interest_percent'
        ? calculateCreditInstallment()
        : Number(value.replace(/[.,]/g, ''));

      const expenseData: Omit<Expense, 'id'> = {
        name: name.trim(),
        value: computedValue,
        dueDay: Number(dueDay),
        category,
        isAverage,
        isFixed: 1,
        date: new Date(),
        obligationType,
        creditPaymentMode: obligationType === 'credit' ? creditPaymentMode : undefined,
        totalDebt: obligationType === 'credit' ? normalizedTotalDebt : undefined,
        interestPercent: obligationType === 'credit' && creditPaymentMode === 'interest_percent'
          ? Number(interestPercent.replace(/[.,]/g, '') || 0)
          : undefined,
        installmentCount: obligationType === 'credit' ? normalizedInstallmentCount : undefined
      };

      if (obligation?.id) {
        await dbService.updateExpense(obligation.id, expenseData as any);
      } else {
        const all = await dbService.getExpenses();
        const existing = all.find(existing => existing.isFixed === 1 && existing.name.trim().toLowerCase() === expenseData.name.toLowerCase());
        if (existing) {
          await dbService.updateExpense(existing.id!, expenseData as any);
        } else {
          await dbService.addExpense(expenseData);
        }
      }

      if (onComplete) onComplete();
    } catch (err) {
      setError('Error al guardar la obligación. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="obligation-name" className="field-label">
          {obligationType === 'credit' ? 'Nombre del crédito' : 'Nombre de la obligación'}
        </label>
        <input 
          id="obligation-name"
          autoFocus
          type="text"
          placeholder="Ej: Arriendo, Internet..."
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
          className={`field-input ${errors.name ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
          required
        />
        {errors.name && (
          <p className="text-rose-500 text-xs mt-1" role="alert">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="obligation-value" className="field-label">
            {obligationType === 'credit' && creditPaymentMode === 'interest_percent' ? 'Cuota estimada (COP)' : 'Valor (COP)'}
          </label>
          <input 
            id="obligation-value"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={obligationType === 'credit' && creditPaymentMode === 'interest_percent'
              ? (calculateCreditInstallment() > 0 ? calculateCreditInstallment().toFixed(0) : '')
              : value}
            onChange={handleNumberChange(setValue)}
            className={`field-input font-bold text-lg ${obligationType === 'credit' && creditPaymentMode === 'interest_percent' ? 'bg-slate-100 dark:bg-slate-800' : ''} ${errors.value ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
            readOnly={obligationType === 'credit' && creditPaymentMode === 'interest_percent'}
            required
          />
          {errors.value && (
            <p className="text-rose-500 text-xs mt-1" role="alert">{errors.value}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="obligation-dueDay" className="field-label">Día de pago (1-31)</label>
          <input 
            id="obligation-dueDay"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => { setDueDay(e.target.value); if (errors.dueDay) setErrors(prev => ({ ...prev, dueDay: undefined })); }}
            className={`field-input font-bold text-lg ${errors.dueDay ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
            required
          />
          {errors.dueDay && (
            <p className="text-rose-500 text-xs mt-1" role="alert">{errors.dueDay}</p>
          )}
        </div>
      </div>

      {obligationType === 'credit' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="obligation-totalDebt" className="field-label">Deuda total (COP)</label>
              <input
                id="obligation-totalDebt"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={creditPaymentMode === 'fixed_value'
                  ? (calculateFixedModeTotalDebt() > 0 ? calculateFixedModeTotalDebt().toFixed(0) : '')
                  : totalDebt}
                onChange={handleNumberChange(setTotalDebt)}
                className={`field-input font-bold text-lg ${creditPaymentMode === 'fixed_value' ? 'bg-slate-100 dark:bg-slate-800' : ''} ${errors.totalDebt ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
                readOnly={creditPaymentMode === 'fixed_value'}
                required
              />
              {errors.totalDebt && (
                <p className="text-rose-500 text-xs mt-1" role="alert">{errors.totalDebt}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="obligation-installments" className="field-label">Número de cuotas</label>
              <input
                id="obligation-installments"
                type="number"
                min="1"
                placeholder="0"
                value={installmentCount}
                onChange={(e) => { setInstallmentCount(e.target.value); if (errors.installmentCount) setErrors(prev => ({ ...prev, installmentCount: undefined })); }}
                className={`field-input font-bold text-lg ${errors.installmentCount ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
                required
              />
              {errors.installmentCount && (
                <p className="text-rose-500 text-xs mt-1" role="alert">{errors.installmentCount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="field-label">Modo de cuota</label>
            <div className="grid grid-cols-2 gap-2" role="group">
              <button
                type="button"
                onClick={() => setCreditPaymentMode('interest_percent')}
                className={cn('chip-button text-[10px]', creditPaymentMode === 'interest_percent' && 'chip-button-active')}
                aria-pressed={creditPaymentMode === 'interest_percent'}
              >
                % interés
              </button>
              <button
                type="button"
                onClick={() => setCreditPaymentMode('fixed_value')}
                className={cn('chip-button text-[10px]', creditPaymentMode === 'fixed_value' && 'chip-button-active')}
                aria-pressed={creditPaymentMode === 'fixed_value'}
              >
                Valor fijo
              </button>
            </div>
          </div>

          {creditPaymentMode === 'interest_percent' ? (
            <div className="space-y-2">
              <label htmlFor="obligation-interest" className="field-label">Interés mensual (%)</label>
              <input
                id="obligation-interest"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={interestPercent}
                onChange={handleNumberChange(setInterestPercent)}
                className={`field-input font-bold text-lg ${errors.interestPercent ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
                required
              />
              {errors.interestPercent && (
                <p className="text-rose-500 text-xs mt-1" role="alert">{errors.interestPercent}</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {obligationType === 'fixed' ? (
        <div className="space-y-2">
          <label className="field-label">Tipo de valor</label>
          <div className="flex gap-4" role="group">
            <button
              type="button"
              onClick={() => setIsAverage(false)}
              className={cn('chip-button flex-1', !isAverage && 'chip-button-active')}
              aria-pressed={!isAverage}
            >
              Valor Neto
            </button>
            <button
              type="button"
              onClick={() => setIsAverage(true)}
              className={cn('chip-button flex-1', isAverage && 'chip-button-active')}
              aria-pressed={isAverage}
            >
              Promedio
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-300 italic mt-1">
            {isAverage ? 'Util para servicios que varían mes a mes.' : 'Para montos fijos como arriendo o gimnasio.'}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="field-label">Categoría</label>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Seleccionar categoría">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'chip-button text-[10px]',
                category === cat && 'chip-button-active'
              )}
              aria-pressed={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        <button 
          type="button"
          onClick={onComplete}
          className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          disabled={isSubmitting}
          aria-label="Cancelar"
        >
          <X size={20} />
        </button>
        <button 
          type="submit" 
          className="action-primary flex-1 flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Guardando...
            </>
          ) : (
            obligation 
              ? (obligationType === 'credit' ? 'Actualizar crédito' : 'Actualizar obligación')
              : (obligationType === 'credit' ? 'Guardar crédito' : 'Guardar obligación')
          )}
        </button>
      </div>
    </form>
  );
};

export default ManageFixedExpenseForm;
