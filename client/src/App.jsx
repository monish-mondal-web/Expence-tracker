import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthScreen } from './components/AuthScreen';
import { LoadingBar } from './components/LoadingBar';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent = () => {
  const { activeTab } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingBar
        appName="FinFood"
        subtitle="Smart Food Budget & Expense Tracker"
        message="Loading your smart food budget..."
      />
    );
  }

  // STRICT AUTH WALL: Without login, app entry is NOT allowed
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    );
  }

  return (
    <MainLayout>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'expenses' && <ExpensesPage />}
      {(activeTab === 'budget' || activeTab === 'analytics') && <AnalyticsPage />}
      {activeTab === 'calendar' && <CalendarPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
