import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sun,
  Moon,
  CloudSun,
  Settings,
  Cpu,
  Sliders,
  Volume2,
  VolumeX,
  History,
  FlaskConical,
  Database,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  MetricType,
  Season,
  SimulationClock,
  SimulationMode,
  SimulationSettings,
  SimulationSourceMode,
} from '../simulation/types';
import { HaryanaLocation } from '../services/historicalWeatherService';

interface HeaderProps {
  sourceMode: SimulationSourceMode;
  setSourceMode: (mode: SimulationSourceMode) => void;
  selectedLocation: HaryanaLocation;
  setSelectedLocationId: (locId: string) => void;
  locations: HaryanaLocation[];
  season: Season;
  setSeason: (season: Season) => void;
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  isPaused: boolean;
  togglePause: () => void;
  advanceStep: () => void;
  resetSimulation: () => void;
  clock: SimulationClock;
  settings: SimulationSettings;
  updateSettings: (partial: Partial<SimulationSettings>) => void;
  outsideTemp: number;
  outsideHumidity: number;
  onOpenSettings: () => void;
  onOpenTests: () => void;
  onOpenProvenance: () => void;
  onSelectMetric: (metric: MetricType) => void;
  isLoadingWeather: boolean;
  weatherError: string | null;
  onRefreshWeather: () => void;
}

