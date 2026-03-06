import React from 'react';
import { motion } from 'motion/react';

export default function Fab({ onClick, ariaLabel = 'Acción principal', className = '', children }: { onClick: () => void; ariaLabel?: string; className?: string; children?: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed right-6 bottom-28 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-20 ${className}`}
    >
      {children}
    </motion.button>
  );
}
