import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isLoading }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        </div>
        
        <p className="text-slate-300 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading} className="bg-primary hover:bg-primary-dark">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
