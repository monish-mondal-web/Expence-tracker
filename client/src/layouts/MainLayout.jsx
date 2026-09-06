import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMonthYear } from '../utils/date';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { AuthModal } from '../components/AuthModal';
import { Toast } from '../components/Toast';
import { ProfileDrawer } from '../components/ProfileDrawer';

import {
  Home,
  PieChart,
  Receipt,
  Menu,
  Plus,
  CalendarDays,
  User,
  UserCheck,
  LogOut,
  UtensilsCrossed,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const MainLayout = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    currentMonth,
    currentYear,
    prevMonth,
    nextMonth,
    openAddExpense,
    openSetBudget,
    triggerRefresh,
  } = useApp();

  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);


  // Real user data - zero hardcoded dummy values
  const displayName = user?.name || (isAuthenticated ? 'User' : 'Guest');
  const displayInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'G';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Budget', icon: PieChart },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'settings', label: 'Menu', icon: Menu },
  ];

  const handleLogout = () => {
    logout();
    triggerRefresh();
  };

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <UtensilsCrossed size={20} />
          </div>
          <div className="brand-info">
            <h2>FinFood</h2>
            <span>Budget & Safe Zone</span>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="quick-add-btn"
            onClick={() => openAddExpense()}
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </button>

          {/* User Profile Card */}
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.2rem', cursor: 'pointer' }}
            onClick={() => setIsProfileDrawerOpen(true)}
            title="Open Account Menu"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div
                className="user-avatar"
                style={{
                  width: '36px',
                  height: '36px',
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  displayInitials
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user ? user.email : 'Account'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileDrawerOpen(true);
              }}
              title="Account Menu & Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="app-main">
        {/* Header directly matching mobile reference */}
        <header className="app-header">
          {/* Left: Avatar + Name (Good Morning removed) */}
          <div
            className="header-greeting"
            onClick={() => setIsProfileDrawerOpen(true)}
            title="Open Account Menu"
          >
            <div
              className="user-avatar"
              style={{
                width: '40px',
                height: '40px',
                background: '#E2E8F0',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#0F172A',
                cursor: 'pointer',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                displayInitials
              )}
            </div>
            <div className="greeting-text" style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {displayName}
              </h1>
            </div>
          </div>

          {/* Right: Month Switcher & Account Profile Trigger */}
          <div className="header-controls">
            {/* 1. Month / Calendar Selector */}
            <button
              type="button"
              className={`action-icon-btn ${showMonthPicker ? 'active-icon' : ''}`}
              onClick={() => setShowMonthPicker((prev) => !prev)}
              title={`Month: ${formatMonthYear(currentMonth, currentYear)} (Click to switch)`}
            >
              <CalendarDays size={18} />
            </button>

            {/* 2. User Account Drawer Trigger */}
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => setIsProfileDrawerOpen(true)}
              title="Account Menu & Sign Out"
            >
              <UserCheck size={18} color="#0F172A" />
            </button>
          </div>

        </header>

        {/* Collapsible Sleek Month Selector Strip */}
        {showMonthPicker && (
          <div className="mobile-month-bar">
            <button type="button" className="month-nav-btn" onClick={prevMonth} title="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="month-bar-title">
              {formatMonthYear(currentMonth, currentYear)}
            </span>
            <button type="button" className="month-nav-btn" onClick={nextMonth} title="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="page-content">{children}</main>
      </div>

      {/* Mobile Bottom Navigation with Center '+' Add Expense Button */}
      <nav className="mobile-bottom-nav">
        {/* Slot 1: Home */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
          <span>Home</span>
        </button>

        {/* Slot 2: Budget */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <PieChart size={20} strokeWidth={activeTab === 'calendar' ? 2.5 : 1.8} />
          <span>Budget</span>
        </button>

        {/* Slot 3 (Center): Elevated '+' Quick Add Expense Button */}
        <button
          type="button"
          className="mobile-center-add-btn"
          onClick={() => openAddExpense()}
          title="Add Expense"
          aria-label="Add Expense"
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>

        {/* Slot 4: Expenses */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={20} strokeWidth={activeTab === 'expenses' ? 2.5 : 1.8} />
          <span>Expenses</span>
        </button>

        {/* Slot 5: Menu / Settings */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Menu size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 1.8} />
          <span>Menu</span>
        </button>
      </nav>


      {/* Modals & Toast */}
      <AddExpenseModal />
      <SetBudgetModal />
      <ConfirmModal />
      <AuthModal />
      <Toast />

      {/* Account Profile Slide-out Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />
    </div>

  );
};
