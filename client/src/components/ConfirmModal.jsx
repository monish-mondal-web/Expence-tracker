import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = () => {
  const { confirmModal, closeConfirm } = useApp();

  if (!confirmModal.isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeConfirm}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#F43F5E" />
            </div>
            <h3 style={{ fontSize: '1.15rem' }}>{confirmModal.title || 'Confirm Action'}</h3>
          </div>
          <button className="modal-close-btn" onClick={closeConfirm}>
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          {confirmModal.message || 'Are you sure you want to proceed with this action? This cannot be undone.'}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={closeConfirm}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1, margin: 0, background: '#F43F5E' }}
            onClick={confirmModal.onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
