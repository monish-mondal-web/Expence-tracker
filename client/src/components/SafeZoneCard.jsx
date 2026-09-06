import React from 'react';
import { formatCurrency } from '../utils/currency';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export const SafeZoneCard = ({ data }) => {
  if (!data || !data.hasBudget || data.monthlyBudget <= 0) return null;

  const {
    safeDailyBudget,
    todaySpent,
    safeRemainingToday,
    safeZoneStatus,
    safeZoneKey,
    safeZoneMessage,
  } = data;

  const renderIcon = () => {
    switch (safeZoneKey) {
      case 'exceeded':
        return <AlertCircle size={15} color="#F43F5E" />;
      case 'approaching':
        return <AlertTriangle size={15} color="#F59E0B" />;
      default:
        return <ShieldCheck size={15} color="#10B981" />;
    }
  };

  return (
    <div className="safe-zone-card">
      <div className="safe-zone-header">
        <div className="safe-zone-title-area">
          <ShieldCheck size={18} color="var(--safe-primary)" />
          <h3>TODAY'S SAFE ZONE</h3>
        </div>
        <div className={`status-pill ${safeZoneKey}`}>
          {renderIcon()}
          <span>{safeZoneStatus}</span>
        </div>
      </div>

      <div className="safe-zone-main-number">{formatCurrency(safeDailyBudget)}</div>
      <p className="safe-zone-desc">
        You can spend up to <strong>{formatCurrency(safeDailyBudget)}</strong> today and stay in the safe zone.
      </p>

      <div className="safe-zone-stats-grid">
        <div className="stat-item">
          <span>Today's Spent</span>
          <strong>{formatCurrency(todaySpent)}</strong>
        </div>
        <div className="stat-item">
          <span>Safe Remaining</span>
          <strong style={{ color: safeRemainingToday < 0 ? 'var(--danger-primary)' : 'var(--text-primary)' }}>
            {formatCurrency(safeRemainingToday)}
          </strong>
        </div>
      </div>

      <div style={{ marginTop: '0.9rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {safeZoneMessage}
      </div>
    </div>
  );
};