export const DashboardHeader: React.FC<HeaderProps> = ({
  sourceMode,
  setSourceMode,
  selectedLocation,
  setSelectedLocationId,
  locations,
  season,
  setSeason,
  mode,
  setMode,
  isPaused,
  togglePause,
  advanceStep,
  resetSimulation,
  clock,
  settings,
  updateSettings,
  outsideTemp,
  outsideHumidity,
  onOpenSettings,
  onOpenTests,
  onOpenProvenance,
  onSelectMetric,
  isLoadingWeather,
  weatherError,
  onRefreshWeather,
}) => {
  return (
    <header className="glass-card" style={{ padding: '16px 24px', marginBottom: '20px' }}>
      
      {/* Top Row: Title, Room Dimensions & Source Mode Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
        
        {/* Title and Room Specs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              fontSize: '18px',
            }}>
              🌱
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  Haryana 10×10 Indoor Grow Room Simulator
                </h1>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: sourceMode === 'historical_replay' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  border: `1px solid ${sourceMode === 'historical_replay' ? '#38bdf8' : '#f59e0b'}`,
                  color: sourceMode === 'historical_replay' ? '#38bdf8' : '#fbbf24',
                }}>
                  {sourceMode === 'historical_replay' ? 'HISTORICAL REPLAY (ERA5-LAND)' : 'SCENARIO LAB (SYNTHETIC)'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span>10 ft × 10 ft (100 sq ft, 800 cu ft)</span>
                <span>•</span>
                <span style={{ color: '#10b981' }}>Coupled Lumped Physics Engine</span>
                <span>•</span>
                <span style={{ background: 'rgba(51, 65, 85, 0.6)', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', color: '#cbd5e1' }}>
                  Educational Simulation
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Source Mode Switcher: Historical Replay vs Scenario Lab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setSourceMode('historical_replay')}
              aria-pressed={sourceMode === 'historical_replay'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: sourceMode === 'historical_replay' ? '#0284c7' : 'transparent',
                color: sourceMode === 'historical_replay' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={14} />
              Historical Replay
            </button>
            <button
              onClick={() => setSourceMode('scenario_lab')}
              aria-pressed={sourceMode === 'scenario_lab'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: sourceMode === 'scenario_lab' ? '#d97706' : 'transparent',
                color: sourceMode === 'scenario_lab' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <FlaskConical size={14} />
              Scenario Lab
            </button>
          </div>

          {/* Test Scenarios Panel Button */}
          <button
            onClick={onOpenTests}
            title="Open Automated Test Suite (17 Scenarios)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FlaskConical size={14} />
            Test Suite (17 Tests)
          </button>

          {/* Data Provenance Button */}
          <button
            onClick={onOpenProvenance}
            title="View Data Provenance, Coordinates & Open-Meteo Attribution"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Database size={14} />
            Data Provenance
          </button>

        </div>

      </div>

      {/* Weather Error Banner if network fetch failed */}
      {weatherError && sourceMode === 'historical_replay' && (
        <div style={{
          marginBottom: '14px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#fb7185',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span><strong>Historical API Offline:</strong> {weatherError}</span>
          </div>
          <button
            onClick={onRefreshWeather}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: '#f43f5e',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Bottom Row: Location Selector, Clock, Outside Readout, and Stepping Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        
        {/* Left: Location & Season Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Haryana Location Selector */}
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
            <MapPin size={16} style={{ color: '#38bdf8' }} />
            <div>
              <label htmlFor="location-select" style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Haryana Location
              </label>
              <select
                id="location-select"
                value={selectedLocation.id}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                disabled={isLoadingWeather}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    {loc.name} ({loc.latitude}°N, {loc.longitude}°E)
                  </option>
                ))}
              </select>
            </div>
            {isLoadingWeather && <RefreshCw size={14} className="fan-spinning" style={{ color: '#38bdf8' }} />}
          </div>

          {/* Season Selector */}
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
            <CloudSun size={16} style={{ color: '#38bdf8' }} />
            <div>
              <label htmlFor="season-select" style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Season Profile
              </label>
              <select
                id="season-select"
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="summer" style={{ background: '#0f172a', color: '#f8fafc' }}>Summer (Loo 44°C)</option>
                <option value="monsoon" style={{ background: '#0f172a', color: '#f8fafc' }}>Monsoon (Humid Subtropical)</option>
                <option value="autumn" style={{ background: '#0f172a', color: '#f8fafc' }}>Autumn (Mild Transition)</option>
                <option value="winter" style={{ background: '#0f172a', color: '#f8fafc' }}>Winter (Cold Fog 5°C)</option>
                <option value="spring" style={{ background: '#0f172a', color: '#f8fafc' }}>Spring (Moderate Temperate)</option>
              </select>
            </div>
          </div>

          {/* Outside Weather Pill (Clickable drilldown) */}
          <button
            onClick={() => onSelectMetric('outsideTemperature')}
            title="Click to view full outdoor meteorological time-series & history"
            className="glass-panel mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            <span>Outdoor: {outsideTemp.toFixed(1)}°C | {outsideHumidity.toFixed(0)}% RH</span>
          </button>

        </div>

        {/* Center/Right: Clock & Stepping Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Clock Display */}
          <div className="glass-panel mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
            {clock.isDaytime ? <Sun size={16} style={{ color: '#fbbf24' }} /> : <Moon size={16} style={{ color: '#818cf8' }} />}
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                {clock.currentIsoTimestamp ? clock.currentIsoTimestamp.replace('T', ' ') : `Day ${clock.day} • ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`}
              </div>
              <div style={{ fontSize: '10px', color: clock.isDaytime ? '#fbbf24' : '#818cf8' }}>
                {clock.isDaytime ? 'Day Photoperiod (Lights ON)' : 'Night Photoperiod (Lights OFF)'}
              </div>
            </div>
          </div>

          {/* Automatic vs Manual Mode */}
          <div className="glass-panel" style={{ display: 'flex', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => setMode('automatic')}
              aria-pressed={mode === 'automatic'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'automatic' ? '#10b981' : 'transparent',
                color: mode === 'automatic' ? '#ffffff' : '#94a3b8',
              }}
            >
              <Cpu size={13} />
              Auto
            </button>
            <button
              onClick={() => setMode('manual')}
              aria-pressed={mode === 'manual'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'manual' ? '#f59e0b' : 'transparent',
                color: mode === 'manual' ? '#ffffff' : '#94a3b8',
              }}
            >
              <Sliders size={13} />
              Manual
            </button>
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.18)',
              color: isPaused ? '#f59e0b' : '#34d399',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Step Button */}
          <button
            onClick={advanceStep}
            title="Step forward 1 minute"
            aria-label="Step forward 1 minute"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <StepForward size={15} />
          </button>

          {/* Speed Selector */}
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '2px 6px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginRight: '4px' }}>Speed:</span>
            {[1, 5, 10, 30, 60].map((s) => (
              <button
                key={s}
                onClick={() => updateSettings({ simulationSpeed: s })}
                style={{
                  background: settings.simulationSpeed === s ? '#10b981' : 'transparent',
                  color: settings.simulationSpeed === s ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 5px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Noise Toggle */}
          <button
            onClick={() => updateSettings({ noiseEnabled: !settings.noiseEnabled })}
            title={settings.noiseEnabled ? 'Sensor noise enabled (Click to disable)' : 'Sensor noise disabled (Click to enable)'}
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: settings.noiseEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: settings.noiseEnabled ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {settings.noiseEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Reset */}
          <button
            onClick={resetSimulation}
            title="Reset simulation to default state"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RotateCcw size={15} />
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettings}
            title="Configure target parameters & schedules"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Settings size={15} />
          </button>

        </div>

      </div>

    </header>
  );
};
