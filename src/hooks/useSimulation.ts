import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateAutomation } from '../simulation/automationController';
import {
  DEFAULT_SETTINGS,
  INITIAL_CLOCK,
  INITIAL_EQUIPMENT_STATE,
  INITIAL_SENSORS,
} from '../simulation/defaults';
import { stepEnvironment } from '../simulation/environmentModel';
import { PhysicalFluxes } from '../simulation/physicsModel';
import { SCENARIO_PRESETS } from '../simulation/scenarios';
import {
  DataProvenance,
  fetchHistoricalWeatherData,
  HARYANA_LOCATIONS,
  HourlyWeatherRecord,
  interpolateWeatherAtEpoch,
} from '../services/historicalWeatherService';
import {
  Alert,
  DataCategory,
  EquipmentId,
  EquipmentState,
  HistoryPoint,
  MetricType,
  Season,
  SensorState,
  SimulationClock,
  SimulationMode,
  SimulationSettings,
  SimulationSourceMode,
} from '../simulation/types';

const MAX_HISTORY_POINTS = 80;

export function useSimulation() {
  const [sourceMode, setSourceMode] = useState<SimulationSourceMode>('historical_replay');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('hisar');
  const [season, setSeason] = useState<Season>('summer');
  const [mode, setMode] = useState<SimulationMode>('automatic');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);

  const [sensors, setSensors] = useState<SensorState>(INITIAL_SENSORS);
  const [clock, setClock] = useState<SimulationClock>(INITIAL_CLOCK);
  const [manualEquipment, setManualEquipment] = useState<EquipmentState>(INITIAL_EQUIPMENT_STATE);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [latestFluxes, setLatestFluxes] = useState<PhysicalFluxes | undefined>(undefined);

  // Historical data state
  const [historicalRecords, setHistoricalRecords] = useState<HourlyWeatherRecord[]>([]);
  const [provenance, setProvenance] = useState<DataProvenance | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Modals
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState(false);

  // Replay index pointer into historicalRecords
  const [replayRecordIndex, setReplayRecordIndex] = useState<number>(0);

  // Evaluate Automation Controller
  const { decision: currentDecision, alerts: updatedAlerts } = evaluateAutomation(
    sensors,
    settings,
    clock,
    mode,
    manualEquipment,
    alerts
  );

  // Keep state ref for tick loop
  const stateRef = useRef({
    sensors,
    clock,
    settings,
    season,
    mode,
    sourceMode,
    manualEquipment,
    alerts: updatedAlerts,
    currentDecision,
    isPaused,
    historicalRecords,
    replayRecordIndex,
    weatherError,
    isLoadingWeather,
  });

  useEffect(() => {
    stateRef.current = {
      sensors,
      clock,
      settings,
      season,
      mode,
      sourceMode,
      manualEquipment,
      alerts: updatedAlerts,
      currentDecision,
      isPaused,
      historicalRecords,
      replayRecordIndex,
      weatherError,
      isLoadingWeather,
    };
  });

  // Fetch real historical weather data on location change
  const loadHistoricalWeather = useCallback(async (locId: string, force = false) => {
    setIsLoadingWeather(true);
    setWeatherError(null);

    try {
      const dataset = await fetchHistoricalWeatherData(locId, undefined, undefined, force);
      setHistoricalRecords(dataset.records);
      setProvenance(dataset.provenance);

      // Initialize clock and outdoor sensors from start of dataset if in historical replay
      if (dataset.records.length > 0) {
        const firstRecord = dataset.records[0];
        setSensors((prev) => ({
          ...prev,
          outsideTemperature: firstRecord.temperatureC !== null ? firstRecord.temperatureC : prev.outsideTemperature,
          outsideHumidity: firstRecord.relativeHumidityPct !== null ? firstRecord.relativeHumidityPct : prev.outsideHumidity,
          solarRadiationWm2: firstRecord.solarRadiationWm2,
        }));
        setClock((prev) => ({
          ...prev,
          currentIsoTimestamp: firstRecord.timestamp,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWeatherError(msg);
      // NOTE: Non-negotiable rule 2: Never silently fall back to hard-coded arrays or fake data!
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadHistoricalWeather(selectedLocationId);
  }, [selectedLocationId, loadHistoricalWeather]);

  // Advance simulation step (0.1 simulated minutes = 6 seconds for smoother physics integration)
  const advanceStep = useCallback((dtMinutes: number = 0.1) => {
    const {
      sensors: currentSensors,
      clock: currentClock,
      settings: currentSettings,
      season: currentSeason,
      mode: currentMode,
      sourceMode: currentSourceMode,
      manualEquipment: currentManual,
      alerts: currentAlertsList,
      historicalRecords: currentRecords,
      replayRecordIndex: currentReplayIdx,
      weatherError: currentError,
    } = stateRef.current;

    // In Historical Replay, if historical data failed to load, pause and do not advance on fake data
    if (currentSourceMode === 'historical_replay' && (currentError || currentRecords.length === 0)) {
      return;
    }

    // 1. Determine outdoor weather
    let forcingOutdoor: { outdoorTemperature: number; outdoorHumidity: number; solarRadiationWm2?: number | null } | undefined = undefined;
    let newTimestampIso: string | undefined = currentClock.currentIsoTimestamp;
    let nextIdx = currentReplayIdx;

    if (currentSourceMode === 'historical_replay' && currentRecords.length > 0) {
      // Replay through historical timeline
      const currentRec = currentRecords[Math.min(currentReplayIdx, currentRecords.length - 1)];
      const targetEpoch = currentRec.timeEpochMs + (currentClock.totalElapsedMinutes % 60) * 60000;
      const interp = interpolateWeatherAtEpoch(currentRecords, targetEpoch);

      if (interp.temperatureC !== null && interp.relativeHumidityPct !== null) {
        forcingOutdoor = {
          outdoorTemperature: interp.temperatureC,
          outdoorHumidity: interp.relativeHumidityPct,
          solarRadiationWm2: interp.solarRadiationWm2,
        };
      }

      // Advance index every 60 simulation minutes (600 ticks at 0.1 min per tick)
      if (Math.floor((currentClock.totalElapsedMinutes + dtMinutes) / 60) > Math.floor(currentClock.totalElapsedMinutes / 60)) {
        nextIdx = Math.min(currentRecords.length - 1, currentReplayIdx + 1);
        setReplayRecordIndex(nextIdx);
        newTimestampIso = currentRecords[nextIdx].timestamp;
      }
    }

    // 2. Evaluate Automation Controller
    const { decision: autoDecision, alerts: evaluatedAlerts } = evaluateAutomation(
      currentSensors,
      currentSettings,
      currentClock,
      currentMode,
      currentManual,
      currentAlertsList
    );

    const activeEquipment = autoDecision.finalOutputs;

    // 3. Step Environment Physical Model
    const { nextState, nextClock, fluxes } = stepEnvironment(
      currentSensors,
      activeEquipment,
      currentSettings,
      currentClock,
      currentSeason,
      dtMinutes,
      forcingOutdoor
    );

    nextClock.currentIsoTimestamp = newTimestampIso;

    // 4. Record History Point with Provenance Data Category
    const dataCat: DataCategory = currentSourceMode === 'historical_replay' ? 'historical_outdoor' : 'user_override';
    const timeLabel = newTimestampIso
      ? newTimestampIso.slice(11, 16)
      : `${String(nextClock.hour).padStart(2, '0')}:${String(nextClock.minute).padStart(2, '0')}`;

    const newPoint: HistoryPoint = {
      time: timeLabel,
      minute: nextClock.totalElapsedMinutes,
      timestampIso: newTimestampIso,
      temperature: nextState.temperature,
      humidity: nextState.humidity,
      co2: nextState.co2,
      substrateMoisture: nextState.substrateMoisture,
      outsideTemperature: nextState.outsideTemperature,
      outsideHumidity: nextState.outsideHumidity,
      reservoirLevel: nextState.reservoirLevel,
      heater: activeEquipment.heater,
      ac: activeEquipment.ac,
      growLights: activeEquipment.growLights,
      exhaustFan: activeEquipment.exhaustFan,
      inletFan: activeEquipment.inletFan,
      humidifier: activeEquipment.humidifier,
      dehumidifier: activeEquipment.dehumidifier,
      waterPump: activeEquipment.waterPump,
      fluxes,
      dataSourceCategory: dataCat,
    };

    setSensors(nextState);
    setClock(nextClock);
    setAlerts(evaluatedAlerts);
    setLatestFluxes(fluxes);
    setHistory((prev) => {
      const updated = [...prev, newPoint];
      if (updated.length > MAX_HISTORY_POINTS) {
        return updated.slice(updated.length - MAX_HISTORY_POINTS);
      }
      return updated;
    });
  }, []);

  // Tick timer loop
  useEffect(() => {
    if (isPaused) return;

    // With dtMinutes=0.1 (6 sim seconds) and simulationSpeed=1 (1 sim minute per real second),
    // we need 10 ticks per second = 100ms interval
    const intervalMs = 100;
    const timer = setInterval(() => {
      advanceStep(0.1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, advanceStep]);

  // Actions
  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const handleSetSeason = useCallback((newSeason: Season) => {
    setSeason(newSeason);
  }, []);

  const handleSetMode = useCallback((newMode: SimulationMode) => {
    setMode(newMode);
    if (newMode === 'automatic') {
      const { decision } = evaluateAutomation(
        stateRef.current.sensors,
        stateRef.current.settings,
        stateRef.current.clock,
        'automatic',
        stateRef.current.manualEquipment,
        stateRef.current.alerts
      );
      setManualEquipment(decision.finalOutputs);
    }
  }, []);

  const handleSetSourceMode = useCallback((newSourceMode: SimulationSourceMode) => {
    setSourceMode(newSourceMode);
  }, []);

  const handleSelectLocation = useCallback(
    (locId: string) => {
      setSelectedLocationId(locId);
      loadHistoricalWeather(locId);
    },
    [loadHistoricalWeather]
  );

  const toggleEquipment = useCallback((id: EquipmentId) => {
    setManualEquipment((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const refillReservoir = useCallback(() => {
    setSensors((prev) => ({
      ...prev,
      reservoirLevel: 100,
    }));
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const clearAlertHistory = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => a.active));
  }, []);

  const loadScenario = useCallback(
    (presetId: string) => {
      const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      setSourceMode('scenario_lab');
      setSeason(preset.season);
      setMode(preset.mode);
      setSensors((prev) => ({
        ...prev,
        ...preset.initialSensors,
      }));
    },
    []
  );

  const resetSimulation = useCallback(() => {
    setSeason('summer');
    setMode('automatic');
    setSensors(INITIAL_SENSORS);
    setClock(INITIAL_CLOCK);
    setManualEquipment(INITIAL_EQUIPMENT_STATE);
    setAlerts([]);
    setHistory([]);
    setReplayRecordIndex(0);
  }, []);

  const updateSettings = useCallback((partial: Partial<SimulationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  const selectedLocation = HARYANA_LOCATIONS.find((l) => l.id === selectedLocationId) || HARYANA_LOCATIONS[0];

  return {
    sourceMode,
    setSourceMode: handleSetSourceMode,
    selectedLocation,
    setSelectedLocationId: handleSelectLocation,
    locations: HARYANA_LOCATIONS,
    season,
    setSeason: handleSetSeason,
    mode,
    setMode: handleSetMode,
    isPaused,
    togglePause,
    settings,
    updateSettings,
    sensors,
    clock,
    equipment: currentDecision.finalOutputs,
    manualEquipment,
    toggleEquipment,
    decision: currentDecision,
    alerts: updatedAlerts,
    history,
    latestFluxes,
    advanceStep,
    refillReservoir,
    acknowledgeAlert,
    clearAlertHistory,
    loadScenario,
    resetSimulation,
    // Historical API state
    historicalRecords,
    provenance,
    isLoadingWeather,
    weatherError,
    refreshWeather: () => loadHistoricalWeather(selectedLocationId, true),
    // Modals
    selectedMetric,
    setSelectedMetric,
    isSettingsOpen,
    setIsSettingsOpen,
    isTestModalOpen,
    setIsTestModalOpen,
    isProvenanceModalOpen,
    setIsProvenanceModalOpen,
  };
}
