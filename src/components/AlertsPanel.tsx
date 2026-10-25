import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Check,
  CheckCheck,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { Alert } from '../simulation/types';

interface AlertsPanelProps {
  alerts: Alert[];
  acknowledgeAlert: (id: string) => void;
  clearAlertHistory: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  acknowledgeAlert,
  clearAlertHistory,
}) => {
  const activeAlerts = alerts.filter((a) => a.active);
  const historicalAlerts = alerts.filter((a) => !a.active);

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      
      {/* Title & Clear History */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: activeAlerts.length > 0 ? '#f43f5e' : '#10b981' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Safety Alarms & Supervisory Alert Log
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Active emergencies ({activeAlerts.length}) • Historical events ({historicalAlerts.length})
          </p>
        </div>

        {historicalAlerts.length > 0 && (
          <button
            onClick={clearAlertHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
            Clear Inactive History
          </button>
        )}
      </div>

      {/* When no alerts exist */}
      {alerts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          color: '#64748b',
          fontSize: '13px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '8px',
          border: '1px dashed rgba(51, 65, 85, 0.5)',
        }}>
          All environmental parameters are within safe operating limits. No active or historical alarms.
        </div>
      )}

      {/* Alerts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.map((alert) => {
          const isEmergency = alert.severity === 'emergency';
          const isActive = alert.active;

          return (
            <div
              key={alert.id}
              style={{
                borderRadius: '8px',
                padding: '12px 16px',
                background: isActive
                  ? (isEmergency ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)')
                  : 'rgba(15, 23, 42, 0.4)',
                border: `1px solid ${
                  isActive
                    ? (isEmergency ? 'rgba(244, 63, 94, 0.45)' : 'rgba(245, 158, 11, 0.4)')
                    : 'rgba(51, 65, 85, 0.4)'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                opacity: isActive ? 1 : 0.65,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Header row: Icon, Title, Status, Timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isEmergency ? (
                    <AlertOctagon size={18} style={{ color: isActive ? '#f43f5e' : '#94a3b8' }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: isActive ? '#f59e0b' : '#94a3b8' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#f8fafc' : '#94a3b8' }}>
                    {alert.title}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isActive ? (isEmergency ? '#f43f5e' : '#f59e0b') : '#475569',
                    color: '#ffffff',
                  }}>
                    {isActive ? (isEmergency ? 'EMERGENCY' : 'WARNING') : 'RESOLVED'}
                  </span>
                </div>

                <div className="mono" style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {alert.timestamp}
                </div>
              </div>

              {/* Cause & Suggested Response */}
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
                <div><strong>Cause:</strong> {alert.cause}</div>
                <div style={{ color: '#38bdf8', marginTop: '3px' }}>
                  <strong>Suggested Response:</strong> {alert.suggestedResponse}
                </div>
              </div>

              {/* Acknowledge Button */}
              {isActive && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={alert.acknowledged}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: alert.acknowledged ? 'rgba(51, 65, 85, 0.4)' : 'rgba(30, 41, 59, 0.8)',
                      color: alert.acknowledged ? '#64748b' : '#cbd5e1',
                      fontSize: '11px',
                      cursor: alert.acknowledged ? 'default' : 'pointer',
                    }}
                  >
                    {alert.acknowledged ? (
                      <>
                        <CheckCheck size={13} style={{ color: '#10b981' }} />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>Acknowledge Alarm</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
