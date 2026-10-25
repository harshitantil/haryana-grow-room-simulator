import { describe, expect, it } from 'vitest';
import { stepCoupledPhysics } from '../simulation/physicsModel';
import { INITIAL_EQUIPMENT_STATE, INITIAL_SENSORS } from '../simulation/defaults';
import { EquipmentState, SensorState } from '../simulation/types';

describe('Physical Behavior Regression Tests', () => {
  const baseSensors: SensorState = {
    ...INITIAL_SENSORS,
    temperature: 24.0,
    humidity: 50.0,
    co2: 600,
    substrateMoisture: 50.0,
    reservoirLevel: 80.0,
  };

  const defaultPhysicsInput = {
    currentState: baseSensors,
    outdoorTempC: 24.0,
    outdoorHumidityPct: 50.0,
    carbonFilterEquipped: true,
    carbonFilterEfficiency: 0.85,
    dtMinutes: 1,
  };

  it('1. Switching on the AC does not instantly change the temperature', () => {
    const acEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
    const res = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: acEquip });
    
    expect(Math.abs(res.nextState.temperature - baseSensors.temperature)).toBeLessThan(0.2);
  });

  it('2. With a net cooling load, the AC gradually lowers temperature over simulated time', () => {
    let state = baseSensors;
    const acEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
    
    const iterations = 60;
    for (let i = 0; i < iterations; i++) {
      const res = stepCoupledPhysics({ 
        ...defaultPhysicsInput, 
        currentState: state, 
        equipment: acEquip 
      });
      state = res.nextState;
    }
    
    expect(state.temperature).toBeLessThan(baseSensors.temperature);
  });

  it('3. With a net heating load, the heater gradually raises temperature', () => {
    let state = baseSensors;
    const heaterEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: true };
    
    const iterations = 60;
    for (let i = 0; i < iterations; i++) {
      const res = stepCoupledPhysics({ 
        ...defaultPhysicsInput, 
        currentState: state, 
        equipment: heaterEquip 
      });
      state = res.nextState;
    }
    
    expect(state.temperature).toBeGreaterThan(baseSensors.temperature);
  });

  it('4. Switching on grow lights increases light output and contributes heat', () => {
    const lightsOffEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, growLights: false };
    const lightsOnEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, growLights: true };

    const resOff = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: lightsOffEquip });
    const resOn = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: lightsOnEquip });

    expect(resOn.nextState.lightLevel).toBeGreaterThan(resOff.nextState.lightLevel);
    expect(resOn.nextState.temperature).toBeGreaterThan(resOff.nextState.temperature);
  });

  it('5. Exhaust ventilation moves indoor temperature toward outdoor temperature', () => {
    const ventEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, exhaustFan: true, inletFan: true };
    
    const resCold = stepCoupledPhysics({ 
      ...defaultPhysicsInput, 
      equipment: ventEquip, 
      outdoorTempC: 10.0 
    });
    expect(resCold.nextState.temperature).toBeLessThan(baseSensors.temperature);
    
    const resHot = stepCoupledPhysics({ 
      ...defaultPhysicsInput, 
      equipment: ventEquip, 
      outdoorTempC: 35.0 
    });
    expect(resHot.nextState.temperature).toBeGreaterThan(baseSensors.temperature);
  });

  it('6. An oscillating fan does not create an arbitrary large net cooling effect', () => {
    const idleEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, oscillatingFans: false };
    const fanEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, oscillatingFans: true };

    const resIdle = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: idleEquip });
    const resFan = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: fanEquip });

    expect(resFan.nextState.temperature).toBeGreaterThanOrEqual(resIdle.nextState.temperature - 0.01);
  });

  it('7. A humidifier changes moisture rather than directly subtracting a large temperature value', () => {
    const humEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, humidifier: true };
    const res = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: humEquip });

    expect(res.nextState.humidity).toBeGreaterThan(baseSensors.humidity);
    expect(Math.abs(res.nextState.temperature - baseSensors.temperature)).toBeLessThan(0.2);
  });

  it('8. A pump changes reservoir and substrate moisture without causing an artificial room-temperature drop', () => {
    const pumpEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, waterPump: true };
    const res = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: pumpEquip });

    expect(res.nextState.substrateMoisture).toBeGreaterThan(baseSensors.substrateMoisture);
    expect(res.nextState.reservoirLevel).toBeLessThan(baseSensors.reservoirLevel);
    expect(Math.abs(res.nextState.temperature - baseSensors.temperature)).toBeLessThan(0.2);
  });

  it('9. Different equipment types produce different, physically justified effects', () => {
    const acEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
    const heaterEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: true };

    const resAC = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: acEquip });
    const resHeater = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: heaterEquip });

    expect(resAC.nextState.temperature).toBeLessThan(resHeater.nextState.temperature);
  });

  it('10. Turning off a device stops its contribution', () => {
    const heaterOnEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: true };
    const heaterOffEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: false };

    const resOn = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: heaterOnEquip });
    const resOff = stepCoupledPhysics({ ...defaultPhysicsInput, currentState: resOn.nextState, equipment: heaterOffEquip });

    expect(resOn.nextState.temperature).toBeGreaterThan(baseSensors.temperature);
    // In a real room, it doesn't drop instantly. It decays.
    // We verify that the temperature doesn't continue to RISE.
    expect(resOff.nextState.temperature).toBeLessThanOrEqual(resOn.nextState.temperature + 0.05);
  });

  it('11. Different simulation speeds advance the same model consistently', () => {
    const acEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
    
    let state1 = baseSensors;
    for(let i=0; i<10; i++) {
      state1 = stepCoupledPhysics({ ...defaultPhysicsInput, currentState: state1, equipment: acEquip, dtMinutes: 1 }).nextState;
    }

    let state2 = baseSensors;
    for(let i=0; i<100; i++) {
      state2 = stepCoupledPhysics({ ...defaultPhysicsInput, currentState: state2, equipment: acEquip, dtMinutes: 0.1 }).nextState;
    }

    expect(state1.temperature).toBeCloseTo(state2.temperature, 0);
  });

  it('12. Repeated toggling does not create duplicate simulation loops', () => {
    const acEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
    const res1 = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: acEquip });
    const res2 = stepCoupledPhysics({ ...defaultPhysicsInput, equipment: acEquip });
    
    expect(res1.nextState.temperature).toBe(res2.nextState.temperature);
  });

  it('13. Equipment interlocks and empty-reservoir protections remain functional', () => {
    const pumpEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, waterPump: true };
    const emptyReservoirSensors = { ...baseSensors, reservoirLevel: 0 };
    
    const res = stepCoupledPhysics({ 
      ...defaultPhysicsInput, 
      currentState: emptyReservoirSensors, 
      equipment: pumpEquip 
    });

    expect(res.nextState.substrateMoisture).toBeLessThanOrEqual(emptyReservoirSensors.substrateMoisture);
  });

  it('14. Simulation remains stable for a prolonged run and never produces NaN', () => {
    let state = baseSensors;
    const acEquip: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true, heater: true }; 
    
    for (let i = 0; i < 1000; i++) {
      const res = stepCoupledPhysics({ 
        ...defaultPhysicsInput, 
        currentState: state, 
        equipment: acEquip 
      });
      state = res.nextState;
      if (isNaN(state.temperature) || isNaN(state.humidity)) {
        throw new Error('Simulation diverged to NaN');
      }
    }
    expect(state.temperature).toBeGreaterThan(-100);
    expect(state.temperature).toBeLessThan(100);
  });
});
