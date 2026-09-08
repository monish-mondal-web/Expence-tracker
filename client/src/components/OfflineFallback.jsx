import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineFallback = ({ message, onRetry }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#FEF3C7',
          color: '#D97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <WifiOff size={28} strokeWidth={2.2} />
      </div>

      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '0.4rem',
        }}
      >
        You are in Offline Mode
      </h3>

      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          maxWidth: '280px',
          lineHeight: 1.45,
          marginBottom: '1.25rem',
        }}
      >
        {message || 'This section could not be loaded because there is no internet connection and no local data saved yet.'}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
