# Agent.md — Haryana Indoor Plant Grow Room Simulator

## Project goal

Build a fully interactive educational web simulator for a **10 ft × 10 ft indoor plant grow room**, modeling seasonal conditions in Haryana, India. It is a simulation for learning and scenario testing, not a replacement for real horticultural controls or safety equipment.

## Recommended stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS or plain CSS modules; responsive, accessible dashboard
- **Charts:** Recharts
- **Icons:** Lucide
- **Backend:** Not required for the first version. Keep simulation logic in pure TypeScript modules so it can later be moved to a server.
- **Testing:** Vitest for simulation and automation rules; Playwright for key user flows.

If implementing a single-file prototype instead, use semantic HTML, CSS, and modern JavaScript while keeping the simulation engine separate from UI rendering.

## Core requirements

### Room and environment

- Model a 10 × 10 ft room (100 sq ft); display the room dimensions.
- Simulate temperature, relative humidity, CO₂ (ppm), substrate moisture (%), light level/status, and reservoir level.
- Include a day/night cycle and a simulated clock that advances with simulation time.
- Provide seasons: Summer, Monsoon (optional but useful for Haryana), Autumn, Winter, and Spring. At minimum, support Summer, Winter, Spring, and Autumn.
- Haryana-inspired outside temperature profiles should include summer daytime peaks around 40–45°C and winter nighttime lows around 5–6°C. These are representative scenario values, not live weather observations.
- Include configurable target temperature and humidity, CO₂ level, substrate moisture, and outside temperature.
- Make changes smooth and explainable: temperature and humidity should respond gradually rather than jumping instantly when equipment toggles.
- Provide pause/resume, simulation speed, and reset controls.

### Equipment

Every device needs a visible ON/OFF state and a manual toggle:

1. Heater
2. Air conditioner (AC)
3. Exhaust fan
4. Inlet fan
5. Oscillating fans
6. Humidifier
7. Dehumidifier
8. Water pump
9. Grow lights
10. Carbon filter (exhaust accessory)

The carbon filter should be shown as an exhaust accessory. It should not independently change room temperature or CO₂; it can affect a configurable exhaust efficiency / resistance parameter if implemented.

### Sensors

Show live values and sensible status ranges for:

- Temperature sensor
- Humidity sensor
- CO₂ sensor
- Soil/coco moisture sensor
- Light sensor
- Water reservoir level sensor

Mark sensor values as simulated. The light sensor should reflect grow-light state and day/night behavior.

## Automation priorities

Implement one deterministic controller that evaluates rules in this order. Safety/emergency handling must not be overridden by lower-priority rules.

1. Emergency
2. Temperature
3. Humidity
4. CO₂ / fresh air
5. Watering
6. Normal timers

### Emergency rules

- Emergency when temperature is below 15°C or above 32°C.
- Emergency when relative humidity is below 30% or above 75%.
- Show a prominent alert, the cause, timestamp, and suggested response.
- Keep the controller safe and avoid contradictory device commands.
- Emergency mode is a simulated supervisory state, not a claim that real hardware is safe. Document which outputs it changes.
- Add hysteresis / recovery thresholds so an alert does not chatter around a boundary. Example: enter emergency at the specified limits and clear only after values recover inside a safer band for a configurable duration.
- Acknowledge/dismiss should not silently clear an active condition.

### Temperature rules

- Below 18°C: request heater ON and reduce/limit exhaust.
- Above 27°C: request AC ON and reduce/limit exhaust.
- Heater and AC must never run simultaneously in automatic mode.
- Temperature emergency thresholds take precedence over ordinary temperature rules.
- When heater or AC is ON, limit exhaust unless humidity is very high or CO₂ is very low.

### Humidity rules

- Below 40% RH: request humidifier ON.
- Above 60% RH: request dehumidifier ON and allow exhaust.
- Below 30% or above 75% RH: emergency rule takes precedence.
- Prevent humidifier and dehumidifier from running simultaneously in automatic mode.

### CO₂ / fresh-air rules

- Below 450 ppm: request exhaust and inlet fan ON.
- Force a short exhaust cycle every two simulated hours for air exchange, even if the CO₂ threshold is not crossed.
- Make the forced-cycle duration configurable and show its countdown/status.
- Exhaust override exceptions: allow ventilation when humidity is very high or CO₂ is very low, even when heating/cooling is active.
- Do not imply that a carbon filter removes CO₂.

### Watering rules

- Below 43% substrate moisture: request water pump ON.
- Above 70% substrate moisture: request water pump OFF.
- If the reservoir is empty, force pump OFF and raise an alert.
- Simulate gradual moisture increase while watering and gradual drying over time.
- Include a refill control for the reservoir.

### Normal timers

- Grow lights follow configurable day/night schedule by default.
- Oscillating fans may follow a configurable schedule.
- Timer rules run only after higher-priority safety and environmental rules.
- Clearly distinguish timer requests from the final device state when a higher-priority rule overrides them.

## Automatic and manual modes

- **Automatic:** controller determines final equipment states from sensor readings, rules, and timers.
- **Manual:** user toggles each device directly. Sensor/environment simulation continues, but automation must not silently change manual device states.
- Show the active mode prominently.
- In manual mode, retain hard safety alerts and reservoir-empty warnings; make it clear whether alerts are informational or actively interlocking a simulated device.
- On switching back to automatic, immediately recompute device states from current values.

## Environment model

