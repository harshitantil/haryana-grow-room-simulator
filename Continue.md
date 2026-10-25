# Critical Bug Fix: Unrealistic Instant Temperature Changes and Identical Equipment Behavior

Read `Agent-Master-Specification.md` and `PROJECT_PROGRESS.md` before editing the repository. Work directly in the existing Haryana Indoor Plant Grow Room Simulator.

## Problem

When I turn on the AC or another equipment component, the room temperature drops within seconds. Multiple devices appear to produce the same environmental response, regardless of their actual function.

This is incorrect. The simulator must model equipment-specific physical effects and gradual environmental changes.

## 1. Diagnose the Root Cause First

Inspect the existing simulation engine and identify why different equipment devices produce similar or instantaneous temperature changes.

Look specifically for:

- Generic temperature increments or decrements applied to every device.
- Hardcoded sensor values or arbitrary temperature changes on toggle.
- Equipment handlers that modify sensor state directly instead of applying physical effects.
- React effects, timers, or simulation loops that apply the same change repeatedly.
- Incorrect timestep calculations or inconsistent seconds-versus-hours conversions.
- Duplicate simulation loops or repeated state updates.
- Direct coupling between UI button clicks and environmental sensor values.
- Incorrect initial values, overly large coefficients, or unstable numerical integration.

Document the root cause and reproduction steps in `PROJECT_PROGRESS.md` before or during the fix.

Do not fix this by simply slowing down a UI animation. The underlying environmental simulation must be corrected.

## 2. Implement a Shared, Time-Based Physics Engine

Use one authoritative simulation state and one controlled simulation timestep. Equipment controls must change equipment state; the physics engine must calculate the resulting environmental changes.

Model the room as a 10 × 10 ft grow room, using the actual room height and other configuration values if available. Make assumptions explicit when dimensions or physical parameters are unknown.

For temperature, use an energy balance conceptually equivalent to:

`Indoor temperature change = Net heat flow / Effective thermal capacity`

Include, where supported by the model:

- Heat transfer through the room envelope.
- Outdoor temperature and ventilation.
- Thermal mass and heat storage.
- Grow-light heat.
- Heater output.
- AC cooling capacity.
- Equipment heat.
- Other relevant heat sources and sinks.

Use consistent SI units internally. Convert display units only at the UI boundary.

Do not apply a fixed temperature change merely because a component was switched on.

### Required equipment behavior

| Component | Primary effect | Required temperature behavior |
|---|---|---|
| AC | Removes heat | Gradual cooling based on capacity, room load, and operating state |
| Heater | Adds heat | Gradual warming |
| Exhaust fan | Exchanges indoor and outdoor air | May cool or warm the room, depending on outdoor conditions |
| Fresh-air inlet | Supplies outdoor air | Changes conditions according to incoming air and airflow |
| Grow lights | Add light and heat | Light rises when enabled; heat contribution accumulates over time |
| Humidifier | Adds water vapor | Humidity increases; no arbitrary instant temperature drop |
| Dehumidifier | Removes water vapor | Humidity decreases; account for its heat effect when modeled |
| Oscillating fan | Circulates room air | Improves mixing; do not invent a large net cooling effect |
| Water pump | Transfers water | Changes reservoir and substrate moisture, not room temperature directly |
| Carbon filter | Filters appropriate airborne contaminants | Does not directly cool the room or remove CO₂ unless a separately modelled mechanism explicitly supports that behavior |

A component may have secondary physical effects, but those effects must be justified and implemented explicitly.

## 3. Make Changes Gradual and Physically Plausible

Turning a device on should update its ON/OFF state immediately. Environmental variables should evolve according to the simulated time elapsed and the model's physical parameters.

Requirements:

- Use a configurable timestep, such as 1–10 simulated seconds, appropriate to the existing architecture.
- Scale state integration by elapsed simulated time.
- Support configurable simulation speed without changing the underlying physical meaning of model coefficients.
- Prevent a delayed browser frame or repeated timer from advancing the simulation by an uncontrolled amount.
- Clamp invalid states and handle numerical instability.
- Ensure the simulation does not run twice because of duplicate intervals or component remounts.
- Use appropriate thermal mass and equipment capacities so realistic room temperatures do not jump by several degrees in a few real-time seconds under ordinary settings.
- Keep simulated time distinct from wall-clock time and clearly indicate simulation speed.
- Avoid hardcoding a universal maximum temperature change per frame as a substitute for correct physics.

Calibrate coefficients using documented assumptions. If the model lacks reliable equipment specifications, expose clearly labelled illustrative defaults rather than presenting them as measured values.

