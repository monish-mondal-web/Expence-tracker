import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthScreen } from './components/AuthScreen';
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
      <div className="auth-fullscreen-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ marginTop: '1rem', fontSize: '0.88rem', fontWeight: 600, color: '#64748B' }}>Loading FinFood...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
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
      {activeTab === 'analytics' && <AnalyticsPage />}
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
