import { describe, expect, it } from 'vitest';
import { evaluateAutomation } from '../simulation/automationController';
import {
  DEFAULT_SETTINGS,
  INITIAL_CLOCK,
  INITIAL_EQUIPMENT_STATE,
  INITIAL_SENSORS,
} from '../simulation/defaults';
import { SensorState, SimulationClock } from '../simulation/types';

describe('Automation Controller Rules & Priority Hierarchy', () => {
  it('activates heater when temperature is below 18°C', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 17.4,
      humidity: 50,
      co2: 600,
      substrateMoisture: 55,
    };
    const { decision } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.finalOutputs.heater).toBe(true);
    expect(decision.finalOutputs.ac).toBe(false);
  });

  it('activates AC when temperature is above 27°C', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 28.5,
      humidity: 50,
      co2: 600,
      substrateMoisture: 55,
    };
    const { decision } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.finalOutputs.ac).toBe(true);
    expect(decision.finalOutputs.heater).toBe(false);
  });

  it('enforces interlock: heater and AC can NEVER both be ON', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 29.0,
    };
    const { decision } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.finalOutputs.heater && decision.finalOutputs.ac).toBe(false);
  });

  it('enforces interlock: humidifier and dehumidifier can NEVER both be ON', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      humidity: 35, // low humidity
    };
    const { decision } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.finalOutputs.humidifier).toBe(true);
    expect(decision.finalOutputs.dehumidifier).toBe(false);
  });

  it('Priority 1 Emergency overrides ordinary temperature and turns off grow lights during extreme heat (>32°C)', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 33.8, // Emergency threshold
      humidity: 50,
    };
    const { decision, alerts } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.emergencyActive).toBe(true);
    expect(decision.finalOutputs.ac).toBe(true);
    expect(decision.finalOutputs.heater).toBe(false);
    expect(decision.finalOutputs.growLights).toBe(false); // Forced OFF in thermal emergency!
    expect(alerts.some((a) => a.id === 'emergency_temp_high' && a.active)).toBe(true);
  });

  it('Priority 1 Emergency activates heater and limits exhaust in extreme cold (<15°C)', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 13.5,
    };
    const { decision, alerts } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.emergencyActive).toBe(true);
    expect(decision.finalOutputs.heater).toBe(true);
    expect(decision.finalOutputs.ac).toBe(false);
    expect(decision.finalOutputs.exhaustFan).toBe(false);
    expect(alerts.some((a) => a.id === 'emergency_temp_low' && a.active)).toBe(true);
  });

  it('waters substrate when moisture drops below 43%, but stops if reservoir is empty', () => {
    // Case A: Reservoir has water
    const sensorsDryWithWater: SensorState = {
      ...INITIAL_SENSORS,
      substrateMoisture: 41.0,
      reservoirLevel: 50.0,
    };
    const resA = evaluateAutomation(
      sensorsDryWithWater,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );
    expect(resA.decision.finalOutputs.waterPump).toBe(true);

    // Case B: Reservoir is EMPTY
    const sensorsDryEmptyTank: SensorState = {
      ...INITIAL_SENSORS,
      substrateMoisture: 41.0,
      reservoirLevel: 0.0, // EMPTY
    };
    const resB = evaluateAutomation(
      sensorsDryEmptyTank,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );
    expect(resB.decision.finalOutputs.waterPump).toBe(false);
    expect(resB.alerts.some((a) => a.id === 'alert_reservoir_empty' && a.active)).toBe(true);
  });

  it('triggers exhaust and inlet fans for low CO2 (<450 ppm)', () => {
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      co2: 410, // below 450 ppm
    };
    const { decision } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.finalOutputs.exhaustFan).toBe(true);
    expect(decision.finalOutputs.inletFan).toBe(true);
  });

  it('runs bi-hourly forced air exchange on simulated time even when CO2 is normal', () => {
    // At totalElapsedMinutes = 240 (exactly at 4h mark), minutes % 120 = 0 (< 10)
    const clockAtCycle: SimulationClock = {
      ...INITIAL_CLOCK,
      totalElapsedMinutes: 240,
      hour: 4,
      minute: 0,
    };
    const sensors: SensorState = {
      ...INITIAL_SENSORS,
      co2: 680, // normal CO2
    };

    const { decision } = evaluateAutomation(
      sensors,
      DEFAULT_SETTINGS,
      clockAtCycle,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );

    expect(decision.forcedVentActive).toBe(true);
    expect(decision.finalOutputs.exhaustFan).toBe(true);
    expect(decision.finalOutputs.inletFan).toBe(true);
  });

  it('maintains emergency alert until recovering inside hysteresis band', () => {
    // 1. Enter emergency at 33°C
    const initialSensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 33.0,
    };
    const initialRun = evaluateAutomation(
      initialSensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      []
    );
    expect(initialRun.decision.emergencyActive).toBe(true);

    // 2. Drop to 31.5°C (below 32°C limit, but above 30.5°C recovery band)
    const intermediateSensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 31.5,
    };
    const secondRun = evaluateAutomation(
      intermediateSensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      initialRun.alerts
    );
    // Hysteresis keeps emergency active!
    expect(secondRun.decision.emergencyActive).toBe(true);

    // 3. Drop to 29.5°C (inside safe recovery band < 30.5°C)
    const safeSensors: SensorState = {
      ...INITIAL_SENSORS,
      temperature: 29.5,
    };
    const thirdRun = evaluateAutomation(
      safeSensors,
      DEFAULT_SETTINGS,
      INITIAL_CLOCK,
      'automatic',
      INITIAL_EQUIPMENT_STATE,
      secondRun.alerts
    );
    // Emergency cleared
    expect(thirdRun.decision.emergencyActive).toBe(false);
  });
});
