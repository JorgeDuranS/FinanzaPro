import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import dbService from '../../services/dbService';
import { formatCOP } from '../../utils/formatters';
import type { Expense } from '../../db';

type Props = {
  obligation: Expense;
  onComplete?: () => void;
};

export const PayObligationForm = ({ obligation, onComplete }: Props) => {
  const isCredit = obligation.obligationType === 'credit';
  const principalPerInstallment = isCredit && obligation.totalDebt && obligation.installmentCount
    ? Number(obligation.totalDebt) / Number(obligation.installmentCount)
    : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [paymentKind, setPaymentKind] = useState<'installment' | 'capital'>('installment');
  const [value, setValue] = useState(obligation.value.toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const formatNumberInput = (val: string) => {
    const num = val.replace(/[.,]/g, '');
    if (num === '') return '';
    const parsed = Number(num);
    if (isNaN(parsed)) return val;
    return parsed.toLocaleString('es-CO');
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setValue(formatted);
  };

  const validate = (): boolean => {
    const numValue = Number(value.replace(/[.,]/g, ''));
    if (!value || numValue <= 0 || isNaN(numValue)) {
      setError('Ingresa un valor válido mayor a 0');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const numericValue = Number(value.replace(/[.,]/g, ''));

      const principalPaid = isCredit
        ? (paymentKind === 'capital' ? numericValue : principalPerInstallment)
        : undefined;

      await dbService.addExpense({
        name: obligation.name,
        value: numericValue,
        category: obligation.category,
        date: new Date(date + 'T12:00:00'),
        isFixed: 2,
        linkedObligationId: obligation.id,
        obligationType: obligation.obligationType,
        paymentKind: isCredit ? paymentKind : undefined,
        principalPaid
      });

      if (onComplete) onComplete();
    } catch (err) {
      setError('Error al registrar el pago. Intenta de nuevo.');
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

      <div className="surface-card p-4 rounded-2xl">
        <p className="text-xs text-teal-700 dark:text-teal-300 font-bold uppercase tracking-widest mb-1">
          {isCredit ? 'Detalle de crédito' : 'Obligación'}
        </p>
        <p className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">{obligation.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Valor estimado: {formatCOP(obligation.value)}</p>
        {isCredit ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <p className="text-slate-500 dark:text-slate-300">Interés mensual: <span className="font-bold text-slate-900 dark:text-slate-100">{obligation.interestPercent || 0}%</span></p>
            <p className="text-slate-500 dark:text-slate-300">Número de cuotas: <span className="font-bold text-slate-900 dark:text-slate-100">{obligation.installmentCount || 0}</span></p>
            <p className="text-slate-500 dark:text-slate-300">Valor cuota: <span className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(obligation.value)}</span></p>
            <p className="text-slate-500 dark:text-slate-300">Capital por cuota: <span className="font-bold text-slate-900 dark:text-slate-100">{formatCOP(principalPerInstallment)}</span></p>
          </div>
        ) : null}
      </div>

      {isCredit ? (
        <div className="space-y-2">
          <label className="field-label">Tipo de pago</label>
          <div className="grid grid-cols-2 gap-2" role="group">
            <button
              type="button"
              onClick={() => { setPaymentKind('installment'); setValue(obligation.value.toString()); }}
              className={`chip-button ${paymentKind === 'installment' ? 'chip-button-active' : ''}`}
              aria-pressed={paymentKind === 'installment'}
            >
              Pago de cuota
            </button>
            <button
              type="button"
              onClick={() => { setPaymentKind('capital'); setValue(''); }}
              className={`chip-button ${paymentKind === 'capital' ? 'chip-button-active' : ''}`}
              aria-pressed={paymentKind === 'capital'}
            >
              Abono a capital
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="payment-date" className="field-label">Fecha de pago</label>
        <input 
          id="payment-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="field-input"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="payment-value" className="field-label">
          {isCredit && paymentKind === 'capital' ? 'Valor abono a capital (COP)' : 'Valor pagado (COP)'}
        </label>
        <input 
          id="payment-value"
          autoFocus
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={value}
          onChange={handleValueChange}
          className="field-input font-bold text-xl"
          required
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-300 italic">
          {isCredit && paymentKind === 'capital'
            ? 'Este pago se aplicará directamente al capital pendiente.'
            : 'Ajusta el valor si el recibo llegó por un monto diferente.'}
        </p>
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
              Procesando...
            </>
          ) : (
            'Confirmar pago'
          )}
        </button>
      </div>
    </form>
  );
};

export default PayObligationForm;
