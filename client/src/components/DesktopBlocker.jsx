import React from 'react';
import { Smartphone } from 'lucide-react';

export const DesktopBlocker = () => {
  return (
    <div className="desktop-blocker-overlay">
      <div className="desktop-blocker-card">
        <div className="desktop-blocker-icon-wrap">
          <Smartphone size={36} strokeWidth={2} color="#10B981" />
        </div>
        <span className="desktop-blocker-tag">Mobile Only</span>
        <h2 className="desktop-blocker-title">Open in Mobile</h2>
        <p className="desktop-blocker-desc">
          Pocket Khorcha is designed exclusively for mobile screens and is not desktop ready.
        </p>
        <div className="desktop-blocker-hint">
          <span>Please open this website on your mobile device, or press <code>F12</code> &rarr; <code>Ctrl + Shift + M</code> to switch to mobile view.</span>
        </div>
      </div>
    </div>
  );
};
