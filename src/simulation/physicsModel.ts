/**
 * Coupled Indoor Environmental Physics Model
 *
 * Implements a lumped, energy-and-mass conservation model for a 10 ft x 10 ft x 8 ft
 * indoor grow room in Haryana. Indoor temperature, relative humidity (via water-vapour mass),
 * CO2 concentration, substrate moisture, and reservoir level are dynamically coupled to
 * outdoor weather forcing, equipment actuator states, and plant physiological processes.
 */

import { EquipmentState, SensorState } from './types';

export interface RoomPhysicsConstants {
  floorAreaM2: number; // 9.29 m2 (100 sq ft)
  heightM: number; // 2.438 m (8 ft)
  volumeM3: number; // 22.65 m3 (800 cu ft)
  effectiveThermalMassJPerK: number; // Recalibrated to ~1.5M J/K for plausible room inertia
  envelopeHeatLossWPerK: number; // 25.0 W/K (insulated polyurethane panel walls)
  airDensityKgPerM3: number; // 1.20 kg/m3
  airSpecificHeatJPerKgK: number; // 1005 J/kg K
  gasConstantWaterVaporJPerKgK: number; // 461.5 J/kg K
}

export const ROOM_PHYSICS_CONSTANTS: RoomPhysicsConstants = {
  floorAreaM2: 9.29,
  heightM: 2.438,
  volumeM3: 22.65,
  effectiveThermalMassJPerK: 1500000, 
  envelopeHeatLossWPerK: 25.0,
  airDensityKgPerM3: 1.2,
  airSpecificHeatJPerKgK: 1005,
  gasConstantWaterVaporJPerKgK: 461.5,
};

export interface PhysicalFluxes {
  // Heat fluxes in Watts (Joules / second)
  heat: {
    envelopeW: number;
    solarW: number;
    growLightsW: number;
    heaterW: number;
    acCoolingW: number; // negative value
    dehumidifierW: number;
    fansW: number;
    ventilationW: number;
    netHeatW: number;
  };
  // Moisture fluxes in grams per hour (g/h)
  moisture: {
    humidifierGPerH: number;
    dehumidifierGPerH: number; // negative value
    acCondensationGPerH: number; // negative value
    plantTranspirationGPerH: number;
    substrateEvaporationGPerH: number;
    ventilationMoistureGPerH: number;
    netMoistureGPerH: number;
  };
  // CO2 fluxes in ppm per minute
  co2: {
    photosynthesisPpmPerMin: number; // negative value
    respirationPpmPerMin: number;
    ventilationPpmPerMin: number;
    netCo2PpmPerMin: number;
  };
  // Substrate water balance in % per minute
  substrate: {
    irrigationPctPerMin: number;
    dryingPctPerMin: number; // negative value
    netMoisturePctPerMin: number;
  };
  // Reservoir balance in % per minute
  reservoir: {
    pumpDrawdownPctPerMin: number;
  };
}

/**
 * Calculates saturation water vapor pressure in kPa using the Tetens/Magnus formula:
 * e_s(T) = 0.61078 * exp((17.27 * T) / (T + 237.3))
 */