Use a fixed simulation timestep (e.g. 1 simulated minute per tick) and elapsed-time-based calculations rather than changing values randomly every render.

Suggested model features:
- Outside temperature follows a daily sinusoidal curve adjusted by season, with summer highs up to 40–45°C and winter lows around 5–6°C.
- Room temperature drifts toward outside temperature based on insulation, with additional heat from lights and equipment. AC and heater add gradual cooling/heating.
- Humidity drifts toward an outside/season baseline, with gradual humidifier/dehumidifier effects, ventilation exchange, and temperature coupling kept simple and documented.
- CO₂ drifts toward a baseline and changes slowly; ventilation moves it toward an outside-air value. Plants may consume a small amount during light periods and release a smaller amount in dark periods, if this behavior is clearly labeled as an educational approximation.
- Substrate moisture dries gradually; watering raises it based on pump flow and substrate size.
- Reservoir level decreases while the pump runs.
- Sensor values include small optional noise, but avoid distracting jitter. Provide a toggle to disable noise for repeatable experiments.
- Clamp values to physically sensible simulation bounds.
- Document all approximations and tunable constants in one place.

These values are a simplified educational model, not a validated physical prediction. Avoid claiming exact HVAC sizing, energy consumption, or crop-specific optimality.

## Dashboard UX

Create a clean, modern, responsive dashboard with:
- Header showing simulator name, mode, simulation clock, season, day/night, and pause state.
- KPI cards for temperature, humidity, CO₂, substrate moisture, light, and reservoir.
- Room overview / schematic with the equipment and current statuses.
- Equipment panel with ON/OFF indicators and manual controls.
- Automatic rules panel showing the active rule, priority, reason, and overridden requests.
- Alerts and emergency history.
- Temperature and humidity history charts with clear axes, units, and a rolling time window.
- Season selector and scenario presets: Haryana summer heatwave, winter cold night, low CO₂, high humidity, dry substrate, empty reservoir.
- Settings for targets, day/night schedule, forced ventilation interval/duration, and simulation speed.
- Reset scenario and refill reservoir actions.

Accessibility:
- Never rely on color alone for status; include text and icons.
- Use keyboard-operable controls, visible focus, semantic labels, and readable contrast.
- Add units to every sensor reading and chart axis.
- Respect reduced-motion preferences.

## Suggested architecture

```text
src/
  app/
    App.tsx
  components/
    DashboardHeader.tsx
    SensorCard.tsx
    EquipmentPanel.tsx
    RoomSchematic.tsx
    AlertsPanel.tsx
    EnvironmentCharts.tsx
    AutomationPanel.tsx
    ScenarioControls.tsx
  simulation/
    types.ts
    defaults.ts
    climateProfiles.ts
    environmentModel.ts
    automationController.ts
    scenarios.ts
  hooks/
    useSimulation.ts
  tests/
    automationController.test.ts
    environmentModel.test.ts
```

Keep the environment model pure where practical:
- `stepEnvironment(state, inputs, dtMinutes) -> nextState`
- `evaluateAutomation(state, settings, timers) -> requestedOutputs + reasons`
- `resolveOutputConflicts(requests, mode, safetyState) -> finalOutputs`
- `getOutsideTemperature(season, timeOfDay, profile) -> temperature`

Use explicit types for sensor state, device state, settings, alerts, automation decisions, and history samples.

## Conflict resolution and implementation details

- Separate **rule requests** from **final device outputs** so the UI can explain why a device is on/off.
- Apply priority resolution centrally; do not scatter rule logic across components.
- Add interlocks for mutually exclusive devices (heater vs AC, humidifier vs dehumidifier).
- In automatic mode, empty reservoir always prevents pump operation.
- Exhaust limiting is conditional: it must yield to high humidity, very low CO₂, and the scheduled forced-air exchange where appropriate.
- The two-hour forced exhaust cycle should be based on simulated elapsed time and should not reset unexpectedly on React re-renders.
- Use hysteresis around ordinary thresholds (e.g. heater turns on below 18°C and turns off at a slightly higher value) to prevent rapid switching.
- Keep alert IDs stable and maintain an event history without duplicating the same alert every tick.
- Use seeded randomness, or no noise by default, so tests and scenario comparisons are reproducible.

## Acceptance criteria

1. App launches locally with documented commands.
2. All six sensor categories update over simulated time.
3. Season selection changes outside-temperature behavior and representative extremes can be reached.
4. Day/night and grow-light timer are visible and functional.
5. All ten equipment controls work in manual mode.
6. Automatic mode follows the documented priority order and shows reasons for output decisions.
7. Emergency rules preempt ordinary automation and show persistent, understandable alerts.
8. Empty reservoir prevents watering and raises an alert.
9. Two-hour forced exhaust cycles run on simulated time and are visible in the UI.
10. Temperature and humidity charts update from recorded simulation samples.
11. Presets reproduce the major requested scenarios.
12. Unit tests cover threshold boundaries, priority conflicts, interlocks, reservoir-empty behavior, and timer cycles.
13. UI remains usable on desktop and mobile, with accessible labels and status text.
14. README explains setup, controls, assumptions, and the fact that this is an educational simulator rather than a real-world control system.

## Definition of done

Do not mark the project complete just because the dashboard looks finished. Verify the simulation loop, controls, rule precedence, state transitions, charts, scenario presets, and tests. Provide a concise README with setup/run/test instructions and explain model limitations.
