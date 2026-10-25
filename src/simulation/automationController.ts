import {
  Alert,
  AutomationDecision,
  EquipmentState,
  RuleEvaluation,
  SensorState,
  SimulationClock,
  SimulationMode,
  SimulationSettings,
} from './types';

// Hysteresis bands for recovery
const RECOVERY_TEMP_MIN = 16.5; // enter < 15, clear > 16.5
const RECOVERY_TEMP_MAX = 30.5; // enter > 32, clear < 30.5
const RECOVERY_HUM_MIN = 34.0;  // enter < 30, clear > 34.0
const RECOVERY_HUM_MAX = 71.0;  // enter > 75, clear < 71.0

export interface ControllerContext {
  previousAlerts: Alert[];
  previousState: EquipmentState;
  forcedVentActive: boolean;
  forcedVentCountdownMinutes: number;
  lastForcedVentMinute: number;
}

/**
 * Deterministic automation controller with strict priority hierarchy:
 * 1. Emergency
 * 2. Temperature
 * 3. Humidity
 * 4. CO₂ / Fresh Air
 * 5. Watering
 * 6. Normal Timers
 */
export function evaluateAutomation(
  sensors: SensorState,
  settings: SimulationSettings,
  clock: SimulationClock,
  mode: SimulationMode,
  manualEquipment: EquipmentState,
  existingAlerts: Alert[]
): {
  decision: AutomationDecision;
  alerts: Alert[];
} {
  const rules: RuleEvaluation[] = [];
  const interlocksTriggered: string[] = [];

  // Working outputs starting from a base state
  const requests: EquipmentState = {
    heater: false,
    ac: false,
    exhaustFan: false,
    inletFan: false,
    oscillatingFans: settings.oscillatingFansContinuous,
    humidifier: false,
    dehumidifier: false,
    waterPump: false,
    growLights: clock.isDaytime,
    carbonFilter: settings.carbonFilterEquipped,
  };

  const finalOutputs: EquipmentState = { ...requests };
  const alerts: Alert[] = existingAlerts.map((a) => ({ ...a }));

  // Helper to maintain alerts idempotently
  const syncAlert = (
    id: string,
    category: Alert['category'],
    severity: Alert['severity'],
    title: string,
    cause: string,
    suggestedResponse: string,
    shouldBeActive: boolean
  ) => {
    const existingIndex = alerts.findIndex((a) => a.id === id);
    const timeFormatted = `Day ${clock.day} ${String(clock.hour).padStart(2, '0')}:${String(
      clock.minute
    ).padStart(2, '0')}`;

    if (shouldBeActive) {
      if (existingIndex >= 0) {
        alerts[existingIndex].active = true;
        alerts[existingIndex].cause = cause;
      } else {
        alerts.unshift({
          id,
          category,
          severity,
          title,
          cause,
          suggestedResponse,
          timestamp: timeFormatted,
          simulatedMinute: clock.totalElapsedMinutes,
          active: true,
          acknowledged: false,
        });
      }
    } else {
      if (existingIndex >= 0) {
        alerts[existingIndex].active = false;
      }
    }
  };

  // -------------------------------------------------------------
  // 1. EMERGENCY RULES (Priority 1)
  // Thresholds: Temp < 15°C or > 32°C; RH < 30% or > 75%
  // With recovery hysteresis
  // -------------------------------------------------------------
  const tempLowEmergency =
    sensors.temperature < 15.0 ||
    (alerts.some((a) => a.id === 'emergency_temp_low' && a.active) &&
      sensors.temperature < RECOVERY_TEMP_MIN);

  const tempHighEmergency =
    sensors.temperature > 32.0 ||
    (alerts.some((a) => a.id === 'emergency_temp_high' && a.active) &&
      sensors.temperature > RECOVERY_TEMP_MAX);

  const humLowEmergency =
    sensors.humidity < 30.0 ||
    (alerts.some((a) => a.id === 'emergency_hum_low' && a.active) &&
      sensors.humidity < RECOVERY_HUM_MIN);

  const humHighEmergency =
    sensors.humidity > 75.0 ||
    (alerts.some((a) => a.id === 'emergency_hum_high' && a.active) &&
      sensors.humidity > RECOVERY_HUM_MAX);

  const isEmergency =
    tempLowEmergency || tempHighEmergency || humLowEmergency || humHighEmergency;

  syncAlert(
    'emergency_temp_low',
    'temperature',
    'emergency',
    'CRITICAL: Severe Cold Emergency',
    `Room temperature has dropped to ${sensors.temperature.toFixed(1)}°C (Safe limit >= 15.0°C). Risk of severe plant chilling/stunting.`,
    'Maximum heating commanded. Ventilation restricted to prevent heat loss.',
    tempLowEmergency
  );

  syncAlert(
    'emergency_temp_high',
    'temperature',
    'emergency',
    'CRITICAL: Extreme Heat Emergency',
    `Room temperature has soared to ${sensors.temperature.toFixed(1)}°C (Safe limit <= 32.0°C). Risk of leaf scorch, stomata closure, and thermal shock.`,
    'Maximum AC cooling commanded. Grow lights extinguished to reduce thermal load.',
    tempHighEmergency
  );

  syncAlert(
    'emergency_hum_low',
    'humidity',
    'emergency',
    'CRITICAL: Severe Dryness Emergency',
    `Relative humidity is dangerously low at ${sensors.humidity.toFixed(1)}% RH (Safe limit >= 30.0%). Plants entering extreme transpiration distress.`,
    'Emergency humidification engaged. Air circulation regulated.',
    humLowEmergency
  );

  syncAlert(
    'emergency_hum_high',
    'humidity',
    'emergency',
    'CRITICAL: Excessive Humidity Emergency',
    `Relative humidity is dangerously high at ${sensors.humidity.toFixed(1)}% RH (Safe limit <= 75.0%). Immediate risk of botrytis, mildew, and fungal propagation.`,
    'Forced dehumidification and maximum exhaust ventilation commanded.',
    humHighEmergency
  );

  // Reservoir Empty Alert (Applies in both Auto and Manual modes)
  const isReservoirEmpty = sensors.reservoirLevel <= 0.05;
  syncAlert(
    'alert_reservoir_empty',
    'watering',
    'warning',
    'Water Reservoir Depleted',
    `Water reservoir level is ${sensors.reservoirLevel.toFixed(1)}%. Irrigation pump cannot safely run dry.`,
    'Refill the reservoir tank immediately. Pump interlock engaged.',
    isReservoirEmpty
  );

  rules.push({
    priority: 1,
    name: 'Emergency Safety Supervisor',
    category: 'Emergency',
    active: isEmergency,
    reason: isEmergency
      ? `Emergency supervisory state active: ${[
          tempLowEmergency ? 'Low Temp' : null,
          tempHighEmergency ? 'High Temp' : null,
          humLowEmergency ? 'Low Humidity' : null,
          humHighEmergency ? 'High Humidity' : null,
        ]
          .filter(Boolean)
          .join(', ')}.`
      : 'All safety parameters within nominal boundaries.',
    requestedOutputs: {
      ...(tempLowEmergency ? { heater: true, ac: false } : {}),
      ...(tempHighEmergency ? { ac: true, heater: false, growLights: false } : {}),
      ...(humLowEmergency ? { humidifier: true, dehumidifier: false } : {}),
      ...(humHighEmergency ? { dehumidifier: true, humidifier: false, exhaustFan: true } : {}),
    },
    overridden: false,
  });

  // -------------------------------------------------------------
  // 2. TEMPERATURE CONTROL (Priority 2)
  // Target: heating below 18°C, cooling above 27°C
  // -------------------------------------------------------------
  const heatingNeeded = sensors.temperature < settings.tempHeatingThreshold;
  const coolingNeeded = sensors.temperature > settings.tempCoolingThreshold;

  let tempReason = 'Temperature is in comfortable target band.';
  const tempRequests: Partial<EquipmentState> = {};

  if (tempHighEmergency || tempLowEmergency) {
    tempReason = 'Preempted by Priority 1 Emergency state.';
  } else if (coolingNeeded) {
    tempRequests.ac = true;
    tempRequests.heater = false;
    tempReason = `Temperature (${sensors.temperature.toFixed(1)}°C) exceeds cooling threshold (${settings.tempCoolingThreshold}°C). Requesting AC ON, limit exhaust.`;
  } else if (heatingNeeded) {
    tempRequests.heater = true;
    tempRequests.ac = false;
    tempReason = `Temperature (${sensors.temperature.toFixed(1)}°C) is below heating threshold (${settings.tempHeatingThreshold}°C). Requesting Heater ON, limit exhaust.`;
  }

  rules.push({
    priority: 2,
    name: 'Climate Temperature Control',
    category: 'Temperature',
    active: heatingNeeded || coolingNeeded,
    reason: tempReason,
    requestedOutputs: tempRequests,
    overridden: tempHighEmergency || tempLowEmergency,
    overriddenReason:
      tempHighEmergency || tempLowEmergency
        ? 'Overridden by Priority 1 Emergency rule'
        : undefined,
  });

  // -------------------------------------------------------------
  // 3. HUMIDITY CONTROL (Priority 3)
  // Target: Humidifier ON < 40%, Dehumidifier ON > 60%
  // -------------------------------------------------------------
  const humidifyNeeded = sensors.humidity < settings.humidityLowThreshold;
  const dehumidifyNeeded = sensors.humidity > settings.humidityHighThreshold;

  let humReason = 'Relative humidity is within target range.';
  const humRequests: Partial<EquipmentState> = {};

  if (humLowEmergency || humHighEmergency) {
    humReason = 'Preempted by Priority 1 Emergency state.';
  } else if (dehumidifyNeeded) {
    humRequests.dehumidifier = true;
    humRequests.humidifier = false;
    humRequests.exhaustFan = true; // Allow exhaust for high RH
    humReason = `Humidity (${sensors.humidity.toFixed(1)}%) exceeds upper threshold (${settings.humidityHighThreshold}%). Requesting Dehumidifier ON and exhaust assist.`;
  } else if (humidifyNeeded) {
    humRequests.humidifier = true;
    humRequests.dehumidifier = false;
    humReason = `Humidity (${sensors.humidity.toFixed(1)}%) is below lower threshold (${settings.humidityLowThreshold}%). Requesting Humidifier ON.`;
  }

  rules.push({
    priority: 3,
    name: 'Relative Humidity Control',
    category: 'Humidity',
    active: humidifyNeeded || dehumidifyNeeded,
    reason: humReason,
    requestedOutputs: humRequests,
    overridden: humLowEmergency || humHighEmergency,
    overriddenReason:
      humLowEmergency || humHighEmergency
        ? 'Overridden by Priority 1 Emergency rule'
        : undefined,
  });

  // -------------------------------------------------------------
  // 4. CO₂ & FRESH AIR EXCHANGE (Priority 4)
  // Below 450 ppm: exhaust + inlet fan ON.
  // Forced cycle: every 2 hours (120 mins) for 10 mins.
  // -------------------------------------------------------------
  const co2LowNeeded = sensors.co2 < settings.co2LowThreshold;
  const elapsedMinutesInCycle = clock.totalElapsedMinutes % settings.forcedVentIntervalMinutes;
  const forcedVentActive = elapsedMinutesInCycle < settings.forcedVentDurationMinutes;
  const forcedVentCountdown = settings.forcedVentIntervalMinutes - elapsedMinutesInCycle;

  let co2Reason = 'CO₂ is adequate; scheduled ventilation standby.';
  const co2Requests: Partial<EquipmentState> = {};

  if (co2LowNeeded) {
    co2Requests.exhaustFan = true;
    co2Requests.inletFan = true;
    co2Reason = `CO₂ concentration (${Math.round(sensors.co2)} ppm) below fresh air threshold (${settings.co2LowThreshold} ppm). Requesting Exhaust and Inlet ON.`;
  } else if (forcedVentActive) {
    co2Requests.exhaustFan = true;
    co2Requests.inletFan = true;
    co2Reason = `Bi-hourly forced air exchange cycle active (${settings.forcedVentDurationMinutes - elapsedMinutesInCycle}m remaining).`;
  }

  rules.push({
    priority: 4,
    name: 'CO₂ & Fresh Air Cycle',
    category: 'CO2',
    active: co2LowNeeded || forcedVentActive,
    reason: co2Reason,
    requestedOutputs: co2Requests,
    overridden: false,
  });

  // -------------------------------------------------------------
  // 5. WATERING RULES (Priority 5)
  // Soil moisture < 43%: Pump ON; Soil > 70%: Pump OFF
  // Empty reservoir: Force Pump OFF!
  // -------------------------------------------------------------
  const wateringNeeded = sensors.substrateMoisture < settings.substrateDryThreshold;
  const wateringSaturated = sensors.substrateMoisture >= settings.substrateWetThreshold;

  let wateringReason = 'Substrate moisture is in optimal vegetative range.';
  const wateringRequests: Partial<EquipmentState> = {};

  if (isReservoirEmpty) {
    wateringRequests.waterPump = false;
    wateringReason = 'Water pump interlocked OFF: Reservoir empty.';
  } else if (wateringNeeded) {
    wateringRequests.waterPump = true;
    wateringReason = `Substrate moisture (${sensors.substrateMoisture.toFixed(1)}%) below irrigation trigger (${settings.substrateDryThreshold}%). Requesting Water Pump ON.`;
  } else if (wateringSaturated) {
    wateringRequests.waterPump = false;
    wateringReason = `Substrate moisture (${sensors.substrateMoisture.toFixed(1)}%) reached saturation threshold (${settings.substrateWetThreshold}%). Pump OFF.`;
  }

  rules.push({
    priority: 5,
    name: 'Automated Substrate Irrigation',
    category: 'Watering',
    active: wateringNeeded && !isReservoirEmpty,
    reason: wateringReason,
    requestedOutputs: wateringRequests,
    overridden: isReservoirEmpty && wateringNeeded,
    overriddenReason: isReservoirEmpty
      ? 'Pump request blocked by empty reservoir safety interlock'
      : undefined,
  });

  // -------------------------------------------------------------
  // 6. NORMAL TIMERS (Priority 6)
  // Day/Night Grow Lights and Air Circulation Fans
  // -------------------------------------------------------------
  const timerLights = clock.isDaytime;
  const timerFans = settings.oscillatingFansContinuous;

  const timerRequests: Partial<EquipmentState> = {
    growLights: timerLights,
    oscillatingFans: timerFans,
  };

  let timerReason = `Photoperiod schedule: ${clock.isDaytime ? 'Day cycle active (Lights ON)' : 'Night cycle active (Lights OFF)'}.`;
  let lightsOverridden = false;
  if (tempHighEmergency) {
    lightsOverridden = true;
    timerReason += ' Note: Grow lights overridden OFF by Priority 1 Extreme Heat Emergency!';
  }

  rules.push({
    priority: 6,
    name: 'Photoperiod & Circulation Timers',
    category: 'Timers',
    active: true,
    reason: timerReason,
    requestedOutputs: timerRequests,
    overridden: lightsOverridden,
    overriddenReason: lightsOverridden ? 'Grow lights forced OFF by thermal emergency' : undefined,
  });

  // -------------------------------------------------------------
  // MERGE REQUESTS WITH PRIORITY & CONFLICT RESOLUTION
  // -------------------------------------------------------------
  // Evaluation in order: 6 (Timers) -> 5 (Watering) -> 4 (CO2) -> 3 (Humidity) -> 2 (Temp) -> 1 (Emergency)

  // Start with timer requests
  Object.assign(requests, timerRequests);

  // Apply watering requests
  if (wateringRequests.waterPump !== undefined) {
    requests.waterPump = wateringRequests.waterPump;
  }

  // Apply CO2 & Fresh air requests
  if (co2Requests.exhaustFan !== undefined) requests.exhaustFan = co2Requests.exhaustFan;
  if (co2Requests.inletFan !== undefined) requests.inletFan = co2Requests.inletFan;

  // Apply Humidity requests
  if (humRequests.humidifier !== undefined) requests.humidifier = humRequests.humidifier;
  if (humRequests.dehumidifier !== undefined) requests.dehumidifier = humRequests.dehumidifier;
  if (humRequests.exhaustFan !== undefined) requests.exhaustFan = humRequests.exhaustFan;

  // Apply Temperature requests
  if (tempRequests.heater !== undefined) requests.heater = tempRequests.heater;
  if (tempRequests.ac !== undefined) requests.ac = tempRequests.ac;

  // Conditional exhaust limiting when heating or cooling:
  // "When heater or AC is ON, limit exhaust unless humidity is very high or CO₂ is very low."
  const isHeatingOrCooling = requests.heater || requests.ac;
  const exhaustExemption =
    sensors.humidity > settings.humidityHighThreshold ||
    sensors.co2 < settings.co2LowThreshold ||
    forcedVentActive;

  if (isHeatingOrCooling && !exhaustExemption) {
    requests.exhaustFan = false;
    requests.inletFan = false;
  }

  // Apply Emergency overrides (Priority 1 supreme authority)
  if (tempLowEmergency) {
    requests.heater = true;
    requests.ac = false;
    requests.exhaustFan = false;
    requests.inletFan = false;
  }
  if (tempHighEmergency) {
    requests.ac = true;
    requests.heater = false;
    requests.growLights = false; // Reduce internal heat gain
    // If outside is hotter than inside, do not run exhaust fan
    if (sensors.outsideTemperature > sensors.temperature) {
      requests.exhaustFan = false;
      requests.inletFan = false;
    }
  }
  if (humLowEmergency) {
    requests.humidifier = true;
    requests.dehumidifier = false;
  }
  if (humHighEmergency) {
    requests.dehumidifier = true;
    requests.humidifier = false;
    requests.exhaustFan = true;
  }

  // Mandatory Safety Interlocks:
  // 1. Heater and AC must NEVER run simultaneously
  if (requests.heater && requests.ac) {
    interlocksTriggered.push('Heater and AC interlock triggered: AC prioritized.');
    requests.heater = false;
  }

  // 2. Humidifier and Dehumidifier must NEVER run simultaneously
  if (requests.humidifier && requests.dehumidifier) {
    interlocksTriggered.push('Humidifier and Dehumidifier interlock triggered: Dehumidifier prioritized.');
    requests.humidifier = false;
  }

  // 3. Reservoir empty prevents water pump from running
  if (isReservoirEmpty) {
    requests.waterPump = false;
  }

  // Accessories: Carbon filter is mounted to exhaust fan
  requests.carbonFilter = settings.carbonFilterEquipped;

  // If in Automatic mode, finalOutputs = requests.
  // If in Manual mode, finalOutputs = user manual toggles, EXCEPT hard safety pump interlock when reservoir is empty.
  if (mode === 'automatic') {
    Object.assign(finalOutputs, requests);
  } else {
    Object.assign(finalOutputs, manualEquipment);
    // In manual mode, reservoir empty prevents pump damage
    if (isReservoirEmpty && finalOutputs.waterPump) {
      finalOutputs.waterPump = false;
      interlocksTriggered.push('Manual mode interlock: Water pump forced OFF due to empty reservoir.');
    }
  }

  // Active Rule Summary
  let activeRuleSummary = 'All environmental parameters nominal.';
  if (isEmergency) {
    activeRuleSummary = 'CRITICAL EMERGENCY: Supervisory safety overrides active.';
  } else if (coolingNeeded || heatingNeeded) {
    activeRuleSummary = coolingNeeded ? 'Climate Control: Cooling active.' : 'Climate Control: Heating active.';
  } else if (humidifyNeeded || dehumidifyNeeded) {
    activeRuleSummary = dehumidifyNeeded ? 'Humidity Control: Dehumidification active.' : 'Humidity Control: Humidification active.';
  } else if (co2LowNeeded || forcedVentActive) {
    activeRuleSummary = forcedVentActive ? 'Ventilation: Scheduled air exchange cycle active.' : 'Ventilation: Low CO₂ fresh air exchange active.';
  } else if (wateringNeeded && !isReservoirEmpty) {
    activeRuleSummary = 'Substrate Irrigation: Watering cycle in progress.';
  }

  return {
    decision: {
      rules,
      requestedOutputs: requests,
      finalOutputs,
      activeRuleSummary,
      interlocksTriggered,
      forcedVentActive,
      forcedVentCountdownMinutes: forcedVentCountdown,
      emergencyActive: isEmergency,
    },
    alerts,
  };
}