export function getSaturationVaporPressureKPa(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/**
 * Calculates saturation water vapor density in g/m3:
 * rho_v_sat = (e_s * 1000) / (R_v * (T + 273.15)) * 1000
 */
export function getSaturationVaporDensityGPerM3(tempC: number): number {
  const esPa = getSaturationVaporPressureKPa(tempC) * 1000;
  const tempK = tempC + 273.15;
  const densityKgPerM3 = esPa / (ROOM_PHYSICS_CONSTANTS.gasConstantWaterVaporJPerKgK * tempK);
  return densityKgPerM3 * 1000; // grams / m3
}

/**
 * Converts water vapor mass in the room (grams) to Relative Humidity (% RH)
 * at the given room air temperature.
 */
export function vaporMassToRelativeHumidity(vaporMassGrams: number, tempC: number): number {
  const maxVaporDensity = getSaturationVaporDensityGPerM3(tempC);
  const maxRoomVaporGrams = maxVaporDensity * ROOM_PHYSICS_CONSTANTS.volumeM3;
  if (maxRoomVaporGrams <= 0) return 100;
  const rh = (vaporMassGrams / maxRoomVaporGrams) * 100;
  return Math.max(5, Math.min(100, rh));
}

/**
 * Converts Relative Humidity (% RH) and temperature (°C) into total water vapor mass (grams) in the room.
 */
export function relativeHumidityToVaporMass(rhPct: number, tempC: number): number {
  const maxVaporDensity = getSaturationVaporDensityGPerM3(tempC);
  const maxRoomVaporGrams = maxVaporDensity * ROOM_PHYSICS_CONSTANTS.volumeM3;
  return (rhPct / 100) * maxRoomVaporGrams;
}

export interface PhysicsStepInput {
  currentState: SensorState;
  equipment: EquipmentState;
  outdoorTempC: number;
  outdoorHumidityPct: number;
  solarRadiationWm2?: number | null;
  carbonFilterEquipped: boolean;
  carbonFilterEfficiency: number; // e.g. 0.85
  outdoorCo2BaselinePpm?: number; // default 420 ppm
  dtMinutes: number;
}

export interface PhysicsStepOutput {
  nextState: SensorState;
  fluxes: PhysicalFluxes;
}

/**
 * Executes one deterministic step of the coupled grow-room physics model.
 */
export function stepCoupledPhysics(input: PhysicsStepInput): PhysicsStepOutput {
  const {
    currentState,
    equipment,
    outdoorTempC,
    outdoorHumidityPct,
    solarRadiationWm2 = 0,
    carbonFilterEquipped,
    carbonFilterEfficiency,
    outdoorCo2BaselinePpm = 420,
    dtMinutes,
  } = input;

  const dtSeconds = dtMinutes * 60;
  const room = ROOM_PHYSICS_CONSTANTS;

  // -------------------------------------------------------------
  // 1. VENTILATION VOLUMETRIC FLOW (m3/s)
  // -------------------------------------------------------------
  // Exhaust fan: 350 CFM = 0.165 m3/s
  // Inlet fan: 250 CFM = 0.118 m3/s
  // Carbon filter adds flow resistance if equipped on exhaust duct
  const filterMultiplier = equipment.carbonFilter && carbonFilterEquipped ? carbonFilterEfficiency : 1.0;
  let activeVentFlowM3PerS = 0;

  if (equipment.exhaustFan && equipment.inletFan) {
    // Balanced mechanical ventilation
    activeVentFlowM3PerS = 0.165 * filterMultiplier;
  } else if (equipment.exhaustFan) {
    // Exhaust with negative pressure infiltration
    activeVentFlowM3PerS = 0.14 * filterMultiplier;
  } else if (equipment.inletFan) {
    // Inlet with positive pressure leakage
    activeVentFlowM3PerS = 0.10;
  } else {
    // Closed room passive background infiltration (tight sealed room: ~0.001 air changes/min = 0.000377 m3/s)
    activeVentFlowM3PerS = (room.volumeM3 * 0.001) / 60;
  }

  const ventAirMassFlowKgPerS = activeVentFlowM3PerS * room.airDensityKgPerM3;

  // -------------------------------------------------------------
  // 2. SENSIBLE HEAT BALANCE (Watts = Joules/second)
  // -------------------------------------------------------------
  // Envelope conduction: Q_env = UA * (T_out - T_in)
  const envelopeW = room.envelopeHeatLossWPerK * (outdoorTempC - currentState.temperature);

  // Solar radiation roof conduction (small fraction absorbed through roof/ceiling):
  const solarFlux = solarRadiationWm2 || 0;
  const solarW = solarFlux * room.floorAreaM2 * 0.012; // 1.2% effective roof thermal conduction

  // Grow lights: 600W fixture, 75% converted to sensible heat
  const growLightsW = equipment.growLights ? 450.0 : 0.0;

  // Electric Heater: 2000W rated output
  const heaterW = equipment.heater ? 2000.0 : 0.0;

  // Air Conditioner: 12,000 BTU/h = 3,517 Watts of sensible cooling
  const acCoolingW = equipment.ac ? -3517.0 : 0.0;

  // Dehumidifier compressor waste heat: +320W
  const dehumidifierW = equipment.dehumidifier ? 320.0 : 0.0;

  // Fans & pump motor heat: +45W
  let fansW = 0.0;
  if (equipment.oscillatingFans) fansW += 35.0;
  if (equipment.exhaustFan) fansW += 20.0;
  if (equipment.inletFan) fansW += 15.0;
  if (equipment.waterPump) fansW += 25.0;

  // Ventilation sensible heat: m_dot * c_p * (T_out - T_in)
  const ventilationW = ventAirMassFlowKgPerS * room.airSpecificHeatJPerKgK * (outdoorTempC - currentState.temperature);

  const netHeatW = envelopeW + solarW + growLightsW + heaterW + acCoolingW + dehumidifierW + fansW + ventilationW;

  // Delta Temperature = (Q_net * dtSeconds) / C_th
  const deltaTempC = (netHeatW * dtSeconds) / room.effectiveThermalMassJPerK;
  let nextTempC = currentState.temperature + deltaTempC;

  // -------------------------------------------------------------
  // 3. MOISTURE BALANCE & PSYCHROMETRIC COUPLING
  // -------------------------------------------------------------
  // Convert current relative humidity to actual water vapor mass in the room (grams)
  const currentVaporMassGrams = relativeHumidityToVaporMass(currentState.humidity, currentState.temperature);

  // Sources and sinks in grams per hour (g/h)
  const humidifierGPerH = equipment.humidifier ? 520.0 : 0.0;
  const dehumidifierGPerH = equipment.dehumidifier ? -680.0 : 0.0;

  // AC cooling condensation (condenses water vapor when running)
  const acCondensationGPerH = equipment.ac ? -220.0 : 0.0;

  // Plant transpiration: depends on light, temperature, and substrate moisture
  const substrateFactor = Math.max(0.1, Math.min(1.0, currentState.substrateMoisture / 50));
  const plantTranspirationGPerH = (equipment.growLights ? 140.0 : 25.0) * substrateFactor;

  // Substrate surface evaporation: higher with oscillating fans and warm air
  let substrateEvaporationGPerH = (currentState.substrateMoisture / 100) * 35.0;
  if (equipment.oscillatingFans) substrateEvaporationGPerH *= 1.35;

  // Ventilation moisture exchange: V_vent * (rho_v_out - rho_v_in)
  const outdoorVaporDensityGPerM3 = getSaturationVaporDensityGPerM3(outdoorTempC) * (outdoorHumidityPct / 100);
  const indoorVaporDensityGPerM3 = currentVaporMassGrams / room.volumeM3;
  const ventMoistureGPerS = activeVentFlowM3PerS * (outdoorVaporDensityGPerM3 - indoorVaporDensityGPerM3);
  const ventilationMoistureGPerH = ventMoistureGPerS * 3600;

  const netMoistureGPerH =
    humidifierGPerH +
    dehumidifierGPerH +
    acCondensationGPerH +
    plantTranspirationGPerH +
    substrateEvaporationGPerH +
    ventilationMoistureGPerH;

  // Net change in vapor mass over dtMinutes
  const deltaVaporMassGrams = (netMoistureGPerH * dtMinutes) / 60;
  const nextVaporMassGrams = Math.max(20, currentVaporMassGrams + deltaVaporMassGrams);

  // Derive new Relative Humidity using next temperature (Psychrometric coupling!)
  let nextHumidityPct = vaporMassToRelativeHumidity(nextVaporMassGrams, nextTempC);

  // -------------------------------------------------------------
  // 4. CO2 MASS BALANCE (ppm)
  // -------------------------------------------------------------
  // Outside fresh air CO2: baseline (420 ppm)
  // Photosynthesis under lights: consumes CO2 (-2.6 ppm/min)
  // Respiration in dark: releases small CO2 (+0.65 ppm/min)
  const photosynthesisPpmPerMin = equipment.growLights ? -2.6 : 0.0;
  const respirationPpmPerMin = equipment.growLights ? 0.0 : 0.65;
  const plantCo2PpmPerMin = photosynthesisPpmPerMin + respirationPpmPerMin;

  // Ventilation air changes rate k (1/min) = (activeVentFlowM3PerS * 60) / room.volumeM3
  const airChangesPerMin = (activeVentFlowM3PerS * 60) / room.volumeM3;

  // Analytical exponential decay for continuous dilution towards outdoor baseline:
  // C(t + dt) = C_out + (C_in - C_out) * exp(-k * dt) + plantCo2 * dt
  const decayFactor = Math.exp(-airChangesPerMin * dtMinutes);
  const ventCo2Equilibrium = outdoorCo2BaselinePpm + (currentState.co2 - outdoorCo2BaselinePpm) * decayFactor;
  let nextCo2 = ventCo2Equilibrium + plantCo2PpmPerMin * dtMinutes;

  const ventilationPpmPerMin = (ventCo2Equilibrium - currentState.co2) / Math.max(0.001, dtMinutes);
  const netCo2PpmPerMin = plantCo2PpmPerMin + ventilationPpmPerMin;

  // -------------------------------------------------------------
  // 5. SUBSTRATE MOISTURE & RESERVOIR BALANCE
  // -------------------------------------------------------------
  // Substrate effective capacity ~40 Litres total across 4 plant beds
  // Pump delivery: +1.2% / min moisture
  let irrigationPctPerMin = 0.0;
  let pumpDrawdownPctPerMin = 0.0;

  if (equipment.waterPump && currentState.reservoirLevel > 0.05) {
    irrigationPctPerMin = 1.25;
    // Reservoir tank 50 Litres: 1.2 L/min = 2.4% / min drawdown
    pumpDrawdownPctPerMin = -2.4;
  }

  // Drying rate from transpiration + evaporation (% moisture / min)
  let dryingPctPerMin = 0.022;
  if (equipment.growLights) dryingPctPerMin += 0.018;
  if (equipment.oscillatingFans) dryingPctPerMin += 0.008;
  if (currentState.temperature > 28) dryingPctPerMin += 0.012;

  const netMoisturePctPerMin = irrigationPctPerMin - dryingPctPerMin;
  let nextMoisture = currentState.substrateMoisture + netMoisturePctPerMin * dtMinutes;

  // Natural field-capacity drainage cutoff if over-saturated (>85%)
  if (nextMoisture > 85.0) {
    nextMoisture -= (nextMoisture - 85.0) * 0.15 * dtMinutes;
  }

  let nextReservoir = currentState.reservoirLevel + pumpDrawdownPctPerMin * dtMinutes;
  nextReservoir = Math.max(0, Math.min(100, nextReservoir));

  // -------------------------------------------------------------
  // 6. LIGHT INTENSITY (lux)
  // -------------------------------------------------------------
  let nextLight = 0;
  if (equipment.growLights) {
    nextLight = 48000;
  } else {
    // Small ambient light leakage during day
    nextLight = outdoorTempC > 0 ? 250 : 0;
  }

  // -------------------------------------------------------------
  // 7. BOUNDS & NUMERICAL STABILITY CLAMPING
  // -------------------------------------------------------------
  nextTempC = Math.max(0, Math.min(60, Math.round(nextTempC * 100) / 100));
  nextHumidityPct = Math.max(5, Math.min(100, Math.round(nextHumidityPct * 100) / 100));
  nextCo2 = Math.max(250, Math.min(2500, Math.round(nextCo2 * 10) / 10));
  nextMoisture = Math.max(5, Math.min(100, Math.round(nextMoisture * 100) / 100));
  nextReservoir = Math.max(0, Math.min(100, Math.round(nextReservoir * 100) / 100));

  const fluxes: PhysicalFluxes = {
    heat: {
      envelopeW: Math.round(envelopeW * 10) / 10,
      solarW: Math.round(solarW * 10) / 10,
      growLightsW: Math.round(growLightsW * 10) / 10,
      heaterW: Math.round(heaterW * 10) / 10,
      acCoolingW: Math.round(acCoolingW * 10) / 10,
      dehumidifierW: Math.round(dehumidifierW * 10) / 10,
      fansW: Math.round(fansW * 10) / 10,
      ventilationW: Math.round(ventilationW * 10) / 10,
      netHeatW: Math.round(netHeatW * 10) / 10,
    },
    moisture: {
      humidifierGPerH: Math.round(humidifierGPerH * 10) / 10,
      dehumidifierGPerH: Math.round(dehumidifierGPerH * 10) / 10,
      acCondensationGPerH: Math.round(acCondensationGPerH * 10) / 10,
      plantTranspirationGPerH: Math.round(plantTranspirationGPerH * 10) / 10,
      substrateEvaporationGPerH: Math.round(substrateEvaporationGPerH * 10) / 10,
      ventilationMoistureGPerH: Math.round(ventilationMoistureGPerH * 10) / 10,
      netMoistureGPerH: Math.round(netMoistureGPerH * 10) / 10,
    },
    co2: {
      photosynthesisPpmPerMin: Math.round(photosynthesisPpmPerMin * 100) / 100,
      respirationPpmPerMin: Math.round(respirationPpmPerMin * 100) / 100,
      ventilationPpmPerMin: Math.round(ventilationPpmPerMin * 100) / 100,
      netCo2PpmPerMin: Math.round(netCo2PpmPerMin * 100) / 100,
    },
    substrate: {
      irrigationPctPerMin: Math.round(irrigationPctPerMin * 100) / 100,
      dryingPctPerMin: Math.round(dryingPctPerMin * 100) / 100,
      netMoisturePctPerMin: Math.round(netMoisturePctPerMin * 100) / 100,
    },
    reservoir: {
      pumpDrawdownPctPerMin: Math.round(pumpDrawdownPctPerMin * 100) / 100,
    },
  };

  const nextState: SensorState = {
    temperature: nextTempC,
    humidity: nextHumidityPct,
    co2: nextCo2,
    substrateMoisture: nextMoisture,
    lightLevel: Math.round(nextLight),
    reservoirLevel: nextReservoir,
    outsideTemperature: outdoorTempC,
    outsideHumidity: outdoorHumidityPct,
  };

  return { nextState, fluxes };
}
