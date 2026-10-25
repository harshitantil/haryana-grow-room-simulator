import { describe, expect, it } from 'vitest';
import {
  getSaturationVaporDensityGPerM3,
  relativeHumidityToVaporMass,
  stepCoupledPhysics,
  vaporMassToRelativeHumidity,
} from '../simulation/physicsModel';
import { INITIAL_EQUIPMENT_STATE, INITIAL_SENSORS } from '../simulation/defaults';
import { EquipmentState, SensorState } from '../simulation/types';

describe('Coupled Grow-Room Physics Model', () => {
  const baseSensors: SensorState = {
    ...INITIAL_SENSORS,
    temperature: 24.0,
    humidity: 50.0,
    co2: 600,
    substrateMoisture: 50.0,
    reservoirLevel: 80.0,
  };

  it('proves thermal coupling: warmer outdoor temperature increases net heat gain and indoor temperature', () => {
    const idleEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      heater: false,
      ac: false,
      growLights: false,
      exhaustFan: false,
      inletFan: false,
    };

    // Run A: Hot outdoor (38°C)
    const runHot = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: idleEquip,
      outdoorTempC: 38.0,
      outdoorHumidityPct: 40.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 30,
    });

    // Run B: Cold outdoor (10°C)
    const runCold = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: idleEquip,
      outdoorTempC: 10.0,
      outdoorHumidityPct: 40.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 30,
    });

    expect(runHot.nextState.temperature).toBeGreaterThan(baseSensors.temperature);
    expect(runCold.nextState.temperature).toBeLessThan(baseSensors.temperature);
    expect(runHot.fluxes.heat.envelopeW).toBeGreaterThan(0);
    expect(runCold.fluxes.heat.envelopeW).toBeLessThan(0);
  });

  it('proves grow lights add light intensity and sensible thermal heat', () => {
    const lightsOffEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      growLights: false,
      heater: false,
      ac: false,
    };
    const lightsOnEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      growLights: true,
      heater: false,
      ac: false,
    };

    const resOff = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: lightsOffEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 20,
    });

    const resOn = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: lightsOnEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 20,
    });

    expect(resOn.nextState.lightLevel).toBe(48000);
    expect(resOn.fluxes.heat.growLightsW).toBe(450);
    expect(resOn.nextState.temperature).toBeGreaterThan(resOff.nextState.temperature);
  });

  it('proves AC cools and heater warms relative to idle', () => {
    const idleEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      heater: false,
      ac: false,
      growLights: false,
    };
    const acEquip: EquipmentState = {
      ...idleEquip,
      ac: true,
    };
    const heaterEquip: EquipmentState = {
      ...idleEquip,
      heater: true,
    };

    const resIdle = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: idleEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 15,
    });

    const resAC = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: acEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 15,
    });

    const resHeater = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: heaterEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 15,
    });

    expect(resAC.nextState.temperature).toBeLessThan(resIdle.nextState.temperature);
    expect(resHeater.nextState.temperature).toBeGreaterThan(resIdle.nextState.temperature);
    expect(resAC.fluxes.heat.acCoolingW).toBeLessThan(0);
    expect(resHeater.fluxes.heat.heaterW).toBe(2000);
  });

  it('proves psychrometric coupling: warming air at constant vapor mass decreases relative humidity', () => {
    const temp1 = 20.0;
    const temp2 = 28.0;

    const initialRH = 60.0;
    // Calculate water vapor mass in room at 20°C and 60% RH
    const vaporMass = relativeHumidityToVaporMass(initialRH, temp1);

    // If the room warms to 28°C with the exact same vapor mass:
    const resultingRH = vaporMassToRelativeHumidity(vaporMass, temp2);

    // Saturation vapor capacity is higher at 28°C than at 20°C, so RH must drop!
    expect(resultingRH).toBeLessThan(initialRH);
    expect(getSaturationVaporDensityGPerM3(temp2)).toBeGreaterThan(getSaturationVaporDensityGPerM3(temp1));
  });

  it('proves humidifier increases moisture and dehumidifier decreases moisture', () => {
    const idleEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      humidifier: false,
      dehumidifier: false,
      heater: false,
      ac: false,
    };
    const humEquip: EquipmentState = { ...idleEquip, humidifier: true };
    const dehumEquip: EquipmentState = { ...idleEquip, dehumidifier: true };

    const resHum = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: humEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 20,
    });

    const resDehum = stepCoupledPhysics({
      currentState: baseSensors,
      equipment: dehumEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 20,
    });

    expect(resHum.nextState.humidity).toBeGreaterThan(baseSensors.humidity);
    expect(resDehum.nextState.humidity).toBeLessThan(baseSensors.humidity);
  });

  it('proves carbon filter does NOT scrub CO2, but reduces exhaust airflow through resistance', () => {
    const exhaustWithFilter: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      exhaustFan: true,
      inletFan: false,
      carbonFilter: true,
      growLights: false,
    };
    const exhaustWithoutFilter: EquipmentState = {
      ...exhaustWithFilter,
      carbonFilter: false,
    };

    const resWith = stepCoupledPhysics({
      currentState: { ...baseSensors, co2: 800 },
      equipment: exhaustWithFilter,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      outdoorCo2BaselinePpm: 420,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 10,
    });

    const resWithout = stepCoupledPhysics({
      currentState: { ...baseSensors, co2: 800 },
      equipment: exhaustWithoutFilter,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      outdoorCo2BaselinePpm: 420,
      carbonFilterEquipped: false,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 10,
    });

    // Both exchange air toward 420 ppm, but unfiltered moves air faster
    expect(resWith.nextState.co2).toBeLessThan(800);
    expect(resWithout.nextState.co2).toBeLessThan(resWith.nextState.co2);
  });

  it('proves water pump hydrates substrate and depletes reservoir with empty tank cutoff', () => {
    // Normal tank watering
    const wateringEquip: EquipmentState = {
      ...INITIAL_EQUIPMENT_STATE,
      waterPump: true,
    };

    const resWater = stepCoupledPhysics({
      currentState: { ...baseSensors, substrateMoisture: 40.0, reservoirLevel: 50.0 },
      equipment: wateringEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 5,
    });

    expect(resWater.nextState.substrateMoisture).toBeGreaterThan(40.0);
    expect(resWater.nextState.reservoirLevel).toBeLessThan(50.0);

    // Empty tank: pump cannot add water
    const resEmpty = stepCoupledPhysics({
      currentState: { ...baseSensors, substrateMoisture: 40.0, reservoirLevel: 0.0 },
      equipment: wateringEquip,
      outdoorTempC: 24.0,
      outdoorHumidityPct: 50.0,
      carbonFilterEquipped: true,
      carbonFilterEfficiency: 0.85,
      dtMinutes: 5,
    });

    expect(resEmpty.nextState.substrateMoisture).toBeLessThanOrEqual(40.0); // dries, cannot hydrate
    expect(resEmpty.nextState.reservoirLevel).toBe(0.0);
  });
});