## 4. Couple the Other Environmental Variables

Temperature must not be the only correctly modelled variable.

**Humidity:** Track moisture or water-vapor content consistently. Account for humidification, dehumidification, ventilation, AC condensation when modelled, and plant evapotranspiration. Derive relative humidity from air conditions consistently rather than applying arbitrary changes.

**CO₂:** Account for ventilation, incoming-air concentration, plant uptake, and respiration when included in the model. Do not assume an exhaust fan instantly sets CO₂ to a target value.

**Light:** Grow lights must change light intensity according to their configured output, distance or coverage assumptions, and operating state. Do not confuse lux, PPFD, and DLI.

**Substrate moisture and reservoir:** Watering must alter substrate moisture over time, consume reservoir water, and respect drainage and plant uptake. An empty reservoir must prevent pump operation.

**Equipment interlocks:** Preserve the automation priorities, safety rules, and heating/cooling and humidity interlocks specified in `Agent-Master-Specification.md`.

## 5. Separate Manual Controls from Automation

Manual device controls and automatic control rules must both operate through the same equipment state and physics engine.

- A manual toggle must not directly overwrite environmental measurements.
- Automation must issue device commands, not teleport sensor readings to target values.
- The engine must account for equipment capacity, operating state, and competing heat or moisture loads.
- Prevent automation oscillation with appropriate hysteresis or minimum run times.
- Show the reason an automatic device started or stopped.
- Ensure an environmental change can occur even when no UI component is being interacted with, as simulated time advances.

## 6. Add Regression Tests That Prove Different Behaviors

Create deterministic tests using controlled initial conditions, fixed outdoor weather, known equipment parameters, and known simulation durations.

At minimum, verify:

1. Switching on the AC does not instantly change the temperature.
2. With a net cooling load, the AC gradually lowers temperature over simulated time.
3. With a net heating load, the heater gradually raises temperature.
4. Switching on grow lights increases light output and contributes heat.
5. Exhaust ventilation moves indoor temperature toward outdoor temperature; it cools when outdoors is cooler and warms when outdoors is hotter.
6. An oscillating fan does not create an arbitrary large net cooling effect.
7. A humidifier changes moisture rather than directly subtracting a large temperature value.
8. A pump changes reservoir and substrate moisture without causing an artificial room-temperature drop.
9. Different equipment types produce different, physically justified effects.
10. Turning off a device stops its contribution, while previously accumulated environmental changes decay naturally.
11. Different simulation speeds advance the same model consistently for the same simulated duration.
12. Repeated toggling does not create duplicate simulation loops.
13. Equipment interlocks and empty-reservoir protections remain functional.
14. The simulation remains stable for a prolonged run and never produces NaN, Infinity, or impossible state values.

Tests must assert numerical behavior over simulated time, not merely check whether a device's ON/OFF flag changed.

Use tolerances rather than brittle exact floating-point comparisons. Test expected directions and plausible ranges based on the documented model.

## 7. Verify the Fix in the Existing UI

Run the simulator and perform the following experiment:

1. Reset to a known initial state.
2. Record indoor temperature, outdoor temperature, humidity, CO₂, light, equipment states, and simulation time.
3. Run for a fixed simulated duration with equipment off.
4. Reset to the same state.
5. Run for the same duration with only the AC on.
6. Repeat with only the heater, exhaust fan, grow lights, humidifier, and water pump.
7. Compare the resulting time series and verify each device's expected effect.

Ensure the charts show gradual environmental changes instead of instantaneous jumps. Display the simulation speed and elapsed simulated time clearly.

## 8. Documentation and Completion

Update these files:

- `PROJECT_PROGRESS.md`: root cause, files changed, decisions, commands, actual test results, remaining work.
- `TEST_REPORT.md`: new regression tests, results, failures, and verification limitations.
- `README.md`: simulation controls and relevant operating instructions.
- `DATA_SOURCES.md`: any external data or physical parameters used in the model, their sources, and limitations.

Run the available tests, type checking, linting, and production build. Use the actual scripts present in the repository.

Do not claim that browser behavior is verified unless the app was actually run and observed. Do not claim all tests pass if any failed or were skipped.

### Definition of done

The fix is complete only when the underlying physics model has been repaired, different equipment types have distinct causal effects, environmental changes are gradual over simulated time, regression tests demonstrate the expected behavior, and the documentation reflects the actual results.

Begin by inspecting the existing simulation engine, locating the shared temperature-changing logic, and reproducing the bug. Then implement and test the fix. Do not stop after writing a plan.