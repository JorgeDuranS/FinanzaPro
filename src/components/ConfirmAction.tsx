import React, { useState } from 'react';

export const ConfirmAction = ({
  children,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  className = ''
}: {
  children: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`inline-flex items-center ${className}`}> 
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
          {children}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={async () => { await onConfirm(); setConfirming(false); }} className="py-2 px-3 rounded-lg bg-rose-600 text-white">
            {confirmLabel}
          </button>
          <button onClick={() => setConfirming(false)} className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {cancelLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfirmAction;
