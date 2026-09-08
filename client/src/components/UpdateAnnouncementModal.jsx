import React, { useState, useEffect, useCallback } from 'react';
import { PocketMoneyIcon } from './PocketLogo';
import {
  WifiOff,
  RefreshCw,
  Tag,
  Brush,
  Smartphone,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const STORAGE_KEY = 'pk_v1_2_update_announced';

export const UpdateAnnouncementModal = () => {
  // Check localStorage immediately on initialize
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      // ONLY if never seen before, open once after entrance delay
      if (!hasSeen || hasSeen !== 'true') {
        const timer = setTimeout(() => {
          // Double check before opening in case dismissed in another tab
          if (localStorage.getItem(STORAGE_KEY) !== 'true') {
            setIsOpen(true);
          }
        }, 650);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('LocalStorage error checking update modal state:', e);
    }
  }, []);

  // Listen for manual trigger (e.g. from Settings "View What's New")
  useEffect(() => {
    const handleManualOpen = () => setIsOpen(true);
    window.addEventListener('pk:open-update-modal', handleManualOpen);
    return () => window.removeEventListener('pk:open-update-modal', handleManualOpen);
  }, []);

  // Strict one-time dismiss - saves immediately to localStorage so refresh NEVER shows it again
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    setIsOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleDismiss}
      style={{
        zIndex: 1200,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="modal-content update-announcement-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 40px rgba(5, 150, 105, 0.18)',
          background: '#FFFFFF',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Header with App Logo & Title */}
        <div
          style={{
            background: 'linear-gradient(145deg, #064E3B 0%, #065F46 45%, #047857 100%)',
            padding: '1.65rem 1.4rem 1.35rem',
            position: 'relative',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          {/* Close Button 'X' - clicking immediately saves and never opens again */}
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255, 255, 255, 0.16)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            title="Close and don't show again"
            aria-label="Close popup"
          >
            <X size={17} />
          </button>

          {/* App Logo with soft glowing pedestal */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              marginBottom: '12px',
            }}
          >
            <PocketMoneyIcon size={46} />
          </div>

          {/* Version Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.18)',
                padding: '3px 12px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#ECFDF5',
              }}
            >
              <ShieldCheck size={13} color="#34D399" />
              <span>Pocket Khorcha • v1.2 Release</span>
            </span>
          </div>

          <h2
            style={{
              fontSize: '1.38rem',
              fontWeight: 800,
              lineHeight: 1.25,
              margin: '0 0 6px',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            Now Works 100% Offline!
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              color: 'rgba(236, 253, 245, 0.9)',
              lineHeight: 1.4,
              maxWidth: '340px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Track and manage your expenses anytime, anywhere — even without an active internet connection.
          </p>
        </div>

        {/* Features Content List */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            maxHeight: '300px',
            overflowY: 'auto',
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Item 1: Offline */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.8rem 0.9rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Zero-Data Offline Support
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                The app launches immediately in offline or airplane mode with your full budget and past records ready.
              </p>
            </div>
          </div>

          {/* Item 2: Auto Sync */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.8rem 0.9rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Automatic Cloud Sync
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Any expenses recorded while offline are queued locally and quietly uploaded when internet reconnects.
              </p>
            </div>
          </div>

          {/* Item 3: Category Edit & Space Linking */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.8rem 0.9rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Category Edit & Space Linking
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Edit category names, icons, and colors anytime, and link them to Spaces (Food, Maid, Utilities, Rent).
              </p>
            </div>
          </div>

          {/* Item 4: Maid & 80+ Icons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#FFFFFF',
              padding: '0.8rem 0.9rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                80+ Icons (Maid, Cook, Utilities)
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Dedicated icons for Maid/Cleaning, Cook, Washing Machine, Room Rent, Lightbulb, Healthcare & more.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleDismiss}
            style={{
              width: '100%',
              margin: 0,
              padding: '0.82rem',
              fontSize: '0.94rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              cursor: 'pointer',
            }}
          >
            <Check size={18} strokeWidth={2.6} />
            <span>Got it, Don't show again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
