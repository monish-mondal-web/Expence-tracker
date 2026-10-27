import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PocketMoneyIcon } from './PocketLogo';
import { useApp } from '../context/AppContext';
import {
  WifiOff,
  RefreshCw,
  Tag,
  Brush,
  X,
  ShieldCheck,
  Rocket,
  PartyPopper,
  RotateCcw,
  CalendarDays,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';

const STORAGE_KEY = 'pk_v1_3_update_announced';

export const UpdateAnnouncementModal = () => {
  const { showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      // ONLY if never seen before, open once after entrance delay
      if (!hasSeen || hasSeen !== 'true') {
        const timer = setTimeout(() => {
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

  // Listen for manual trigger (e.g. from Settings "View What's New in v1.2")
  useEffect(() => {
    const handleManualOpen = () => {
      setIsCelebrating(false);
      setIsOpen(true);
    };
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

  // Amazing interactive celebration on click!
  const handleCelebrate = () => {
    setIsCelebrating(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // Festive confetti cannons burst
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#10B981', '#059669', '#F59E0B', '#3B82F6', '#F43F5E', '#8B5CF6'],
        disableForReducedMotion: true,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.05, y: 0.7 },
          colors: ['#10B981', '#FDE047', '#059669'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.7 },
          colors: ['#10B981', '#FDE047', '#059669'],
        });
      }, 220);
    } catch (err) {
      console.error('Confetti burst error:', err);
    }

    showToast('🎉 Woohoo! Pocket Khorcha v1.3 Activated! Clean sync & multi-month ready.', 'success');

    // Smoothly close after user sees the celebration effect
    setTimeout(() => {
      setIsOpen(false);
      setIsCelebrating(false);
    }, 750);
  };

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
            title="Close"
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
              <span>Pocket Khorcha • v1.3 Release</span>
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
            Smarter Sync & Month Controls!
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              color: 'rgba(236, 253, 245, 0.9)',
              lineHeight: 1.4,
              maxWidth: '350px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Automatic budget reset, complete calendar history, zero-latency deletions, and flawless offline-to-cloud synchronization.
          </p>
        </div>

        {/* Features Content List */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            maxHeight: '280px',
            overflowY: 'auto',
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Item 1: Clean Offline Sync */}
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
              <RefreshCw size={18} color="#059669" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Clean Offline & Cloud Sync
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Seamlessly saves offline. Reconnecting to internet updates the cloud cleanly without old deleted records resurfacing.
              </p>
            </div>
          </div>

          {/* Item 2: Month-End Budget Reset */}
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
              <RotateCcw size={18} color="#D97706" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Month-End Budget Auto-Reset
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                When a month ends or you switch to an unbudgeted month, previous budgets cleanly reset to zero and prompt for new targets.
              </p>
            </div>
          </div>

          {/* Item 3: Calendar History & Auto-Selection */}
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
              <CalendarDays size={18} color="#2563EB" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Full Calendar History Access
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Navigate back to any past month in Calendar to view all historical spending dots, day details, and exact expense logs.
              </p>
            </div>
          </div>

          {/* Item 4: Instant 0ms Delete */}
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
                background: '#FFF1F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} color="#E11D48" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Instant Optimistic Deletion
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Deleting an expense removes it immediately from your screen, dashboard totals, and local storage with zero delay.
              </p>
            </div>
          </div>

          {/* Item 5: Global Month Switcher */}
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
              <SlidersHorizontal size={18} color="#7C3AED" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Universal Month Navigation
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.38 }}>
                Easily toggle between months from the top header or the Expenses page to inspect your full spending journey.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions with Interactive Celebration CTA */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleCelebrate}
            disabled={isCelebrating}
            style={{
              width: '100%',
              margin: 0,
              padding: '0.9rem 1rem',
              fontSize: '0.96rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '14px',
              background: isCelebrating
                ? 'linear-gradient(135deg, #047857 0%, #065F46 100%)'
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.38)',
              cursor: 'pointer',
              transform: isCelebrating ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {isCelebrating ? (
              <>
                <PartyPopper size={20} color="#FDE047" />
                <span>Woohoo! Welcome to v1.3 🎉</span>
              </>
            ) : (
              <>
                <Rocket size={19} color="#FFFFFF" />
                <span>Explore v1.3 Features 🚀</span>
              </>
            )}
          </button>

          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
            Tap to activate offline power & save changes
          </span>
        </div>
      </div>
    </div>
  );
};
