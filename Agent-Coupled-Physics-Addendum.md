# Agent Addendum: Coupled Grow-Room Physics and Equipment Effects

## Mandatory objective

Upgrade the existing Haryana grow-room simulator into a **coupled, dynamic system model**. Indoor temperature, humidity, CO₂, soil/coco moisture, light level, reservoir level, and equipment states must not be independent sliders or unrelated animations. They must evolve from shared environmental inputs, equipment outputs, room properties, and plant/substrate processes.

Read this together with `Agent-Data-Integrity-and-Testing.md`. Inspect the existing implementation and integrate these requirements into it. Do not create a disconnected second simulator or stop at a design proposal.

## Data categories and user controls

- Historical outdoor weather is the external forcing series, fetched from the documented source for the chosen Haryana location and date.
- Indoor temperature, humidity, CO₂, substrate moisture, light level, and reservoir level are model outputs, unless a real physical sensor is connected.
- User controls should adjust **inputs and setpoints**, not directly overwrite derived indoor outputs during coupled simulation.
- Provide an explicit expert/test override for sensor fault injection if useful. Label it clearly as an override, show that it breaks the normal physical model, and let users turn it off.
- Scenario presets are synthetic test conditions, never falsely described as historical weather.
- Document units, model assumptions, tunable coefficients, and limitations. Do not claim laboratory-validated accuracy.

## Required causal relationships

### 1. Indoor air temperature

Calculate temperature each timestep from an energy balance, rather than assigning it directly from a slider.

Include:
- Outdoor-to-room heat transfer through walls/ceiling/floor, using an insulation parameter (effective heat-loss coefficient).
- Thermal mass / room air heat capacity, so temperature changes gradually.
- Grow-light electrical power and the fraction of power converted to heat in the room.
- Other equipment heat gains, including oscillating/inlet/exhaust fans, dehumidifier, and pump where appropriate.
- AC cooling output with capacity, efficiency, and optional thermostat hysteresis.
- Heater output and control.
- Exhaust/inlet air exchange: exchange room air with outdoor air, with flow affected by fan state and filter resistance.
- A modest configurable solar/roof heat-gain term if desired, driven by historical solar radiation where available.
- Optional latent heat coupling from humidification/dehumidification if model complexity supports it.

A simple, documented lumped model is acceptable for an educational simulator. For example:

`room sensible energy change = envelope heat transfer + equipment/light heat + heater heat - AC cooling + ventilation air-exchange heat`

Then convert energy change to temperature change using effective thermal mass. Use consistent SI units internally (seconds, watts, joules, kg/s, J/kg/K) or document a consistent alternative.

Expected causal tests:
- Holding other inputs constant, higher outdoor temperature must increase heat gain and generally increase indoor temperature.
- Turning grow lights on must add heat according to configured power and heat fraction.
- Turning AC on must cool gradually; turning heater on must warm gradually.
- Turning exhaust/inlet on must move indoor temperature toward outdoor temperature, with the direction depending on which is warmer.
- Better insulation must slow temperature drift toward outdoor temperature.
- Heater and AC must not operate together in automatic mode.

### 2. Indoor relative humidity and moisture balance

Model water vapour or humidity ratio internally if possible; derive relative humidity from vapour content and temperature. This avoids treating relative humidity as a free independent variable when temperature changes.

Include:
- Outdoor moisture exchange through ventilation using outdoor humidity data.
- Humidifier moisture addition based on configured output rate.
- Dehumidifier moisture removal based on configured extraction rate.
- Plant transpiration as a documented approximate moisture source, optionally influenced by light, temperature, and a simplified plant activity factor.
- Evaporation from substrate, linked to substrate wetness, temperature, airflow, and light/plant conditions.
- Temperature-dependent conversion between humidity ratio and relative humidity.
- AC condensation/dehumidification as an optional configured effect; do not double-count moisture removal.
- Fans affect mixing and surface evaporation, not magically create or remove water from the room.

