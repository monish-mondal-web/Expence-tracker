import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';

export const LoadingBar = ({
  appName = "FinFood",
  subtitle = "Smart Food Budget & Expense Tracker",
  message = "Loading your food budget...",
  progress: externalProgress,
  fullScreen = true,
  onComplete,
}) => {
  const [internalProgress, setInternalProgress] = useState(externalProgress ?? 0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(externalProgress);
      if (externalProgress >= 100) {
        setIsFadingOut(true);
        const timer = setTimeout(() => {
          onComplete?.();
        }, 300);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Smooth fluid progression from 0% -> 100% over ~1.6s
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        let step = 2;
        if (prev < 30) step = 3;
        else if (prev < 70) step = 2;
        else if (prev < 90) step = 2;
        else step = 1;

        return Math.min(100, prev + step);
      });
    }, 28);

    return () => clearInterval(interval);
  }, [externalProgress, onComplete]);

  // When 100% is reached, smoothly trigger onComplete callback
  useEffect(() => {
    if (internalProgress >= 100 && externalProgress === undefined) {
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 180);

      const doneTimer = setTimeout(() => {
        onComplete?.();
      }, 480);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(doneTimer);
      };
    }
  }, [internalProgress, externalProgress, onComplete]);

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
          style={{ height: `${Math.min(100, Math.max(8, currentProgress))}%` }}
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
            style={{ width: `${Math.min(100, Math.max(4, currentProgress))}%` }}
          />
        </div>
        <p className="water-loader-status-msg">
          {currentProgress >= 100 ? "Ready! Opening FinFood..." : message}
        </p>
      </div>
    </div>
  );

  if (!fullScreen) {
    return <div className="water-loader-inline">{content}</div>;
  }

  return (
    <div className={`water-loader-fullscreen ${isFadingOut ? 'fade-out' : ''}`}>
      {content}
    </div>
  );
};

export default LoadingBar;
