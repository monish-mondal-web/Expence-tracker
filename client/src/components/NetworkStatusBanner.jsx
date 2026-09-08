import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NetworkStatusBanner = () => {
  const { isOnline, isSyncing, pendingSyncCount, syncNow } = useApp();

  // If online and nothing is syncing and no pending items, stay hidden
  if (isOnline && !isSyncing && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className="network-status-wrapper">
      {!isOnline && (
        <div className="network-status-pill offline">
          <WifiOff size={15} strokeWidth={2.4} />
          <span>
            Offline Mode — Changes saved locally
            {pendingSyncCount > 0 && ` (${pendingSyncCount} pending)`}
          </span>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="network-status-pill syncing">
          <RefreshCw size={14} className="animate-spin" strokeWidth={2.4} />
          <span>
            Syncing {pendingSyncCount} change{pendingSyncCount > 1 ? 's' : ''} with cloud...
          </span>
        </div>
      )}

      {isOnline && !isSyncing && pendingSyncCount > 0 && (
        <div className="network-status-pill pending" onClick={syncNow} role="button" title="Click to sync now">
          <RefreshCw size={14} strokeWidth={2.4} />
          <span>
            {pendingSyncCount} pending change{pendingSyncCount > 1 ? 's' : ''} • Tap to sync
          </span>
        </div>
      )}
    </div>
  );
};
