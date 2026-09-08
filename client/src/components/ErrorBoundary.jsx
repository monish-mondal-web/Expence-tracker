import React from 'react';
import { PocketMoneyIcon } from './PocketLogo';
import { RotateCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <PocketMoneyIcon size={46} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
            Pocket Khorcha
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#94A3B8',
              maxWidth: '340px',
              margin: '0 0 1.75rem',
              lineHeight: 1.45,
            }}
          >
            Something unexpected occurred while rendering. Your data is safe locally.
          </p>

          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                border: 'none',
                background: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <RotateCw size={16} />
              <span>Reload App</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Home size={16} />
              <span>Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
