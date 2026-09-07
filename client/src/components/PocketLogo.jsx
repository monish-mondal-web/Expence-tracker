import React from 'react';

export const PocketMoneyIcon = ({ size = 36, className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Pocket Khorcha Logo"
    >
      <defs>
        <linearGradient id="pkGoldCoin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="pkCashGreen1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="pkCashGreen2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="pkPocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="pkPocketRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Background Cash Notes peeking out */}
      <g transform="rotate(-12 24 24)">
        <rect x="14" y="6" width="26" height="22" rx="3" fill="url(#pkCashGreen1)" />
        <rect x="16" y="8" width="22" height="18" rx="2" fill="none" stroke="#A7F3D0" strokeWidth="1" strokeDasharray="2 1" opacity="0.8" />
        <circle cx="27" cy="17" r="4" fill="#A7F3D0" opacity="0.4" />
        <path d="M25.5 15h3m-3 1.5h3m-1.8-1.5v4.5" stroke="#047857" strokeWidth="1" strokeLinecap="round" />
      </g>

      <g transform="rotate(10 38 22)">
        <rect x="24" y="8" width="26" height="22" rx="3" fill="url(#pkCashGreen2)" />
        <rect x="26" y="10" width="22" height="18" rx="2" fill="none" stroke="#D1FAE5" strokeWidth="1" strokeDasharray="2 1" opacity="0.9" />
        <circle cx="37" cy="19" r="4" fill="#D1FAE5" opacity="0.5" />
        <path d="M35.5 17h3m-3 1.5h3m-1.8-1.5v4.5" stroke="#065F46" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Gold Rupee Coin */}
      <g>
        <circle cx="43" cy="25" r="9" fill="rgba(0,0,0,0.15)" />
        <circle cx="42" cy="24" r="9" fill="url(#pkGoldCoin)" stroke="#B45309" strokeWidth="1" />
        <circle cx="42" cy="24" r="7" fill="none" stroke="#FEF08A" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <text
          x="42"
          y="27.5"
          fontFamily="'Plus Jakarta Sans', Inter, -apple-system, sans-serif"
          fontSize="9"
          fontWeight="900"
          fill="#78350F"
          textAnchor="middle"
        >
          ₹
        </text>
      </g>

      {/* Pocket Body */}
      <path
        d="M 10 24 Q 32 27 54 24 L 51 46 Q 49 52 44 56 L 32 61 L 20 56 Q 15 52 13 46 Z"
        fill="url(#pkPocketBody)"
      />

      {/* Pocket Rim */}
      <path
        d="M 10 24 Q 32 27 54 24 L 53.5 28.5 Q 32 31 10.5 28.5 Z"
        fill="url(#pkPocketRim)"
      />

      {/* Stitching */}
      <path
        d="M 12.5 30 Q 32 32.5 51.5 30"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="1.2"
        strokeDasharray="2.5 2"
        opacity="0.75"
      />
      <path
        d="M 15 45 Q 16.5 50 21 53.5 L 32 58 L 43 53.5 Q 47.5 50 49 45"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="1.2"
        strokeDasharray="2.5 2"
        opacity="0.85"
      />

      {/* Pocket Rivet */}
      <circle cx="32" cy="40" r="3" fill="#F59E0B" />
      <circle cx="32" cy="40" r="1.5" fill="#FEF08A" />
    </svg>
  );
};

export const PocketLogo = ({ size = 32, showText = true, subtitle = null, className = '' }) => {
  return (
    <div
      className={`pocket-logo-brand ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}
    >
      <PocketMoneyIcon size={size} />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', var(--font-sans)",
              fontWeight: 800,
              fontSize: size >= 40 ? '1.4rem' : size >= 32 ? '1.15rem' : '0.98rem',
              color: '#0F172A',
              letterSpacing: '-0.025em',
            }}
          >
            Pocket Khorcha
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#64748B',
                fontWeight: 500,
                marginTop: '2px',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PocketLogo;
