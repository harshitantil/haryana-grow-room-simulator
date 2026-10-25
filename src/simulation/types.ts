import { PhysicalFluxes } from './physicsModel';

export type Season = 'summer' | 'monsoon' | 'autumn' | 'winter' | 'spring';

export type SimulationMode = 'automatic' | 'manual';

export type SimulationSourceMode = 'historical_replay' | 'scenario_lab';

export type DataCategory =
  | 'historical_outdoor'
  | 'derived'
  | 'simulated_indoor'
  | 'user_override'
  | 'unavailable';

export type MetricType =
  | 'temperature'
  | 'humidity'
  | 'co2'
  | 'substrateMoisture'
  | 'lightLevel'
  | 'reservoirLevel'
  | 'outsideTemperature'
  | 'outsideHumidity';

export type EquipmentId =
  | 'heater'
  | 'ac'
  | 'exhaustFan'
  | 'inletFan'
  | 'oscillatingFans'
  | 'humidifier'
  | 'dehumidifier'
  | 'waterPump'
  | 'growLights'
  | 'carbonFilter';

export type EquipmentState = Record<EquipmentId, boolean>;

export interface SensorState {
  temperature: number; // °C
  humidity: number; // % RH
  co2: number; // ppm
  substrateMoisture: number; // %
  lightLevel: number; // lux
  reservoirLevel: number; // %
  outsideTemperature: number; // °C
  outsideHumidity: number; // %
  solarRadiationWm2?: number | null;
}

export interface SimulationSettings {
  targetTemperatureMin: number;
  targetTemperatureMax: number;
  targetHumidityMin: number;
  targetHumidityMax: number;
  targetCo2: number;
  // Automation rule thresholds
  tempCoolingThreshold: number; // 27°C
  tempHeatingThreshold: number; // 18°C
  humidityHighThreshold: number; // 60%
  humidityLowThreshold: number; // 40%
  co2LowThreshold: number; // 450 ppm
  substrateDryThreshold: number; // 43%
  substrateWetThreshold: number; // 70%
  // Schedule
  dayStartHour: number; // e.g. 6 (06:00)
  dayEndHour: number; // e.g. 24 (18h light default: 06:00 to 24:00)
  oscillatingFansContinuous: boolean;
  // Forced air exchange
  forcedVentIntervalMinutes: number; // default 120 (every 2 hours)
  forcedVentDurationMinutes: number; // default 10 minutes
  // Noise & Accessories
  noiseEnabled: boolean;
  carbonFilterEfficiency: number; // e.g. 0.85
  carbonFilterEquipped: boolean; // accessory attached to exhaust
  simulationSpeed: number; // 1 = 1 sim minute per real second (gradual), 5 = 5 sim minutes per real second (fast), 10, 30, 60
}

export type AlertSeverity = 'emergency' | 'warning' | 'info';

export interface Alert {
  id: string;
  category: 'temperature' | 'humidity' | 'co2' | 'watering' | 'safety';
  severity: AlertSeverity;
  title: string;
  cause: string;
  suggestedResponse: string;
  timestamp: string; // Formatted simulated time
  simulatedMinute: number;
  active: boolean;
  acknowledged: boolean;
}

export interface RuleEvaluation {
  priority: number;
  name: string;
  category: 'Emergency' | 'Temperature' | 'Humidity' | 'CO2' | 'Watering' | 'Timers';
  active: boolean;
  reason: string;
  requestedOutputs: Partial<EquipmentState>;
  overridden: boolean;
  overriddenReason?: string;
}

export interface AutomationDecision {
  rules: RuleEvaluation[];
  requestedOutputs: EquipmentState;
  finalOutputs: EquipmentState;
  activeRuleSummary: string;
  interlocksTriggered: string[];
  forcedVentActive: boolean;
  forcedVentCountdownMinutes: number;
  emergencyActive: boolean;
}

export interface HistoryPoint {
  time: string;
  minute: number;
  timestampIso?: string;
  temperature: number;
  humidity: number;
  co2: number;
  substrateMoisture: number;
  outsideTemperature: number;
  outsideHumidity?: number;
  reservoirLevel: number;
  heater: boolean;
  ac: boolean;
  growLights: boolean;
  exhaustFan: boolean;
  inletFan?: boolean;
  humidifier?: boolean;
  dehumidifier?: boolean;
  waterPump: boolean;
  fluxes?: PhysicalFluxes;
  dataSourceCategory: DataCategory;
}

export interface SimulationClock {
  day: number;
  hour: number;
  minute: number;
  totalElapsedMinutes: number;
  isDaytime: boolean;
  currentIsoTimestamp?: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  season: Season;
  description: string;
  initialSensors: Partial<SensorState>;
  mode: SimulationMode;
  notes: string;
}
