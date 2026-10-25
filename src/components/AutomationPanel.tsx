import React from 'react';
import {
  ListOrdered,
  AlertTriangle,
  Flame,
  Droplets,
  Wind,
  Sprout,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { AutomationDecision } from '../simulation/types';

interface AutomationPanelProps {
  decision: AutomationDecision;
}

export const AutomationPanel: React.FC<AutomationPanelProps> = ({ decision }) => {
  const getRuleIcon = (category: string) => {
    switch (category) {
      case 'Emergency':
        return <AlertTriangle size={16} style={{ color: '#f43f5e' }} />;
      case 'Temperature':
        return <Flame size={16} style={{ color: '#f97316' }} />;
      case 'Humidity':
        return <Droplets size={16} style={{ color: '#06b6d4' }} />;
      case 'CO2':
        return <Wind size={16} style={{ color: '#10b981' }} />;
      case 'Watering':
        return <Sprout size={16} style={{ color: '#84cc16' }} />;
      case 'Timers':
        return <Clock size={16} style={{ color: '#8b5cf6' }} />;
      default:
        return <HelpCircle size={16} />;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      
      {/* Title & Active Rule Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListOrdered size={18} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Deterministic Controller & Priority Rule Hierarchy
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            6-Tier Strict Precedence Order (Safety/Emergency preempts all environmental rules)
          </p>
        </div>

        {/* Forced Air Cycle Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: decision.forcedVentActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.7)',
          border: `1px solid ${decision.forcedVentActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(51, 65, 85, 0.6)'}`,
          padding: '6px 12px',
          borderRadius: '8px',
        }}>
          <Wind size={16} style={{ color: decision.forcedVentActive ? '#34d399' : '#94a3b8' }} />
          <div style={{ fontSize: '11px', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, color: decision.forcedVentActive ? '#34d399' : '#cbd5e1' }}>
              {decision.forcedVentActive ? 'Forced Air Exchange Active' : 'Scheduled Air Exchange Standby'}
            </div>
            <div style={{ color: '#94a3b8' }}>
              {decision.forcedVentActive
                ? 'Evacuating stale room air (10m cycle)'
                : `Next cycle in ${decision.forcedVentCountdownMinutes} simulated mins`}
            </div>
          </div>
        </div>
      </div>

      {/* Controller Decision Status Banner */}
      <div style={{
        marginBottom: '16px',
        padding: '10px 14px',
        borderRadius: '8px',
        background: decision.emergencyActive ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        border: `1px solid ${decision.emergencyActive ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.25)'}`,
        color: decision.emergencyActive ? '#fb7185' : '#34d399',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {decision.emergencyActive ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        <span><strong>Supervisory Status:</strong> {decision.activeRuleSummary}</span>
      </div>

      {/* Rules Evaluation List (Priority 1 to 6) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {decision.rules.map((rule) => {
          const isRuleActive = rule.active;
          const isOverridden = rule.overridden;

          return (
            <div
              key={rule.priority}
              style={{
                background: isRuleActive
                  ? (rule.priority === 1 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(30, 41, 59, 0.8)')
                  : 'rgba(15, 23, 42, 0.5)',
                border: `1px solid ${
                  isRuleActive
                    ? (rule.priority === 1 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(100, 116, 139, 0.6)')
                    : 'rgba(51, 65, 85, 0.4)'
                }`,
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mono" style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isRuleActive ? '#10b981' : 'rgba(51, 65, 85, 0.6)',
                  color: isRuleActive ? '#ffffff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {rule.priority}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getRuleIcon(rule.category)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {rule.name}
                  </span>
                </div>
              </div>

              {/* Reason & Requests */}
              <div style={{ flex: '1 1 300px', fontSize: '12px', color: '#cbd5e1' }}>
                <div>{rule.reason}</div>
                {isOverridden && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} />
                    <span>Overridden: {rule.overriddenReason}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                background: isRuleActive
                  ? (isOverridden ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)')
                  : 'rgba(51, 65, 85, 0.3)',
                color: isRuleActive
                  ? (isOverridden ? '#f59e0b' : '#34d399')
                  : '#64748b',
                whiteSpace: 'nowrap',
              }}>
                {isRuleActive ? (isOverridden ? 'OVERRIDDEN' : 'ACTIVE') : 'STANDBY'}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