Expected causal tests:
- Humidifier increases water vapour; dehumidifier decreases it.
- Ventilation moves indoor moisture toward outdoor moisture conditions.
- At constant water-vapour content, changing air temperature changes calculated relative humidity in the expected psychrometric direction.
- Higher airflow increases substrate evaporation within sensible limits.
- Prevent humidifier and dehumidifier from running together in automatic mode.

### 3. CO₂ balance

Model CO₂ concentration as a mass balance.

Include:
- A configurable outdoor CO₂ baseline, with clear provenance (user/configured assumption unless an actual source is integrated).
- Ventilation exchange controlled by exhaust/inlet airflow and room volume.
- Approximate plant CO₂ uptake during the light period, influenced by light intensity and a simplified activity curve.
- Optional small dark-period respiration term.
- No claim that a carbon filter removes CO₂. A standard carbon/odor filter should not reduce CO₂ in this model.
- Clearly label CO₂ as simulated unless a real CO₂ sensor is connected.

Expected causal tests:
- Exhaust/inlet ventilation moves indoor CO₂ toward the configured outdoor baseline.
- In a lit scenario, plants may consume CO₂ according to the documented simplified model.
- A carbon filter alone must not change CO₂ concentration.
- Low CO₂ can request ventilation according to the specified automation rule; the model should explain that outdoor air may itself be at a lower concentration.

### 4. Soil/coco moisture and irrigation

Model substrate moisture as a water balance rather than a free slider.

Include:
- Substrate/container effective water capacity.
- Initial moisture as a scenario initialization value.
- Pump flow rate and irrigation duration.
- Reservoir drawdown based on pump flow and pump state.
- Drainage above a configurable field-capacity/drainage threshold.
- Evaporation from the substrate based on moisture, temperature, airflow, light, and exposed surface area.
- Optional plant uptake / transpiration linked to light, temperature, and plant size or a simple configurable plant-demand coefficient.
- Upper and lower physically sensible bounds.
- A reservoir-empty interlock that forces the pump off and records an alert.
- A refill action that increases the reservoir level and logs the event.
- Distinguish volumetric water content (%) from a generic relative substrate-moisture percentage. If using a simplified normalized 0–100% scale, explicitly call it “modelled substrate moisture index” instead of implying calibrated VWC.

Expected causal tests:
- Turning on the pump increases substrate water and reduces reservoir level.
- Empty reservoir stops the pump and prevents moisture increase from irrigation.
- Moist substrate dries over time, with drying affected by heat/light/airflow and plant demand.
- With other factors equal, increased evaporation demand must not make the substrate gain moisture.
- Moisture above the stop threshold turns off watering in automatic mode.
- Refill increases reservoir level; no negative reservoir levels or moisture values over the model's maximum.

### 5. Light, day/night, and grow lights

Calculate light level from:
- The simulated day/night schedule and optional outdoor solar input through a configured window/transmission factor.
- Grow-light power, intensity, and dimming setting.
- Device on/off state and configured PPFD/lux approximation if supported.
- Sensor location or room distribution factor, if included.

Do not claim lux and PPFD are interchangeable. If using lux only, display lux and label any PPFD conversion as an approximation. If the room is fully opaque, outdoor daylight should not enter the room unless the model includes a window/skylight.

Expected causal tests:
- Grow lights ON increase simulated light level and contribute heat.
- Grow lights OFF remove their contribution.
- Day/night changes follow the configured clock and schedule.
- Changing light schedule affects plant uptake/transpiration if those relationships are included.
- Light sensor readings are labelled simulated unless connected to real hardware.

### 6. Exhaust, inlet fan, oscillating fans, and carbon filter

Equipment states must have physical consequences.

**Exhaust fan**
- Establish airflow in m³/s or CFM from a configured fan curve or simple nominal-flow setting.
- Exchange room air with outside air; use it to affect heat, moisture, and CO₂ balances.
- Account for filter pressure loss / resistance by reducing effective airflow when the carbon filter is installed/enabled.
- Do not treat exhaust as a magical direct temperature control: its effect depends on outdoor conditions and room state.
- Log fan starts/stops, airflow estimates, and the rule responsible.

