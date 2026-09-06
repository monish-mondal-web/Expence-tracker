import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  X,
  LogOut,
  User,
  Target,
  Plus,
  ShieldCheck,
  ChevronRight,
  Mail,
} from 'lucide-react';

export const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { setActiveTab, openSetBudget, openAddExpense, showToast, triggerRefresh } = useApp();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = user?.name || 'FinFood User';
  const displayEmail = user?.email || 'user@finfood.com';

  const handleLogout = () => {
    onClose();
    logout();
    showToast('Signed out successfully.');
    triggerRefresh();
  };

  const handleGoToSettings = () => {
    onClose();
    setActiveTab('settings');
  };

  const handleOpenBudget = () => {
    onClose();
    openSetBudget();
  };

  const handleOpenExpense = () => {
    onClose();
    openAddExpense();
  };

  return (
    <div className="profile-drawer-root">
      {/* Backdrop */}
      <div className="profile-drawer-backdrop" onClick={onClose} />

      {/* Drawer Panel */}
      <aside className="profile-drawer-panel" role="dialog" aria-modal="true">
        {/* Drawer Header */}
        <div className="profile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="#0F172A" />
            <h2 className="profile-drawer-title">Account</h2>
          </div>
          <button
            type="button"
            className="profile-drawer-close"
            onClick={onClose}
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="profile-user-card">
          <div className="profile-avatar-wrapper">
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="profile-drawer-avatar" />
            ) : (
              <div className="profile-avatar-fallback">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="profile-active-dot" title="Active Account" />
          </div>

          <div className="profile-user-meta">
            <h3 className="profile-user-name">{displayName}</h3>
            <div className="profile-user-email">
              <Mail size={12} />
              <span>{displayEmail}</span>
            </div>
            <div className="profile-badge">
              <ShieldCheck size={12} color="#10B981" />
              <span>FinFood Verified Account</span>
            </div>
          </div>
        </div>

        {/* Quick Menu Actions */}
        <div className="profile-menu-section">
          <span className="profile-section-label">Quick Actions</span>

          <button type="button" className="profile-menu-row" onClick={handleGoToSettings}>
            <div className="profile-menu-icon">
              <User size={16} color="#0F172A" />
            </div>
            <div className="profile-menu-text">
              <strong>Profile & Cartoon Avatar</strong>
              <span>Customize name and cartoon character</span>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>

          <button type="button" className="profile-menu-row" onClick={handleOpenBudget}>
            <div className="profile-menu-icon">
              <Target size={16} color="#0F172A" />
            </div>
            <div className="profile-menu-text">
              <strong>Monthly Food Budget</strong>
              <span>Configure budget limits & safe spend</span>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>

          <button type="button" className="profile-menu-row" onClick={handleOpenExpense}>
            <div className="profile-menu-icon">
              <Plus size={16} color="#0F172A" />
            </div>
            <div className="profile-menu-text">
              <strong>Add Food Expense</strong>
              <span>Log meal, grocery, or snack cost</span>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>
        </div>

        {/* Bottom Sign Out Area */}
        <div className="profile-drawer-footer">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
            title="Sign out of your account"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>

          <p className="profile-footer-copy">
            FinFood Tracker &bull; 100% Real Database Mode
          </p>
        </div>
      </aside>
    </div>
  );
};
