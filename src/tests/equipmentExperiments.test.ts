import { describe, expect, it } from 'vitest';
import { stepCoupledPhysics } from '../simulation/physicsModel';
import { INITIAL_EQUIPMENT_STATE, INITIAL_SENSORS } from '../simulation/defaults';
import { EquipmentState, SensorState } from '../simulation/types';

/**
 * Automated Equipment Experiment Runner
 * Resets to baseline, runs baseline duration, then runs device duration.
 * Compares outcomes to verify causal directions.
 */
function runExperiment(
  deviceKey: keyof EquipmentState,
  durationMinutes: number,
  initialState: SensorState,
  outdoorTemp: number = 24.0,
  outdoorHum: number = 50.0
) {
  const physicsInput = {
    currentState: initialState,
    outdoorTempC: outdoorTemp,
    outdoorHumidityPct: outdoorHum,
    carbonFilterEquipped: true,
    carbonFilterEfficiency: 0.85,
    dtMinutes: 1,
  };

  // 1. Baseline Run (Device OFF)
  let baselineState = { ...initialState };
  const baselineEquip = { ...INITIAL_EQUIPMENT_STATE, [deviceKey]: false };
  for (let i = 0; i < durationMinutes; i++) {
    const res = stepCoupledPhysics({ ...physicsInput, currentState: baselineState, equipment: baselineEquip });
    baselineState = res.nextState;
  }

  // 2. Experimental Run (Device ON)
  let expState = { ...initialState };
  const expEquip = { ...INITIAL_EQUIPMENT_STATE, [deviceKey]: true };
  for (let i = 0; i < durationMinutes; i++) {
    const res = stepCoupledPhysics({ ...physicsInput, currentState: expState, equipment: expEquip });
    expState = res.nextState;
  }

  return {
    baseline: baselineState,
    experimental: expState,
    delta: {
      temp: expState.temperature - baselineState.temperature,
      hum: expState.humidity - baselineState.humidity,
      co2: expState.co2 - baselineState.co2,
      moisture: expState.substrateMoisture - baselineState.substrateMoisture,
      reservoir: expState.reservoirLevel - baselineState.reservoirLevel,
    }
  };
}

describe('Automated Equipment Experiments', () => {
  const initial = { ...INITIAL_SENSORS, temperature: 24.0, humidity: 50.0 };

  it('AC should produce a cooling effect relative to baseline', () => {
    const result = runExperiment('ac', 60, initial);
    expect(result.delta.temp).toBeLessThan(0);
  });

  it('Heater should produce a warming effect relative to baseline', () => {
    const result = runExperiment('heater', 60, initial);
    expect(result.delta.temp).toBeGreaterThan(0);
  });

  it('Grow Lights should produce heat and light', () => {
    const result = runExperiment('growLights', 60, initial);
    expect(result.delta.temp).toBeGreaterThan(0);
  });

  it('Humidifier should increase humidity relative to baseline', () => {
    const result = runExperiment('humidifier', 60, initial);
    expect(result.delta.hum).toBeGreaterThan(0);
  });

  it('Dehumidifier should decrease humidity relative to baseline', () => {
    const result = runExperiment('dehumidifier', 60, initial);
    expect(result.delta.hum).toBeLessThan(0);
  });

  it('Water Pump should increase substrate moisture and decrease reservoir', () => {
    const result = runExperiment('waterPump', 60, initial);
    expect(result.delta.moisture).toBeGreaterThan(0);
    expect(result.delta.reservoir).toBeLessThan(0);
  });
});
