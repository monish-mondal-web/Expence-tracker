import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';

export const LoadingBar = ({
  appName = "FinFood",
  subtitle = "Smart Food Budget & Expense Tracker",
  message = "Loading your food budget...",
  progress: externalProgress,
  fullScreen = true,
}) => {
  const [internalProgress, setInternalProgress] = useState(externalProgress ?? 15);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(externalProgress);
      return;
    }

    // Smooth fluid progression 15% -> 96%
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 96) {
          clearInterval(interval);
          return 96;
        }
        const increment = Math.max(1, Math.floor(Math.random() * 8) + 2);
        return Math.min(96, prev + increment);
      });
    }, 110);

    return () => clearInterval(interval);
  }, [externalProgress]);

  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  const content = (
    <div className="water-loader-content">
      {/* App Branding Header */}
      <div className="water-loader-brand">
        <div className="water-loader-brand-badge">
          <Leaf size={12} color="#059669" />
          <span>Expense Tracker</span>
        </div>
        <h1 className="water-loader-app-title">
          {appName}<span className="accent">.</span>
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500, margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* Water Globe Vessel with Undulating Waves and Bubbles */}
      <div className="water-vessel-container" aria-label={`Loading ${currentProgress}%`}>
        {/* Liquid level */}
        <div
          className="water-liquid-body"
          style={{ height: `${Math.min(100, Math.max(12, currentProgress))}%` }}
        >
          {/* Waves on the water surface */}
          <div className="water-wave-front" />
          <div className="water-wave-back" />

          {/* Floating water bubbles */}
          <span className="water-bubble b1" />
          <span className="water-bubble b2" />
          <span className="water-bubble b3" />
          <span className="water-bubble b4" />
          <span className="water-bubble b5" />
        </div>

        {/* Counter in center */}
        <div className="water-vessel-counter">
          {Math.round(currentProgress)}%
        </div>
      </div>

      {/* Horizontal Water Progress Bar below vessel */}
      <div className="water-progressbar-wrapper">
        <div className="water-progressbar-track">
          <div
            className="water-progressbar-fill"
            style={{ width: `${Math.min(100, Math.max(6, currentProgress))}%` }}
          />
        </div>
        <p className="water-loader-status-msg">{message}</p>
      </div>
    </div>
  );

  if (!fullScreen) {
    return <div className="water-loader-inline">{content}</div>;
  }

  return (
    <div className="water-loader-fullscreen">
      {content}
    </div>
  );
};

export default LoadingBar;
