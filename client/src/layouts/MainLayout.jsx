import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMonthYear } from '../utils/date';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { AddSpaceModal } from '../components/AddSpaceModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { AuthModal } from '../components/AuthModal';
import { Toast } from '../components/Toast';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { UpdateAnnouncementModal } from '../components/UpdateAnnouncementModal';

import {
  Home,
  PieChart,
  Receipt,
  Menu,
  Plus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from 'lucide-react';

export const MainLayout = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    setActiveSpace,
    currentMonth,
    currentYear,
    prevMonth,
    nextMonth,
    openAddExpense,
  } = useApp();

  const { user, isAuthenticated } = useAuth();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Dynamic user data from logged in session
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : (isAuthenticated ? 'User' : 'Guest'));
  const displayInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  // Dynamic current date formatting (e.g. "7 Sep")
  const todayDate = new Date();
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayFormatted = `${todayDate.getDate()} ${shortMonths[todayDate.getMonth()]}`;

  return (
    <div className="fintech-app-wrapper">
      <div className="fintech-phone-container">
        {/* 1. Header matching reference image */}
        <header className="fintech-header">
          <div className="header-top-row">
            {/* Left: Greeting, Name */}
            <div className="header-user-info">
              <span className="header-greeting-lbl">{getGreeting()}</span>
              <h1 className="header-name-title">
                <span>{displayName}</span>
                <span className="wave-icon">👋</span>
              </h1>
            </div>

            {/* Right: Calendar Date & Profile Avatar button */}
            <div className="header-action-buttons">
              <button
                type="button"
                className={`header-calendar-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveTab('calendar')}
                title={`Calendar (${todayFormatted})`}
                aria-label="Open Calendar page"
              >
                <CalendarDays size={15} />
                <span className="header-calendar-date-lbl">{todayFormatted}</span>
              </button>

              <button
                type="button"
                className="header-avatar-btn"
                onClick={() => setIsProfileDrawerOpen(true)}
                title="Account & Profile Settings"
                aria-label="Account and Profile Settings"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} className="header-avatar-img" />
                ) : (
                  <div className="header-avatar-fallback">{displayInitials}</div>
                )}
              </button>
            </div>
          </div>

          {/* Sub-Header Positive Status Pill (Right-aligned / Under Header) */}
          <div className="header-status-row">
            <div className="positive-status-pill">
              <div className="status-leaf-circle">
                <Leaf size={12} color="#059669" />
              </div>
              <div className="status-pill-text">
                <span className="status-main-lbl">Stay consistent</span>
                <span className="status-sub-lbl">You're doing great!</span>
              </div>
            </div>
          </div>
        </header>

        {/* Month Selector Bar when clicked */}
        {showMonthPicker && (
          <div className="month-picker-strip">
            <button type="button" className="month-strip-btn" onClick={prevMonth} title="Previous Month">
              <ChevronLeft size={16} />
            </button>
            <span className="month-strip-label">
              {formatMonthYear(currentMonth, currentYear)}
            </span>
            <button type="button" className="month-strip-btn" onClick={nextMonth} title="Next Month">
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* 2. Main Page Content */}
        <main className="fintech-main-scrollable">
          {children}
        </main>

        {/* 3. Bottom Navigation matching reference image */}
        <nav className="fintech-bottom-navbar">
          {/* Slot 1: Home */}
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setActiveSpace('Food & Dining');
            }}
          >
            <div className="nav-icon-box">
              <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.4 : 1.8} />
            </div>
            <span className="nav-text">Home</span>
          </button>

          {/* Slot 2: Budget */}
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'budget' || activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <div className="nav-icon-box">
              <PieChart size={20} strokeWidth={activeTab === 'budget' || activeTab === 'analytics' ? 2.4 : 1.8} />
            </div>
            <span className="nav-text">Budget</span>
          </button>

          {/* Slot 3: Center Elevated Floating Green Add Button */}
          <button
            type="button"
            className="bottom-nav-floating-add"
            onClick={() => openAddExpense()}
            title="Add Food Expense"
            aria-label="Add Food Expense"
          >
            <Plus size={26} strokeWidth={2.8} color="#FFFFFF" />
          </button>

          {/* Slot 4: Expenses */}
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <div className="nav-icon-box">
              <Receipt size={20} strokeWidth={activeTab === 'expenses' ? 2.4 : 1.8} />
            </div>
            <span className="nav-text">Expenses</span>
          </button>

          {/* Slot 5: More (Settings/Menu) */}
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <div className="nav-icon-box">
              <Menu size={20} strokeWidth={activeTab === 'settings' ? 2.4 : 1.8} />
            </div>
            <span className="nav-text">More</span>
          </button>
        </nav>
      </div>

      {/* Global Modals & Notifications */}
      <AddExpenseModal />
      <SetBudgetModal />
      <AddSpaceModal />
      <ConfirmModal />
      <AuthModal />
      <Toast />
      <UpdateAnnouncementModal />

      {/* Account Profile Slide-out Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />
    </div>
  );
};
