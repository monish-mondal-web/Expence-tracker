import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const SmartDailyMessage = ({ data }) => {
  if (!data || !data.hasBudget || !data.smartMessage) return null;

  const { safeZoneKey, smartMessage } = data;

  const renderIcon = () => {
    switch (safeZoneKey) {
      case 'exceeded':
        return <AlertCircle size={18} />;
      case 'approaching':
        return <AlertCircle size={18} />;
      default:
        return <CheckCircle size={18} />;
    }
  };

  return (
    <div className={`smart-message-card ${safeZoneKey}`}>
      <div className={`smart-message-icon ${safeZoneKey}`}>{renderIcon()}</div>
      <div className="smart-message-text">{smartMessage}</div>
    </div>
  );
};
