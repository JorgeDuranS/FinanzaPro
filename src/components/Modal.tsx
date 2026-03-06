import React from 'react';

type Props = {
  isOpen: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  title?: string;
};

export const Modal = ({ isOpen, onClose, children }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="surface-card rounded-lg shadow-lg max-w-lg w-full p-4">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-600 dark:text-slate-300">Cerrar</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
