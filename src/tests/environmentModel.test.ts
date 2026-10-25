import { describe, expect, it } from 'vitest';
import { getOutsideClimate } from '../simulation/climateProfiles';
import {
  DEFAULT_SETTINGS,
  INITIAL_CLOCK,
  INITIAL_EQUIPMENT_STATE,
  INITIAL_SENSORS,
} from '../simulation/defaults';
import { stepEnvironment } from '../simulation/environmentModel';
import { EquipmentState, SensorState } from '../simulation/types';

describe('Environment Physical Model & Haryana Climates', () => {
  it('correctly simulates Haryana summer afternoon peak (>40°C) and winter morning low (<6°C)', () => {
    // Summer afternoon (15:00)
    const summerAfternoon = getOutsideClimate('summer', 15, 0);
    expect(summerAfternoon.outsideTemperature).toBeGreaterThanOrEqual(42.0);

    // Winter morning (05:00)
    const winterMorning = getOutsideClimate('winter', 5, 30);
    expect(winterMorning.outsideTemperature).toBeLessThanOrEqual(6.5);
  });

  it('advances simulation time and computes day/night correctly', () => {
    const clock = { ...INITIAL_CLOCK, hour: 10, minute: 0, totalElapsedMinutes: 600 };
    const { nextClock } = stepEnvironment(
      INITIAL_SENSORS,
      INITIAL_EQUIPMENT_STATE,
      DEFAULT_SETTINGS,
      clock,
      'summer',
      30 // 30 minutes
    );

    expect(nextClock.hour).toBe(10);
    expect(nextClock.minute).toBe(30);
    expect(nextClock.totalElapsedMinutes).toBe(630);
    expect(nextClock.isDaytime).toBe(true);
  });

  it('heats the room when heater is active and cools when AC is active', () => {
    const baseSensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 20.0,
      outsideTemperature: 20.0,
    };

    // Heating
    const heatingEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      heater: true,
      ac: false,
      growLights: false,
    };
    const afterHeating = stepEnvironment(
      baseSensors,
      heatingEquip,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'spring',
      10
    );
    expect(afterHeating.nextState.temperature).toBeGreaterThan(baseSensors.temperature);

    // Cooling
    const coolingEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      heater: false,
      ac: true,
      growLights: false,
    };
    const afterCooling = stepEnvironment(
      baseSensors,
      coolingEquip,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'spring',
      10
    );
    expect(afterCooling.nextState.temperature).toBeLessThan(baseSensors.temperature);
  });

  it('depletes reservoir and hydrates substrate when water pump runs', () => {
    const initialReservoir = 80.0;
    const initialMoisture = 40.0;
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      reservoirLevel: initialReservoir,
      substrateMoisture: initialMoisture,
    };
    const wateringEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      waterPump: true,
    };

    const result = stepEnvironment(
      sensors,
      wateringEquip,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'spring',
      5
    );

    expect(result.nextState.substrateMoisture).toBeGreaterThan(initialMoisture);
    expect(result.nextState.reservoirLevel).toBeLessThan(initialReservoir);
  });

  it('simulates photosynthesis CO2 consumption under lights and night respiration', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      co2: 800,
    };

    // Day with lights ON, sealed room
    const dayEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      growLights: true,
      exhaustFan: false,
      inletFan: false,
    };
    const dayResult = stepEnvironment(
      sensors,
      dayEquip,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'spring',
      20
    );
    expect(dayResult.nextState.co2).toBeLessThan(sensors.co2);

    // Night with lights OFF, sealed room
    const nightEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      growLights: false,
      exhaustFan: false,
      inletFan: false,
    };
    const nightResult = stepEnvironment(
      sensors,
      nightEquip,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'spring',
      20
    );
    expect(nightResult.nextState.co2).toBeGreaterThan(sensors.co2);
  });
});
