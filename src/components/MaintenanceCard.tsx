import React, { useState, useRef } from 'react';
import { Trash, Download, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import dbService, { type BackupData } from '../services/dbService';

export const MaintenanceCard = ({ onSeed, onClear }: { onSeed: () => void; onClear: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canConfirm = confirmText === 'DELETE';

  const handleClear = async () => {
    if (!canConfirm) return;
    setIsClearing(true);
    try {
      await onClear();
      setIsOpen(false);
      setConfirmText('');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await dbService.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `finanzapro-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);
      
      const success = await dbService.importData(data);
      
      if (success) {
        setImportStatus('success');
        setTimeout(() => {
          setImportStatus('idle');
          window.location.reload();
        }, 1500);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="surface-card p-4 rounded-2xl">
      <h3 className="font-bold text-slate-900 dark:text-slate-100">Mantenimiento (Avanzado)</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Acciones de mantenimiento para usuarios avanzados. La opcion de insertar datos de ejemplo esta desactivada en produccion.</p>
      
      <div className="mt-3 space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            disabled={exportStatus !== 'idle'}
            className="py-2 px-3 rounded-lg bg-teal-50 text-teal-700 flex items-center gap-2 hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {exportStatus === 'success' ? (
              <Check size={16} />
            ) : (
              <Download size={16} />
            )}
            Exportar datos
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label 
            htmlFor="import-file"
            className={`py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
              importStatus === 'success' 
                ? 'bg-emerald-50 text-emerald-700' 
                : importStatus === 'error'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {importStatus === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : importStatus === 'success' ? (
              <Check size={16} />
            ) : importStatus === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <Upload size={16} />
            )}
            Importar datos
          </label>
        </div>

        {exportStatus === 'success' && (
          <p className="text-xs text-emerald-600">Datos exportados correctamente</p>
        )}
        
        {importStatus === 'error' && (
          <p className="text-xs text-rose-600">Error al importar. Verifica el formato del archivo.</p>
        )}

        <button onClick={() => setIsOpen(true)} className="py-2 px-3 rounded-lg bg-rose-50 text-rose-700 w-full">
          <div className="inline-flex items-center gap-2"><Trash size={16} /> Limpiar base de datos</div>
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={() => { if (!isClearing) { setIsOpen(false); setConfirmText(''); } }}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Confirmar limpieza de la base de datos</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Esta accion eliminara todos los datos almacenados en la aplicacion (gastos, ingresos y configuracion).
          Es irreversible. Si quieres conservar tus datos, haz una copia antes de continuar.
        </p>

        <div className="mb-3">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Escribe <span className="font-mono">DELETE</span> para confirmar:</label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="field-input"
            placeholder="Escribe DELETE aqui"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => { setIsOpen(false); setConfirmText(''); }} disabled={isClearing} className="action-secondary">Cancelar</button>
          <button onClick={handleClear} disabled={!canConfirm || isClearing} className="py-2 px-3 rounded-lg bg-rose-600 text-white">{isClearing ? 'Borrando...' : 'Confirmar borrado'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default MaintenanceCard;
