import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { DashboardHeader } from '../components/DashboardHeader';
import { SensorCardGrid } from '../components/SensorCard';
import { RoomSchematic } from '../components/RoomSchematic';
import { EquipmentPanel } from '../components/EquipmentPanel';
import { AutomationPanel } from '../components/AutomationPanel';
import { AlertsPanel } from '../components/AlertsPanel';
import { EnvironmentCharts } from '../components/EnvironmentCharts';
import { ScenarioControls } from '../components/ScenarioControls';
import { SettingsModal } from '../components/SettingsModal';
import { SensorDetailModal } from '../components/SensorDetailModal';
import { TestScenariosModal } from '../components/TestScenariosModal';
import { DataProvenanceModal } from '../components/DataProvenanceModal';
import { CropPanel } from '../components/CropPanel';
import {
  LayoutDashboard,
  Thermometer,
  Wrench,
  Bot,
  Sprout,
  FlaskConical,
  Settings,
} from 'lucide-react';

type DashboardTab =
  | 'overview'
  | 'climate'
  | 'equipment'
  | 'automation'
  | 'crops'
  | 'scenarios'
  | 'settings';

const TAB_CONFIG: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { id: 'climate', label: 'Climate & History', icon: <Thermometer size={15} /> },
  { id: 'equipment', label: 'Equipment', icon: <Wrench size={15} /> },
  { id: 'automation', label: 'Automation', icon: <Bot size={15} /> },
  { id: 'crops', label: 'Crops & Growing Plan', icon: <Sprout size={15} /> },
  { id: 'scenarios', label: 'Scenarios & Tests', icon: <FlaskConical size={15} /> },
  { id: 'settings', label: 'Settings & Data', icon: <Settings size={15} /> },
];

