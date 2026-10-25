import { getOutsideClimate } from './climateProfiles';
import { PhysicalFluxes, stepCoupledPhysics } from './physicsModel';
import {
  EquipmentState,
  Season,
  SensorState,
  SimulationClock,
  SimulationSettings,
} from './types';

export interface StepEnvironmentResult {
  nextState: SensorState;
  nextClock: SimulationClock;
  fluxes: PhysicalFluxes;
}

/**
 * Pure environment step function:
 * Advances the simulation by dtMinutes, applying the coupled physical model
 * (sensible heat conservation, psychrometric RH coupling, CO2 mass balance,
 * substrate water balance, and ventilation airflow).
 */
export function stepEnvironment(
  currentState: SensorState,
  equipment: EquipmentState,
  settings: SimulationSettings,
  clock: SimulationClock,
  season: Season,
  dtMinutes: number = 1,
  forcedOutdoorWeather?: {
    outdoorTemperature: number;
    outdoorHumidity: number;
    solarRadiationWm2?: number | null;
  }
): StepEnvironmentResult {
  // 1. Advance clock
  const totalElapsedMinutes = clock.totalElapsedMinutes + dtMinutes;
  const currentMinuteOfDay = totalElapsedMinutes % 1440;
  const hour = Math.floor(currentMinuteOfDay / 60);
  const minute = Math.floor(currentMinuteOfDay % 60); // Floor to handle fractional minutes
  const day = Math.floor(totalElapsedMinutes / 1440) + 1;

  // Day/night schedule evaluation (uses hour only, minute ignored for simplicity)
  let isDaytime = false;
  if (settings.dayStartHour < settings.dayEndHour) {
    isDaytime = hour >= settings.dayStartHour && hour < settings.dayEndHour;
  } else {
    // Crosses midnight
    isDaytime = hour >= settings.dayStartHour || hour < settings.dayEndHour;
  }

  const nextClock: SimulationClock = {
    day,
    hour,
    minute: Math.floor(currentMinuteOfDay % 60), // Store integer minute for display
    totalElapsedMinutes,
    isDaytime,
    currentIsoTimestamp: clock.currentIsoTimestamp,
  };

  // 2. Determine outdoor conditions: from real historical weather if provided, or from Haryana climate curve
  let outdoorTemp = 0;
  let outdoorHum = 0;
  let solarRadiation = 0;

  if (forcedOutdoorWeather) {
    outdoorTemp = forcedOutdoorWeather.outdoorTemperature;
    outdoorHum = forcedOutdoorWeather.outdoorHumidity;
    solarRadiation = forcedOutdoorWeather.solarRadiationWm2 || 0;
  } else {
    const climate = getOutsideClimate(season, hour, minute);
    outdoorTemp = climate.outsideTemperature;
    outdoorHum = climate.outsideHumidity;
    solarRadiation = isDaytime ? 650 : 0;
  }

  // 3. Step coupled physics
  const { nextState: physicalState, fluxes } = stepCoupledPhysics({
    currentState,
    equipment,
    outdoorTempC: outdoorTemp,
    outdoorHumidityPct: outdoorHum,
    solarRadiationWm2: solarRadiation,
    carbonFilterEquipped: settings.carbonFilterEquipped,
    carbonFilterEfficiency: settings.carbonFilterEfficiency,
    outdoorCo2BaselinePpm: 420,
    dtMinutes,
  });

  // 4. Optional subtle noise (for repeatability, toggled via settings)
  let nextTemp = physicalState.temperature;
  let nextHum = physicalState.humidity;
  let nextCo2 = physicalState.co2;
  let nextMoisture = physicalState.substrateMoisture;

  if (settings.noiseEnabled) {
    nextTemp += Math.sin(totalElapsedMinutes * 0.7) * 0.06;
    nextHum += Math.cos(totalElapsedMinutes * 0.5) * 0.12;
    nextCo2 += Math.sin(totalElapsedMinutes * 0.3) * 2.0;
    nextMoisture += Math.cos(totalElapsedMinutes * 0.2) * 0.03;

    nextTemp = Math.round(nextTemp * 100) / 100;
    nextHum = Math.round(nextHum * 100) / 100;
    nextCo2 = Math.round(nextCo2 * 10) / 10;
    nextMoisture = Math.round(nextMoisture * 100) / 100;
  }

  const nextState: SensorState = {
    temperature: nextTemp,
    humidity: nextHum,
    co2: nextCo2,
    substrateMoisture: nextMoisture,
    lightLevel: physicalState.lightLevel,
    reservoirLevel: physicalState.reservoirLevel,
    outsideTemperature: outdoorTemp,
    outsideHumidity: outdoorHum,
    solarRadiationWm2: solarRadiation,
  };

  return {
    nextState,
    nextClock,
    fluxes,
  };
}
