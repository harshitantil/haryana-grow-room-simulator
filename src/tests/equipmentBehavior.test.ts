/**
 * Equipment Behavior Regression Tests
 * 
 * These tests verify that different equipment types produce distinct, physically justified effects
 * and that environmental changes are gradual over simulated time rather than instantaneous.
 */

import { describe, it, expect } from 'vitest';
import { stepCoupledPhysics } from '../simulation/physicsModel';
import { INITIAL_SENSORS, INITIAL_EQUIPMENT_STATE } from '../simulation/defaults';
import { EquipmentState, SensorState } from '../simulation/types';

describe('Equipment Behavior Regression Tests', () => {
  const createInitialState = (): SensorState => ({
    ...INITIAL_SENSORS,
    temperature: 25.0,
    humidity: 50.0,
    co2: 600,
    substrateMoisture: 50.0,
    reservoirLevel: 80.0,
    outsideTemperature: 30.0,
    outsideHumidity: 55.0,
  });

  describe('1. AC cooling behavior', () => {
    it('should not instantly change temperature when AC is turned on', () => {
      const initialState = createInitialState();
      const equipmentWithAC: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
      
      const { nextState } = stepCoupledPhysics({
        currentState: initialState,
        equipment: equipmentWithAC,
        outdoorTempC: 30.0,
        outdoorHumidityPct: 55.0,
        carbonFilterEquipped: true,
        carbonFilterEfficiency: 0.85,
        dtMinutes: 0.1, // 6 seconds
      });

      const tempChange = Math.abs(nextState.temperature - initialState.temperature);
      expect(tempChange).toBeLessThan(0.2);
    });

    it('should gradually lower temperature over simulated time with AC on', () => {
      const initialState = createInitialState();
      const equipmentWithAC: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, ac: true };
      
      let state = initialState;
      const tempChanges: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithAC,
          outdoorTempC: 35.0,
          outdoorHumidityPct: 60.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        tempChanges.push(nextState.temperature - state.temperature);
        state = nextState;
      }

      const totalChange = state.temperature - initialState.temperature;
      expect(totalChange).toBeLessThan(0);
      expect(Math.abs(totalChange)).toBeGreaterThan(0.5);
      
      tempChanges.forEach(change => {
        expect(Math.abs(change)).toBeLessThan(0.12);
      });
    });
  });

  describe('2. Heater warming behavior', () => {
    it('should gradually raise temperature with heater on', () => {
      const initialState = createInitialState();
      const equipmentWithHeater: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: true };
      
      let state = initialState;
      
      for (let i = 0; i < 100; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithHeater,
          outdoorTempC: 15.0,
          outdoorHumidityPct: 40.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      const totalChange = state.temperature - initialState.temperature;
      expect(totalChange).toBeGreaterThan(0);
      expect(totalChange).toBeLessThan(15.0);
    });
  });

  describe('3. Grow lights behavior', () => {
    it('should increase light output when grow lights are enabled', () => {
      const initialState = createInitialState();
      const equipmentWithLights: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, growLights: true };
      
      const { nextState } = stepCoupledPhysics({
        currentState: initialState,
        equipment: equipmentWithLights,
        outdoorTempC: 30.0,
        outdoorHumidityPct: 55.0,
        carbonFilterEquipped: true,
        carbonFilterEfficiency: 0.85,
        dtMinutes: 0.1,
      });

      expect(nextState.lightLevel).toBe(48000);
    });

    it('should contribute heat when grow lights are on', () => {
      const initialState = createInitialState();
      const equipmentWithLights: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, growLights: true };
      const equipmentWithoutLights: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, growLights: false };
      
      const { nextState: withLights } = stepCoupledPhysics({
        currentState: initialState,
        equipment: equipmentWithLights,
        outdoorTempC: 25.0,
        outdoorHumidityPct: 50.0,
        carbonFilterEquipped: true,
        carbonFilterEfficiency: 0.85,
        dtMinutes: 1.0,
      });

      const { nextState: withoutLights } = stepCoupledPhysics({
        currentState: initialState,
        equipment: equipmentWithoutLights,
        outdoorTempC: 25.0,
        outdoorHumidityPct: 50.0,
        carbonFilterEquipped: true,
        carbonFilterEfficiency: 0.85,
        dtMinutes: 1.0,
      });

      expect(withLights.temperature).toBeGreaterThan(withoutLights.temperature);
    });
  });

  describe('4. Exhaust ventilation behavior', () => {
    it('should cool room when outdoor temp is cooler than indoor', () => {
      const initialState = createInitialState();
      initialState.temperature = 30.0;
      const equipmentWithExhaust: EquipmentState = { 
        ...INITIAL_EQUIPMENT_STATE, 
        exhaustFan: true,
        inletFan: true
      };
      
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithExhaust,
          outdoorTempC: 20.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      expect(state.temperature).toBeLessThan(initialState.temperature);
    });

    it('should warm room when outdoor temp is hotter than indoor', () => {
      const initialState = createInitialState();
      initialState.temperature = 20.0;
      const equipmentWithExhaust: EquipmentState = { 
        ...INITIAL_EQUIPMENT_STATE, 
        exhaustFan: true,
        inletFan: true
      };
      
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithExhaust,
          outdoorTempC: 35.0,
          outdoorHumidityPct: 60.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      expect(state.temperature).toBeGreaterThan(initialState.temperature);
    });
  });

  describe('5. Oscillating fan behavior', () => {
    it('should not create large net cooling effect', () => {
      const initialState = createInitialState();
      const equipmentWithFan: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, oscillatingFans: true };
      
      let state = initialState;
      
      for (let i = 0; i < 100; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithFan,
          outdoorTempC: 25.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      const tempChange = Math.abs(state.temperature - initialState.temperature);
      expect(tempChange).toBeLessThan(3.0);
    });
  });

  describe('6. Humidifier behavior', () => {
    it('should increase humidity without causing large temperature drop', () => {
      const initialState = createInitialState();
      initialState.humidity = 40.0;
      const equipmentWithHumidifier: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, humidifier: true };
      
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithHumidifier,
          outdoorTempC: 25.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      expect(state.humidity).toBeGreaterThan(initialState.humidity);
      const tempChange = Math.abs(state.temperature - initialState.temperature);
      expect(tempChange).toBeLessThan(2.0);
    });
  });

  describe('7. Water pump behavior', () => {
    it('should change substrate and reservoir moisture without affecting room temperature directly', () => {
      const initialState = createInitialState();
      initialState.substrateMoisture = 40.0;
      initialState.reservoirLevel = 80.0;
      const equipmentWithPump: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, waterPump: true };
      
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithPump,
          outdoorTempC: 25.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      expect(state.substrateMoisture).toBeGreaterThan(initialState.substrateMoisture);
      expect(state.reservoirLevel).toBeLessThan(initialState.reservoirLevel);
      const tempChange = Math.abs(state.temperature - initialState.temperature);
      expect(tempChange).toBeLessThan(2.0);
    });

    it('should not pump when reservoir is empty', () => {
      const initialState = createInitialState();
      initialState.reservoirLevel = 0.0;
      initialState.substrateMoisture = 40.0;
      const equipmentWithPump: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, waterPump: true };
      
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        const { nextState, fluxes } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithPump,
          outdoorTempC: 25.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        
        expect(fluxes.substrate.irrigationPctPerMin).toBe(0);
        state = nextState;
      }

      expect(state.substrateMoisture).toBeLessThan(initialState.substrateMoisture + 1.0);
    });
  });

  describe('8. Different equipment produce different effects', () => {
    it('AC and heater should have opposite temperature effects', () => {
      const initialState = createInitialState();
      
      const { nextState: acResult } = stepCoupledPhysics({
        currentState: initialState,
        equipment: { ...INITIAL_EQUIPMENT_STATE, ac: true },
        outdoorTempC: 25.0,
        outdoorHumidityPct: 50.0,
        carbonFilterEquipped: true,
        carbonFilterEfficiency: 0.85,
        dtMinutes: 1.0,
      });

      const { nextState: heaterResult } = stepCoupledPhysics({
        currentState: initialState,
        equipment: { ...INITIAL_EQUIPMENT_STATE, heater: true },
        outdoorTempC: 25.0,
        outdoorHumidityPct: 50.0,
        carbonFilterEquipped: true,
        carbonFilterEfficiency: 0.85,
        dtMinutes: 1.0,
      });

      expect(acResult.temperature).toBeLessThan(initialState.temperature);
      expect(heaterResult.temperature).toBeGreaterThan(initialState.temperature);
    });
  });

  describe('9. Turning off device stops contribution', () => {
    it('should stop heating when heater is turned off', () => {
      const initialState = createInitialState();
      const equipmentWithHeater: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: true };
      const equipmentWithoutHeater: EquipmentState = { ...INITIAL_EQUIPMENT_STATE, heater: false };
      
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithHeater,
          outdoorTempC: 20.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      const tempWithHeater = state.temperature;
      
      for (let i = 0; i < 50; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment: equipmentWithoutHeater,
          outdoorTempC: 20.0,
          outdoorHumidityPct: 50.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        state = nextState;
      }

      expect(state.temperature).toBeLessThanOrEqual(tempWithHeater + 0.5);
    });
  });

  describe('10. Simulation stability', () => {
    it('should remain stable for prolonged run without NaN or Infinity', () => {
      const initialState = createInitialState();
      const equipment: EquipmentState = { 
        ...INITIAL_EQUIPMENT_STATE,
        growLights: true,
        oscillatingFans: true
      };
      
      let state = initialState;
      
      for (let i = 0; i < 600; i++) {
        const { nextState } = stepCoupledPhysics({
          currentState: state,
          equipment,
          outdoorTempC: 30.0,
          outdoorHumidityPct: 55.0,
          carbonFilterEquipped: true,
          carbonFilterEfficiency: 0.85,
          dtMinutes: 0.1,
        });
        
        expect(nextState.temperature).not.toBeNaN();
        expect(Number.isFinite(nextState.temperature)).toBe(true);
        expect(nextState.humidity).not.toBeNaN();
        expect(Number.isFinite(nextState.humidity)).toBe(true);
        expect(nextState.co2).not.toBeNaN();
        expect(Number.isFinite(nextState.co2)).toBe(true);
        expect(nextState.substrateMoisture).not.toBeNaN();
        expect(nextState.reservoirLevel).not.toBeNaN();
        expect(Number.isFinite(nextState.reservoirLevel)).toBe(true);
        expect(nextState.temperature).toBeGreaterThanOrEqual(0);
        expect(nextState.temperature).toBeLessThanOrEqual(60);
        expect(nextState.humidity).toBeGreaterThanOrEqual(5);
        expect(nextState.humidity).toBeLessThanOrEqual(100);
        expect(nextState.co2).toBeGreaterThanOrEqual(250);
        expect(nextState.co2).toBeLessThanOrEqual(2500);
        expect(nextState.substrateMoisture).toBeGreaterThanOrEqual(5);
        expect(nextState.substrateMoisture).toBeLessThanOrEqual(100);
        expect(nextState.reservoirLevel).toBeGreaterThanOrEqual(0);
        expect(nextState.reservoirLevel).toBeLessThanOrEqual(100);
        
        state = nextState;
      }
    });
  });
})
