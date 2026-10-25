import { EquipmentState, SensorState, SimulationClock, SimulationSettings } from './types';

export const ROOM_CONSTANTS = {
  WIDTH_FT: 10,
  LENGTH_FT: 10,
  HEIGHT_FT: 8,
  AREA_SQFT: 100,
  VOLUME_CUFT: 800,
  VOLUME_M3: 22.65,
  LOCATION: 'Haryana, India (Subtropical semi-arid / Indo-Gangetic Plain)',
};

export const DEFAULT_SETTINGS: SimulationSettings = {
  targetTemperatureMin: 21,
  targetTemperatureMax: 26,
  targetHumidityMin: 45,
  targetHumidityMax: 55,
  targetCo2: 800,
  tempCoolingThreshold: 27,
  tempHeatingThreshold: 18,
  humidityHighThreshold: 60,
  humidityLowThreshold: 40,
  co2LowThreshold: 450,
  substrateDryThreshold: 43,
  substrateWetThreshold: 70,
  dayStartHour: 6,
  dayEndHour: 24, // 18h lighting schedule (06:00 to 24:00)
  oscillatingFansContinuous: true,
  forcedVentIntervalMinutes: 120, // Air exchange every 2 hours
  forcedVentDurationMinutes: 10,
  noiseEnabled: false,
  carbonFilterEfficiency: 0.85,
  carbonFilterEquipped: true,
  simulationSpeed: 1, // 1 simulated minute per real second for gradual, observable thermal changes
};

export const INITIAL_EQUIPMENT_STATE: EquipmentState = {
  heater: false,
  ac: false,
  exhaustFan: false,
  inletFan: false,
  oscillatingFans: true,
  humidifier: false,
  dehumidifier: false,
  waterPump: false,
  growLights: true,
  carbonFilter: true,
};

export const INITIAL_SENSORS: SensorState = {
  temperature: 24.2,
  humidity: 52.0,
  co2: 650,
  substrateMoisture: 58.0,
  lightLevel: 48000,
  reservoirLevel: 85.0,
  outsideTemperature: 33.5,
  outsideHumidity: 48.0,
};

export const INITIAL_CLOCK: SimulationClock = {
  day: 1,
  hour: 10,
  minute: 0,
  totalElapsedMinutes: 600, // 10:00 AM on Day 1
  isDaytime: true,
};
