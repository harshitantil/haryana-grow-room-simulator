import React from 'react';
import {
  Sparkles,
  Flame,
  Snowflake,
  CloudRain,
  Wind,
  Sprout,
  Database,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { SCENARIO_PRESETS } from '../simulation/scenarios';

interface ScenarioControlsProps {
  loadScenario: (presetId: string) => void;
  resetSimulation: () => void;
  refillReservoir: () => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  loadScenario,
  resetSimulation,
  refillReservoir,
}) => {
  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'summer_heatwave':
        return <Flame size={16} style={{ color: '#f43f5e' }} />;
      case 'winter_cold_night':
        return <Snowflake size={16} style={{ color: '#06b6d4' }} />;
      case 'high_humidity':
        return <CloudRain size={16} style={{ color: '#38bdf8' }} />;
      case 'low_co2':
        return <Wind size={16} style={{ color: '#10b981' }} />;
      case 'dry_substrate':
        return <Sprout size={16} style={{ color: '#84cc16' }} />;
      case 'empty_reservoir':
        return <Database size={16} style={{ color: '#ef4444' }} />;
      default:
        return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Scenario Presets & Educational Stress Tests
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Quick-load Haryana climate extremes and critical hardware failure boundaries
          </p>
        </div>

        {/* Global actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={refillReservoir}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              background: 'rgba(59, 130, 246, 0.18)',
              color: '#60a5fa',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Database size={14} />
            Refill Reservoir (100%)
          </button>
          <button
            onClick={resetSimulation}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            Reset Nominal Baseline
          </button>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
      }}>
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => loadScenario(preset.id)}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '10px',
              padding: '12px 14px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.7)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.6)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {getPresetIcon(preset.id)}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                  {preset.name}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                background: 'rgba(51, 65, 85, 0.5)',
                color: '#94a3b8',
                padding: '2px 6px',
                borderRadius: '4px',
                textTransform: 'capitalize',
              }}>
                {preset.season}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.3 }}>
              {preset.description}
            </div>

            <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>
              🎯 {preset.notes}
            </div>
          </button>
        ))}
      </div>

    </div>
  );
};
