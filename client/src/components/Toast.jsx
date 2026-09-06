import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const Toast = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'error' ? (
            <AlertCircle size={18} color="#F43F5E" />
          ) : (
            <CheckCircle2 size={18} color="#10B981" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