**Inlet fan**
- Supplies replacement outdoor air and contributes to total ventilation.
- Avoid double-counting air exchange if exhaust and inlet are both on. Define a consistent airflow/mass-balance approach, such as effective balanced ventilation with a documented coefficient or a simplified pressure-neutral model.
- If only one fan runs, account for passive make-up air/leakage.

**Oscillating fans**
- Primarily increase air mixing and local airflow.
- Affect evaporation and heat/moisture uniformity; do not automatically change the room's total CO₂ mass or add/remove water vapour except via explicitly modelled secondary effects.
- A single-zone model may represent mixing as a reduction in spatial-gradient assumptions; document that it cannot model true local microclimates.

**Carbon filter**
- Primarily an odor/VOC treatment accessory, not a CO₂ scrubber.
- When attached to exhaust, add pressure resistance and reduce effective exhaust flow unless the fan is sized to overcome it.
- Do not claim actual odor-removal efficiency unless explicitly configured as a simplified assumption.

### 7. Heater, AC, humidifier, dehumidifier, pump, and other equipment

For every device define:
- Rated/nominal capacity or flow rate.
- Power draw if energy accounting is displayed.
- Heat and moisture effects on the environment.
- Start/stop behavior and optional realistic delay/ramp.
- Valid operating limits.
- Whether its effects are directly simulated or simplified.
- The automation rule, manual command, or interlock that set its final state.

Use configurable equipment parameters, not magic constants scattered through components. Device changes should affect the next simulation steps through the environment model, not directly set the final sensor value.

Do not claim exact power consumption or HVAC performance unless using actual device specifications and clearly stated assumptions.

## Simulation architecture

Keep the environmental model, controller, and UI separate. Use a single authoritative simulation state.

Suggested types:

```ts
type OutdoorWeatherSample = {
  timestamp: string;
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  solarRadiationWm2?: number | null;
  source: string;
};

type RoomParameters = {
  floorAreaM2: number;
  heightM: number;
  effectiveThermalMassJPerK: number;
  envelopeHeatLossWPerK: number;
  airExchangeLeakagePerHour: number;
};

type EquipmentParameters = {
  growLightPowerW: number;
  growLightHeatFraction: number;
  heaterCapacityW: number;
  acCoolingCapacityW: number;
  humidifierGPerHour: number;
  dehumidifierGPerHour: number;
  exhaustNominalM3PerHour: number;
  inletNominalM3PerHour: number;
  carbonFilterFlowMultiplier: number;
  pumpLitresPerMinute: number;
};

type EnvironmentState = {
  timestamp: string;
  indoorTemperatureC: number;
  indoorHumidityPct: number;
  indoorCo2Ppm: number;
  substrateMoistureIndexPct: number;
  lightLevelLux: number;
  reservoirLitres: number;
};
```

Types are illustrative; adapt to the existing codebase.

Use a deterministic timestep function, for example:

```ts
stepEnvironment({
  previousState,
  outdoorWeather,
  roomParameters,
  equipmentParameters,
  finalEquipmentOutputs,
  plantParameters,
  dtSeconds
}) => {
  nextState,
  fluxes,
  diagnostics
}
```

`fluxes` and `diagnostics` should expose the main heat, moisture, CO₂, and water-balance terms for educational explanations and tests.

Each tick:
1. Read the current outdoor weather sample or clearly labelled scenario input.
2. Evaluate the automation controller from current sensor/model state.
3. Resolve priority and device interlocks.
4. Apply equipment outputs to the environment model.
5. Advance temperature, water vapour, CO₂, substrate moisture, reservoir, and light consistently.
6. Validate bounds and numerical stability.
7. Store a history sample and decision log with data provenance.
8. Update the UI from the resulting state.

Avoid React render loops, random sensor jumps, and multiple independent timers. Simulation must be reproducible for the same initial state, weather input, configuration, and commands.

## Dashboard requirements for coupled physics

