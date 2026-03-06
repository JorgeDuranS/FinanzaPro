import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Expense } from '../../db';
import dbService from '../../services/dbService';

type Props = {
  onClose?: () => void;
  onAdded?: (e: Expense) => void;
  onComplete?: () => void;
  editExpense?: Expense | null;
};

const CATEGORY_OPTIONS = [
  'Servicios', 'Hogar', 'Impuestos', 'Bienestar', 'Alimentación', 'Salud', 
  'Transporte', 'Suscripciones', 'Cuidado personal', 'Delivery', 
  'Entretenimiento', 'Shopping', 'Regalos', 'Imprevistos', 'Préstamos', 'Otros'
];

interface FormErrors {
  name?: string;
  value?: string;
  category?: string;
  date?: string;
}

export const AddExpenseForm = ({ onClose, onAdded, onComplete, editExpense }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = !!editExpense;

  const [name, setName] = useState(editExpense?.name || '');
  const [value, setValue] = useState(editExpense?.value ? editExpense.value.toLocaleString('es-CO') : '');
  const [category, setCategory] = useState(editExpense?.category || 'Otros');
  const [date, setDate] = useState(editExpense?.date ? new Date(editExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

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
    if (errors.value) setErrors(prev => ({ ...prev, value: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const numValue = Number(value.replace(/[.,]/g, ''));

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Máximo 100 caracteres';
    }

    if (!value || numValue <= 0 || isNaN(numValue)) {
      newErrors.value = 'Ingresa un valor válido mayor a 0';
    }

    if (!date) {
      newErrors.date = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const numValue = Number(value.replace(/[.,]/g, ''));
      const expenseData: Omit<Expense, 'id'> = {
        name: name.trim(),
        value: numValue,
        category,
        date: new Date(date + 'T12:00:00'),
        isFixed: 0
      };

      if (isEditing && editExpense?.id) {
        await dbService.updateExpense(editExpense.id, expenseData as any);
      } else {
        const id = await dbService.addExpense(expenseData);
        if (onAdded) onAdded({ ...expenseData, id: Number(id) });
      }
      if (onClose) onClose();
      if (onComplete) onComplete();
    } catch (err) {
      setError('Error al guardar el gasto. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="expense-name" className="field-label block mb-2">Nombre del gasto</label>
        <input
          id="expense-name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
          placeholder="Ej: Almuerzo, Uber, Compra"
          className={`field-input ${errors.name ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-rose-500 text-xs mt-1" role="alert">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="expense-value" className="field-label block mb-2">Valor (COP)</label>
          <input
            id="expense-value"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={value}
            onChange={handleValueChange}
            className={`field-input font-bold ${errors.value ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
            aria-invalid={errors.value ? 'true' : 'false'}
            aria-describedby={errors.value ? 'value-error' : undefined}
          />
          {errors.value && (
            <p id="value-error" className="text-rose-500 text-xs mt-1" role="alert">{errors.value}</p>
          )}
        </div>
        <div>
          <label htmlFor="expense-date" className="field-label block mb-2">Fecha</label>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors(prev => ({ ...prev, date: undefined })); }}
            className={`field-input ${errors.date ? 'border-rose-500 focus:ring-rose-500/35' : ''}`}
          />
          {errors.date && (
            <p className="text-rose-500 text-xs mt-1" role="alert">{errors.date}</p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label block mb-2">Categoría</label>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Seleccionar categoría">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setCategory(opt); if (errors.category) setErrors(prev => ({ ...prev, category: undefined })); }}
              className={`chip-button text-[11px] ${category === opt ? 'chip-button-active' : ''}`}
              aria-pressed={category === opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        <button 
          type="button" 
          onClick={onClose} 
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
            isEditing ? 'Actualizar gasto' : 'Añadir gasto'
          )}
        </button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
