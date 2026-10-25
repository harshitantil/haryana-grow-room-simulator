import React from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../simulation/defaults';
import { SimulationSettings } from '../simulation/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SimulationSettings;
  updateSettings: (partial: Partial<SimulationSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        position: 'relative',
        background: '#0f172a',
        border: '1px solid rgba(100, 116, 139, 0.6)',
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              Simulation & Controller Parameter Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Configuration Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Group 1: Thermal Setpoints */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              Thermal Actuation Thresholds
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Heating Trigger (°C)
                </label>
                <input
                  type="number"
                  value={settings.tempHeatingThreshold}
                  onChange={(e) => updateSettings({ tempHeatingThreshold: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Turns heater ON below this temp</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Cooling Trigger (°C)
                </label>
                <input
                  type="number"
                  value={settings.tempCoolingThreshold}
                  onChange={(e) => updateSettings({ tempCoolingThreshold: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Turns AC ON above this temp</span>
              </div>
            </div>
          </div>

          {/* Group 2: Humidity Setpoints */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              Relative Humidity Actuation Thresholds
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Humidifier Trigger (% RH)
                </label>
                <input
                  type="number"
                  value={settings.humidityLowThreshold}
                  onChange={(e) => updateSettings({ humidityLowThreshold: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Turns humidifier ON below this</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Dehumidifier Trigger (% RH)
                </label>
                <input
                  type="number"
                  value={settings.humidityHighThreshold}
                  onChange={(e) => updateSettings({ humidityHighThreshold: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Turns dehumidifier ON above this</span>
              </div>
            </div>
          </div>

          {/* Group 3: Photoperiod & Ventilation Timers */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              Photoperiod Schedule & Bi-Hourly Ventilation Cycle
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Day Start Hour (24h)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.dayStartHour}
                  onChange={(e) => updateSettings({ dayStartHour: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Day End Hour (24h)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.dayEndHour}
                  onChange={(e) => updateSettings({ dayEndHour: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Forced Vent Interval (mins)
                </label>
                <input
                  type="number"
                  value={settings.forcedVentIntervalMinutes}
                  onChange={(e) => updateSettings({ forcedVentIntervalMinutes: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Default 120 mins (every 2 hours)</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Forced Vent Duration (mins)
                </label>
                <input
                  type="number"
                  value={settings.forcedVentDurationMinutes}
                  onChange={(e) => updateSettings({ forcedVentDurationMinutes: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Default 10 mins air purge</span>
              </div>
            </div>
          </div>

          {/* Group 4: Substrate Irrigation & Carbon Filter */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              Irrigation & Filter Accessories
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Dry Substrate Irrigation Trigger (%)
                </label>
                <input
                  type="number"
                  value={settings.substrateDryThreshold}
                  onChange={(e) => updateSettings({ substrateDryThreshold: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Carbon Filter Efficiency (0 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={settings.carbonFilterEfficiency}
                  onChange={(e) => updateSettings({ carbonFilterEfficiency: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Flow factor through filter bed</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
          <button
            onClick={() => updateSettings(DEFAULT_SETTINGS)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
            Reset Defaults
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