- Add an **“Why did this value change?”** section to each sensor detail dialog.
- Show the main contributors over the selected time step, such as:
  - temperature: outdoor heat transfer +12 W, lights +180 W, AC -500 W, ventilation -40 W (illustrative units/values must come from the actual model calculation, not hard-coded display strings);
  - moisture: irrigation +X ml, evaporation -Y ml, plant uptake -Z ml, drainage -A ml;
  - CO₂: ventilation exchange, plant uptake, respiration;
  - light: grow-light contribution and daylight contribution;
  - reservoir: pump consumption and refill.
- Display real calculated fluxes from the model; do not populate this explanation with invented example numbers.
- Show equipment state and its actual model effect. If a device is ON but its effect is not modelled, say so.
- Add a causal/equipment timeline aligned with temperature, humidity, CO₂, and substrate graphs.
- Provide a “Model assumptions” page with formulas, parameter values, source links, and limitations.
- Show unit consistency and warn if the selected timestep is too large for numerical stability.

## Testing the coupled model

Add deterministic tests that verify causal relationships, not just that values render.

1. **Thermal:** same initial conditions; warmer outdoor air increases net heat gain and eventually indoor temperature.
2. **Thermal insulation:** lower envelope heat-loss coefficient slows room response to outdoor temperature.
3. **Grow lights:** turning lights on increases light level and adds the configured heat load.
4. **AC:** with outdoor conditions and all other inputs fixed, AC cooling lowers the temperature trajectory relative to the AC-off run.
5. **Heater:** heater-on trajectory warms relative to heater-off run.
6. **Ventilation temperature:** exhaust/inlet drives indoor temperature toward outdoor temperature; it may warm or cool depending on the sign of the temperature difference.
7. **Humidity:** humidifier increases water-vapour mass; dehumidifier decreases it.
8. **Temperature/RH coupling:** at constant vapour content, warming air lowers relative humidity and cooling air raises it (within the model's valid range).
9. **Ventilation humidity:** indoor humidity trends toward outdoor moisture conditions.
10. **CO₂ ventilation:** ventilation moves CO₂ toward outdoor baseline.
11. **Carbon filter:** filter has no direct CO₂-removal effect; it may reduce airflow through the configured pressure-loss multiplier.
12. **Substrate drying:** substrate moisture declines with drying processes when irrigation is off.
13. **Watering:** pump-on increases substrate water and reduces reservoir water; empty reservoir prevents irrigation.
14. **Airflow and evaporation:** increased airflow increases or preserves higher evaporation demand under otherwise identical valid conditions.
15. **Plant demand:** enabling the plant-uptake model changes CO₂/moisture according to the documented light-dependent coefficients.
16. **Light schedule:** day/night and timer states change the correct light contribution and plant response.
17. **Conservation/bounds:** no negative reservoir, no negative water-vapour mass, no invalid CO₂ or moisture bounds, and sensible temperature limits.
18. **Determinism:** same inputs and initial state produce identical output history.
19. **Automation:** every original priority, emergency, interlock, hysteresis, forced-exhaust, and manual/automatic test remains passing.
20. **Data outage:** missing outdoor data must trigger an explicit paused/hold/clearly labelled fallback policy; do not invent a historical value. A user-selected synthetic scenario may continue only when labelled as such.

Use relative comparisons and tolerances for physical-model tests instead of requiring an arbitrary exact room temperature. Verify timestep convergence for representative scenarios if feasible.

## Acceptance criteria

- Changing the selected historical weather series changes the indoor trajectory through the physical model.
- Grow lights, AC, heater, exhaust, inlet, oscillating fans, humidifier, dehumidifier, pump, and filter each have documented and tested consequences.
- Indoor metrics are model outputs, not independent manually adjustable readings during normal simulation.
- The UI can explain the physical factors behind each sensor change using actual model fluxes.
- Historical values, derived values, scenario inputs, and simulated outputs are visibly separated.
- All causal tests, automation tests, type-check, lint, and production build results are reported honestly.
- If a physical relationship is intentionally omitted, the UI and documentation say so explicitly; no false claim that the factor is simulated.

**Implement this as a refinement of the current project. Start by examining the existing code, then wire each equipment output into the shared model and add causal tests.**