export const App: React.FC = () => {
  const {
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
    settings,
    updateSettings,
    sensors,
    clock,
    equipment,
    manualEquipment,
    toggleEquipment,
    decision,
    alerts,
    history,
    latestFluxes,
    advanceStep,
    refillReservoir,
    acknowledgeAlert,
    clearAlertHistory,
    loadScenario,
    resetSimulation,
    historicalRecords,
    provenance,
    isLoadingWeather,
    weatherError,
    refreshWeather,
    selectedMetric,
    setSelectedMetric,
    isSettingsOpen,
    setIsSettingsOpen,
    isTestModalOpen,
    setIsTestModalOpen,
    isProvenanceModalOpen,
    setIsProvenanceModalOpen,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 48px 20px' }}>
      
      {/* 1. Dashboard Header with Location Selector, Mode & Controls */}
      <DashboardHeader
        sourceMode={sourceMode}
        setSourceMode={setSourceMode}
        selectedLocation={selectedLocation}
        setSelectedLocationId={setSelectedLocationId}
        locations={locations}
        season={season}
        setSeason={setSeason}
        mode={mode}
        setMode={setMode}
        isPaused={isPaused}
        togglePause={togglePause}
        advanceStep={() => advanceStep(0.1)}
        resetSimulation={resetSimulation}
        clock={clock}
        settings={settings}
        updateSettings={updateSettings}
        outsideTemp={sensors.outsideTemperature}
        outsideHumidity={sensors.outsideHumidity}
        onOpenSettings={() => { setActiveTab('settings'); setIsSettingsOpen(true); }}
        onOpenTests={() => { setActiveTab('scenarios'); setIsTestModalOpen(true); }}
        onOpenProvenance={() => setIsProvenanceModalOpen(true)}
        onSelectMetric={(m) => setSelectedMetric(m)}
        isLoadingWeather={isLoadingWeather}
        weatherError={weatherError}
        onRefreshWeather={refreshWeather}
      />

      {/* 2. Top Sensor KPI Cards (always visible) */}
      <SensorCardGrid
        sensors={sensors}
        settings={settings}
        emergencyActive={decision.emergencyActive}
        onSelectMetric={(m) => setSelectedMetric(m)}
      />

      {/* Tab Navigation Bar */}
      <nav style={{
        display: 'flex',
        gap: '2px',
        marginBottom: '20px',
        padding: '3px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '10px',
        border: '1px solid rgba(51, 65, 85, 0.5)',
        overflowX: 'auto',
      }}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(56, 189, 248, 0.15))'
                : 'transparent',
              color: activeTab === tab.id ? '#f8fafc' : '#94a3b8',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              ...(activeTab === tab.id ? { boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)' } : {}),
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ────── TAB CONTENT ────── */}

      {/* OVERVIEW: Room Schematic, Equipment summary, Automation summary, Charts, Alerts */}
      {activeTab === 'overview' && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <RoomSchematic equipment={equipment} sensors={sensors} />
              <EquipmentPanel
                equipment={equipment}
                manualEquipment={manualEquipment}
                mode={mode}
                toggleEquipment={toggleEquipment}
                refillReservoir={refillReservoir}
                reservoirLevel={sensors.reservoirLevel}
                interlocksTriggered={decision.interlocksTriggered}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AutomationPanel decision={decision} />
              <AlertsPanel
                alerts={alerts}
                acknowledgeAlert={acknowledgeAlert}
                clearAlertHistory={clearAlertHistory}
              />
            </div>
          </div>
          <EnvironmentCharts history={history} settings={settings} />
        </>
      )}

      {/* CLIMATE & HISTORY */}
      {activeTab === 'climate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <EnvironmentCharts history={history} settings={settings} />
          <div className="glass-card" style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
              Historical Weather Data Source
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              <div><strong>Mode:</strong> {sourceMode === 'historical_replay' ? 'Historical Replay (ERA5-Land)' : 'Scenario Lab (Synthetic)'}</div>
              <div><strong>Location:</strong> {selectedLocation.name}, Haryana</div>
              <div><strong>Status:</strong>{' '}
                {isLoadingWeather ? (
                  <span style={{ color: '#38bdf8' }}>Loading historical data...</span>
                ) : weatherError ? (
                  <span style={{ color: '#f87171' }}>Error: {weatherError}</span>
                ) : (
                  <span style={{ color: '#10b981' }}>{historicalRecords.length} hourly records loaded</span>
                )}
              </div>
              {weatherError && (
                <button
                  onClick={refreshWeather}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EQUIPMENT */}
      {activeTab === 'equipment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <RoomSchematic equipment={equipment} sensors={sensors} />
          <EquipmentPanel
            equipment={equipment}
            manualEquipment={manualEquipment}
            mode={mode}
            toggleEquipment={toggleEquipment}
            refillReservoir={refillReservoir}
            reservoirLevel={sensors.reservoirLevel}
            interlocksTriggered={decision.interlocksTriggered}
          />
        </div>
      )}

      {/* AUTOMATION */}
      {activeTab === 'automation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AutomationPanel decision={decision} />
          <AlertsPanel
            alerts={alerts}
            acknowledgeAlert={acknowledgeAlert}
            clearAlertHistory={clearAlertHistory}
          />
        </div>
      )}

      {/* CROPS & GROWING PLAN */}
      {activeTab === 'crops' && (
        <CropPanel sensors={sensors} />
      )}

      {/* SCENARIOS & TESTS */}
      {activeTab === 'scenarios' && (
        <ScenarioControls
          loadScenario={loadScenario}
          resetSimulation={resetSimulation}
          refillReservoir={refillReservoir}
        />
      )}

      {/* SETTINGS & DATA */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              Simulation Settings
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  color: '#34d399',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Open Settings Panel
              </button>
              <button
                onClick={() => setIsProvenanceModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  color: '#7dd3fc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Data Provenance & Sources
              </button>
            </div>
          </div>
          <div className="glass-card" style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
              Room & Model Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div><strong>Room:</strong> 10 ft × 10 ft × 10 ft (3.048 m × 3.048 m × 3.048 m)</div>
              <div><strong>Volume:</strong> ~28.3 m³</div>
              <div><strong>Thermal mass:</strong> 70 kJ/°C (furnishings + air)</div>
              <div><strong>Envelope U·A:</strong> 25 W/°C</div>
              <div><strong>Grow Lights:</strong> 600 W LED (48,000 lux)</div>
              <div><strong>AC:</strong> 12,000 BTU (~3,517 W cooling)</div>
              <div><strong>Heater:</strong> 2,000 W electric</div>
              <div><strong>Reservoir:</strong> 50 L nutrient tank</div>
              <div><strong>Location:</strong> {selectedLocation.name}, Haryana</div>
              <div><strong>Timezone:</strong> Asia/Kolkata (IST UTC+5:30)</div>
            </div>
          </div>
        </div>
      )}

      {/* ────── MODALS (always rendered, controlled by state) ────── */}

      <SensorDetailModal
        metric={selectedMetric}
        isOpen={selectedMetric !== null}
        onClose={() => setSelectedMetric(null)}
        currentSensors={sensors}
        history={history}
        historicalOutdoorRecords={historicalRecords}
        latestFluxes={latestFluxes}
        sourceMode={sourceMode}
        locationName={selectedLocation.name}
        provenance={provenance}
        isLoadingWeather={isLoadingWeather}
        weatherError={weatherError}
        onRefreshWeather={refreshWeather}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
      />

      <TestScenariosModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      <DataProvenanceModal
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
        provenance={provenance}
        error={weatherError}
        onRetry={refreshWeather}
      />

      {/* Educational Model Limitations Disclaimer Footer */}
      <footer style={{
        marginTop: '36px',
        padding: '20px',
        borderTop: '1px solid rgba(51, 65, 85, 0.4)',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748b',
        lineHeight: 1.6,
      }}>
        <div>
          <strong>Haryana Indoor Plant Grow Room Simulator (10 ft × 10 ft AgTech Educational Model)</strong>
        </div>
        <div style={{ maxWidth: '900px', margin: '6px auto 0 auto' }}>
          Data Integrity Notice: External historical outdoor weather is fetched from Open-Meteo ERA5-Land reanalysis for documented Haryana coordinates. Indoor values are model outputs calculated via sensible heat conservation, psychrometric relative humidity coupling, CO₂ mass balance, and substrate water balances.
        </div>
      </footer>

    </div>
  );
};
