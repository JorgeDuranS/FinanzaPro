import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import dbService from '../../services/dbService';

type Props = {
  onComplete?: () => void;
};

interface FormErrors {
  amountCop?: string;
  description?: string;
  date?: string;
}

export const AddIncomeForm = ({ onComplete }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [amountCop, setAmountCop] = useState('2000000');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'salary' | 'extra'>('salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const formatNumberInput = (val: string) => {
    const num = val.replace(/[.,]/g, '');
    if (num === '') return '';
    const parsed = Number(num);
    if (isNaN(parsed)) return val;
    return parsed.toLocaleString('es-CO');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setAmountCop(formatted);
    if (errors.amountCop) setErrors(prev => ({ ...prev, amountCop: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const numAmount = Number(amountCop.replace(/[.,]/g, ''));

    if (!amountCop || numAmount <= 0 || isNaN(numAmount)) {
      newErrors.amountCop = 'Ingresa un monto válido mayor a 0';
    }

    if (!date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (description && description.length > 200) {
      newErrors.description = 'Máximo 200 caracteres';
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
      await dbService.addIncome({
        amountCop: Number(amountCop.replace(/[.,]/g, '')),
        date: new Date(date + 'T12:00:00'),
        type,
        description: description || (type === 'salary' ? 'Sueldo' : 'Extra')
      });

      if (onComplete) onComplete();
    } catch (err) {
      setError('Error al registrar el ingreso. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayAmount = Number(amountCop.replace(/[.,]/g, ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="income-date" className="field-label">Fecha de recibo</label>
        <input 
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors(prev => ({ ...prev, date: undefined })); }}
          className={`field-input ${errors.date ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
          required
        />
        {errors.date && (
          <p className="text-rose-500 text-xs mt-1" role="alert">{errors.date}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="income-amount" className="field-label">Monto (COP)</label>
        <input 
          id="income-amount"
          type="text"
          inputMode="numeric"
          value={amountCop}
          onChange={handleAmountChange}
          className={`field-input font-bold text-lg ${errors.amountCop ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
          aria-invalid={errors.amountCop ? 'true' : 'false'}
          required
        />
        {errors.amountCop && (
          <p className="text-rose-500 text-xs mt-1" role="alert">{errors.amountCop}</p>
        )}
      </div>

      <div className="surface-card p-4 rounded-2xl">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Total recibido: {!isNaN(displayAmount) ? displayAmount.toLocaleString('es-CO') : 0} COP
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="income-description" className="field-label">Descripción</label>
        <input 
          id="income-description"
          type="text"
          value={description}
          onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors(prev => ({ ...prev, description: undefined })); }}
          className={`field-input ${errors.description ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
          placeholder="Opcional"
        />
        {errors.description && (
          <p className="text-rose-500 text-xs mt-1" role="alert">{errors.description}</p>
        )}
      </div>

      <div className="flex gap-2" role="group" aria-label="Tipo de ingreso">
        <button 
          type="button" 
          onClick={() => setType('salary')} 
          className={type === 'salary' ? 'chip-button chip-button-active flex-1' : 'chip-button flex-1'}
          aria-pressed={type === 'salary'}
        >
          Sueldo
        </button>
        <button 
          type="button" 
          onClick={() => setType('extra')} 
          className={type === 'extra' ? 'chip-button chip-button-active flex-1' : 'chip-button flex-1'}
          aria-pressed={type === 'extra'}
        >
          Extra
        </button>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        <button 
          type="button"
          onClick={() => {
            if (onComplete) onComplete();
          }}
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
              Registrando...
            </>
          ) : (
            'Registrar ingreso'
          )}
        </button>
      </div>
    </form>
  );
};

export default AddIncomeForm;
