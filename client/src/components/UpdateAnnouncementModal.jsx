import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  WifiOff,
  RefreshCw,
  Tag,
  Brush,
  Smartphone,
  CheckCircle2,
  X,
  Heart,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'pk_seen_update_v1_2';

export const UpdateAnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen this one-time popup
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      // Show after smooth entrance delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual trigger (e.g. from Settings "What's New in v1.2")
  useEffect(() => {
    const handleManualOpen = () => setIsOpen(true);
    window.addEventListener('pk:open-update-modal', handleManualOpen);
    return () => window.removeEventListener('pk:open-update-modal', handleManualOpen);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleDismiss} style={{ zIndex: 1100 }}>
      <div
        className="modal-content update-announcement-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 35px rgba(16, 185, 129, 0.15)',
        }}
      >
        {/* Banner Header with Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
            padding: '1.75rem 1.5rem 1.25rem',
            position: 'relative',
            color: '#FFFFFF',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Close"
          >
            <X size={16} />
          </button>

          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={13} color="#FDE047" />
            <span>New Update • v1.2</span>
          </div>

          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              lineHeight: 1.25,
              margin: '0 0 6px',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            🎉 Pocket Khorcha Works 100% Offline!
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.45,
            }}
          >
            No internet? No problem! Track, budget, and manage your daily expenses seamlessly anytime, anywhere.
          </p>
        </div>

        {/* Features Scroll Body */}
        <div
          style={{
            padding: '1.25rem 1.4rem',
            maxHeight: '340px',
            overflowY: 'auto',
            background: '#FAFAFA',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {/* Feature 1: Offline */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.85rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WifiOff size={18} color="#059669" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Zero-Data Offline Support
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                The app opens instantly in airplane mode or on spotty Wi-Fi. Your dashboard and expenses are always ready.
              </p>
            </div>
          </div>

          {/* Feature 2: Auto Sync */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.85rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={18} color="#2563EB" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Background Cloud Auto-Sync
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                Expenses added while offline are safely saved locally and automatically synced to the cloud when you're back online.
              </p>
            </div>
          </div>

          {/* Feature 3: Category Edit & Linking */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.85rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Tag size={18} color="#7C3AED" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Category Editing & Space Linking
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                Edit custom categories anytime and link them directly to Spaces (Food & Dining, Household, Rent, Utilities, etc.).
              </p>
            </div>
          </div>

          {/* Feature 4: Maid & 80+ Icons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.85rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Brush size={18} color="#D97706" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                80+ Icons (Maid, Cleaning, Utilities)
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                Includes icons for Maid, Cook, Cleaning, Washing Machine, Room Rent, Lightbulb, Healthcare, Pets, and more.
              </p>
            </div>
          </div>

          {/* Feature 5: Native PWA */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.85rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Smartphone size={18} color="#E11D48" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Install as a Mobile App (PWA)
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                Click "Add to Home Screen" in your browser to run Pocket Khorcha full-screen just like a native phone app.
              </p>
            </div>
          </div>
        </div>

        {/* Creator Note & Action Footer */}
        <div
          style={{
            padding: '1.15rem 1.4rem',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            <span>Handcrafted for you with</span>
            <Heart size={12} color="#EF4444" fill="#EF4444" />
            <span>• Pocket Khorcha v1.2</span>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleDismiss}
            style={{
              width: '100%',
              margin: 0,
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
            }}
          >
            <span>Awesome, Let's Explore!</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
