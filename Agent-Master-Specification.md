# Master Agent Specification — Haryana Indoor Plant Grow Room Simulator

**Purpose:** This is the consolidated implementation specification for the existing Haryana Indoor Plant Grow Room Simulator. It combines the original application requirements, historical-data repair, coupled physics, dashboard UX, crop profiles, automated testing, and mandatory project documentation.

## Critical instructions to the coding agent

- Work in the **existing repository**. Inspect it before editing; preserve working features and avoid creating a disconnected replacement.
- Read this entire document before implementation.
- Scenario Lab currently works, but the real historical API returns HTTP 400 and sensor cards reportedly open blank screens. Treat both as blocking defects.
- Do not stop at a plan, mockup, or list of proposed changes. Implement, run, and verify.
- Do not use fabricated historical data, fake sensor history, random chart arrays, invented source metadata, or fabricated test results.
- Never claim a feature works unless you have run it and verified it.
- Maintain `PROJECT_PROGRESS.md` (required) as work proceeds. Record files inspected/changed/added, what changed, why, what works, what remains broken, commands run, actual results, decisions, and next steps. Update it after each substantial work session and before the final response.
- Keep `README.md`, `DATA_SOURCES.md`, and `TEST_REPORT.md` accurate and synchronized with the implementation.
- If a value or physical relationship is not implemented or supported by evidence, state that clearly rather than simulating it invisibly.

---

# 1. Immediate blocking defects

## 1.1 Historical API HTTP 400

Current error reported by the user:

> Open-Meteo Historical API returned HTTP 400 (Bad Request): Invalid value: Cannot initialize SurfacePressureAndHeightVariable... from invalid String value temperature_2m,relative_humidity_2m,precipitation,surface_solar_radiation,wind_speed_10m.

Inspect `src/services/historicalWeatherService.ts` and the actual HTTP request. Do not guess at the fix.

Important likely issue: `surface_solar_radiation` is not the documented hourly variable name; Open-Meteo commonly exposes `shortwave_radiation`. Additionally, the chosen product may not support every field requested. Verify the API docs and product support before building the request.

### Requirements

1. Log the final URL/parameters in development without exposing secrets.
2. Read the real HTTP error response body and show a useful diagnostic in the UI.
3. Use a documented endpoint and a compatible product/field set. ERA5 and ERA5-Land do not necessarily offer identical variables.
4. Prefer a consistent ERA5 dataset if it covers the required fields; otherwise use clearly documented compatible products and retain source/product provenance per field.
5. Verify the request using a real request for a Haryana location and inspect status, schema, units, timestamps, and returned date range.
6. Do not claim the source is fixed based only on mocked unit tests.
7. Add real-provider integration tests when possible; isolate tests from the provider's availability and label mocked contract tests as mocked.
8. Keep the UI functional when the source is offline: show error, Retry, and valid cached records clearly labelled with cache time. Never substitute synthetic data as history.
9. Handle bounded retries, API limits, malformed payloads, missing values, duplicates, time ordering, time zones, partial responses, and cache expiry.
10. Historical weather data is outdoor forcing, not actual grow-room sensor data.

## 1.2 Blank sensor detail screens

Audit the full path through `SensorCard.tsx`, `App.tsx`, `useSimulation.ts`, and `SensorDetailModal.tsx`.

Investigate:
- State updates/order and selected metric IDs.
- Undefined/null history arrays and unexpected data shapes.
- Date ranges with zero samples.
- Conditional branches rendering nothing.
- Chart errors, imports, axis keys, or formatting exceptions.
- Modal size, layering, theme, focus, and scroll behavior.
- Runtime exceptions in the browser console.

### Requirements

- Create one typed metric registry for metric ID, title, unit, source category, data selector, formatter, supported ranges, and chart label.
- Validate metric IDs and input data before rendering.
- Show loading, empty, partial-data, and error states; never show a blank dialog.
- Always show metric name, unit, source badge, selected range, and current/last available value even if the chart fails.
- Add a component error boundary around charts/detail content so one failed chart cannot crash the whole app.
- Explain why data is missing and offer Retry when appropriate.
- Close with a button and Escape; manage focus and return it to the triggering card.
- Use a responsive full-height sheet/dialog on mobile.
- Clicking every sensor/KPI must open the correct metric-specific view, including when data is empty or the API is offline.

---

# 2. Application goals and room

Build and maintain an educational, interactive simulator for a 10 ft × 10 ft room (100 sq ft). Room height must be configurable; the model uses room volume, not floor area alone.

Model Haryana-inspired weather:
- Summer scenario: outdoor daytime temperatures can reach approximately 40–45°C.
- Winter scenario: outdoor nighttime temperatures can reach approximately 5–6°C.
- Spring, Autumn, and optionally Monsoon profiles.
- Prefer historical outdoor forcing when historical replay is selected.
- Seasonal curves are allowed only in the clearly labelled Scenario Lab; never display them as historical observations.

The simulation must support:
- Day/night and simulated clock.
- Pause, play, reset, step forward/back, configurable playback speed.
- Automatic and Manual modes.
- Configurable targets and room/equipment/plant parameters.
- Reproducible runs and scenario presets.

---

# 3. Data provenance and historical weather

## 3.1 Recommended providers

Primary candidate: Open-Meteo Historical Weather API, using a documented compatible product such as ERA5. NASA POWER may be implemented as an optional fallback after its endpoint, parameters, timestamp conventions, response schema, and licensing/attribution are verified.

Documentation:
- Open-Meteo historical API: https://open-meteo.com/en/docs/historical-weather-api
- NASA POWER hourly API: https://power.larc.nasa.gov/docs/services/api/temporal/hourly/

Do not add a second provider merely to hide a bug in the first one.

## 3.2 Location and date range

Support at least:
- Hisar: 29.1492° N, 75.7217° E
- Rohtak: 28.8955° N, 76.6066° E
- Gurugram: 28.4595° N, 77.0266° E
- Karnal: 29.6857° N, 76.9905° E
- Ambala: 30.3782° N, 76.7767° E

Verify coordinates before shipping. Use Asia/Kolkata for user-facing timestamps and day/night logic. Store/convert timestamps consistently.

Fetch the latest available rolling 24 months, allowing a documented publication delay (the current implementation intended five days). Display the actual returned range, not the requested range if they differ. Support custom ranges within available data.

## 3.3 Fields

Fetch only fields supported by the selected product. Potential hourly fields:
- 2 m air temperature (°C)
- 2 m relative humidity (%)
- precipitation (mm)
- shortwave solar radiation (W/m²), if supported
- 10 m wind speed (km/h or provider unit, converted consistently)

Never assume `surface_solar_radiation` is a valid hourly field. Verify the documented name for the chosen API/product.

## 3.4 Data integrity

Keep these categories separate:
1. Historical outdoor data: source-backed provider records.
2. Derived metrics: statistics calculated from real records, with formulas.
3. Simulated indoor data: generated by the coupled room model.
4. User overrides: manually set test inputs, visibly labelled.
5. Missing data: null/gap with counts and percentage; never filled with random values.

Every dataset should record source URL/provider, product, coordinates, units, timezone, requested and returned date ranges, retrieval time, and cache status. Reanalysis is not equivalent to direct local weather-station measurement; explain the spatial resolution/limitations.

Use a validated cache with a documented TTL. On failure, show a clear error and Retry. Cached values must say “Cached historical data” and show retrieval time. Do not re-fetch two years of data on every render or sensor click.

---

# 4. Coupled physics model — all factors and equipment interconnected

## Non-negotiable rule

Indoor values are model outputs, not independent sliders during normal simulation. Users adjust environmental inputs, setpoints, room/equipment parameters, and device commands. Provide an explicitly labelled expert sensor-fault override only if useful; show that it overrides the physical model.

Use one deterministic simulation state and a single timestep function. Avoid random sensor jumps and unrelated timers.

Suggested per-tick sequence:
1. Read historical outdoor weather or labelled scenario input.
2. Evaluate automation rules from current state.
3. Resolve priority, interlocks, and overrides.
4. Apply final equipment outputs to the physical model.
5. Advance temperature, vapour/humidity, CO₂, substrate water, reservoir, and light.
6. Check bounds/numerical stability.
7. Store histories, physical fluxes, equipment transitions, alerts, and decision reasons.
8. Update the UI.

Use SI units internally where possible and document all model constants. All physical explanations displayed in the UI must be computed from actual model fluxes, not hard-coded example numbers.

## 4.1 Thermal balance

Model:
- Heat transfer through envelope (insulation/UA).
- Effective thermal mass and gradual response.
- Grow-light electrical power and heat fraction.
- Heater output.
- AC cooling capacity and optional latent cooling.
- Heat produced by fans, pump, and dehumidifier where appropriate.
- Ventilation heat exchange.
- Optional solar/roof gain using historical solar radiation and documented assumptions.
- Room volume, air density, specific heat, fan flow, filter resistance.

Ventilation sensible heat:
`Q_vent = massFlowKgPerSecond * airSpecificHeatJPerKgK * (outdoorTempC - indoorTempC)`

The sign matters:
- Indoor 25°C, outdoor 10°C: ventilation must cool the room gradually.
- Indoor 20°C, outdoor 40°C: ventilation must warm the room gradually.
- Equal indoor/outdoor temperatures: approximately zero sensible ventilation heat transfer.
- Better insulation slows drift toward outdoor temperature.
- Lights ON add configured heat.
- AC cools gradually; heater warms gradually.

Never make exhaust a magical cooling device. Its effect depends on the outdoor/indoor temperature difference.

## 4.2 Humidity and water vapour

Prefer tracking water-vapour mass/humidity ratio, then deriving RH from temperature and saturation vapour pressure. Include:
- Outdoor moisture exchange via ventilation.
- Humidifier addition.
- Dehumidifier removal.
- AC condensate removal if modelled, without double-counting.
- Substrate evaporation.
- Plant transpiration, with documented approximate dependence on light, temperature, and plant parameters.
- Fan-driven airflow effects on evaporation.
- Temperature/RH coupling: at constant vapour content, warming generally lowers RH and cooling raises RH within valid conditions.

Fans redistribute/mix air; they do not magically create or destroy water.

## 4.3 CO₂

Model CO₂ concentration using room volume and ventilation exchange toward a clearly labelled outdoor CO₂ baseline (configured assumption unless a reliable data source is integrated). Optionally include a documented light-dependent plant uptake approximation and night respiration.

- Do not claim outdoor weather APIs provide room CO₂.
- Carbon filters do not scrub inorganic CO₂.
- High ventilation can rapidly remove enriched CO₂.
- Do not add automatic CO₂ dosing equipment; it is not in the specified equipment list.

## 4.4 Substrate moisture and reservoir

Model a water balance:
- Pump flow and watering duration.
- Substrate/container effective water capacity.
- Evaporation affected by temperature, light, airflow, and wetness.
- Plant water uptake linked to plant size/stage and conditions.
- Drainage beyond a configurable capacity.
- Reservoir consumption and refill events.
- Empty reservoir hard interlock.

If moisture is a normalized 0–100% index, call it a “modelled substrate moisture index”; do not imply calibrated volumetric water content (VWC). Do not invent a universal substrate moisture target for every crop.

Tests:
- Pump ON increases substrate water and decreases reservoir level.
- Empty reservoir prevents irrigation.
- With irrigation off, substrate dries under positive evaporation/uptake.
- Heat/airflow/light can change drying according to documented coefficients.
- Refill increases reservoir level.
- No negative reservoir or impossible moisture values.

## 4.5 Light

Light level depends on:
- Grow-light state, power/intensity/dimming and distribution.
- Configured photoperiod/day-night.
- Daylight only if the room has a configured window/skylight/transmission factor.
- Plant response only when modelled.

Lux is not PPFD. Outdoor solar radiation in W/m² cannot be directly labelled PPFD without a documented spectral conversion. Calculate DLI only from a PPFD time series or an explicitly documented approximation.

## 4.6 Equipment consequences

Every device must have a documented and tested effect:
- Heater: adds heat.
- AC: removes sensible heat; may remove water vapour.
- Exhaust: exchanges indoor air with outdoor air, affecting heat, moisture, CO₂.
- Inlet: supplies make-up outdoor air; avoid double-counting with exhaust.
- Oscillating fans: increase mixing and may affect evaporation; no magical energy/water removal.
- Humidifier: adds water vapour.
- Dehumidifier: removes vapour and may add sensible heat.
- Water pump: transfers water from reservoir to substrate.
- Grow lights: increase light and add heat.
- Carbon filter: increases airflow resistance / lowers effective exhaust flow; no direct CO₂ removal.

Represent rated capacity/flow, power, heat/moisture effect, ramp/delay, and limitations in configurable parameters. Do not claim exact energy use or HVAC performance without validated equipment specs.

---

# 5. Automation priorities and manual control

Priority order:
1. Emergency
2. Temperature
3. Humidity
4. CO₂ / Fresh Air
5. Watering
6. Normal Timers

Rules:
- Below 18°C: request heater ON and limit exhaust.
- Above 27°C: request AC ON and limit exhaust.
- Below 15°C or above 32°C: temperature emergency.
- Below 40% RH: request humidifier.
- Above 60% RH: request dehumidifier and allow exhaust.
- Below 30% RH or above 75% RH: humidity emergency.
- CO₂ below 450 ppm: request exhaust + inlet.
- Force a short exhaust run every two simulated hours.
- Substrate moisture below 43%: request pump ON.
- Above 70%: request pump OFF.
- Empty reservoir: pump OFF + alert.
- Heater and AC cannot run together in automatic mode.
- Humidifier and dehumidifier cannot run together in automatic mode.
- When heating/cooling, limit exhaust unless documented exceptions apply, including very high humidity or very low CO₂.
- Grow-light schedules and other timers are lowest priority.

Use documented hysteresis. Preserve requested threshold entry points. Record each rule evaluation, winning priority, requested state, final state, interlock/override, timestamp, and reason.

Automatic mode lets the controller decide outputs. Manual mode obeys user device commands except explicitly documented safety interlocks (especially empty reservoir); explain every interlock. Switching to automatic immediately recomputes outputs.

---

# 6. Dashboard tabs and interaction design

Use a clear, responsive navigation layout. Do not put every setting on one screen.

## Overview
- Plain-language status summary.
- Six main readings: indoor temperature, RH, CO₂, substrate moisture, light, reservoir.
- Day/night, simulation clock, location, season, mode, play/pause, source status.
- Small temperature/humidity trends, alerts, and “why this is happening” summaries.
- Each KPI opens its own metric details.

## Climate & History
- Historical outdoor and simulated indoor series kept visually separate.
- Location/date selectors and historical replay.
- Available weather fields, data coverage, gaps, source, product, timezone, cache/freshness, retry.
- No fake chart if data is missing.

## Equipment
- Heater, AC, exhaust, inlet, oscillating fans, humidifier, dehumidifier, water pump, grow lights, carbon filter.
- ON/OFF state, mode, capacities/flow, reasons, overrides, recent transitions, physical effects.
- Separate requested command from final resolved state.

## Automation
- Priority order, active rules, values/thresholds, requested/final output, override reasons, forced-exhaust timer, hysteresis, emergency history.

## Crops & Growing Plan
- Crop and growth-stage selection.
- Source-backed reference ranges and uncertainty.
- Current indoor simulated conditions versus crop targets.
- Time in/out of target based on actual recorded simulation history.
- Suggestions to adjust setpoints, requiring confirmation; do not silently change targets.

## Scenarios & Tests
- Scenario Lab, explicitly labelled synthetic.
- Repeatable test cases with inputs, expected result, actual result, PASS/FAIL, logs, reset.
- Historical API offline/malformed-response cases.

## Settings & Data
- Room dimensions/height, insulation, thermal mass, leakage/air exchange, equipment capacities, light schedule, pump flow, substrate/container, plant settings.
- Data source, location, cache, provenance, assumptions, formulas, model version.
- Validated export/import of simulation configuration JSON.

Navigation must preserve simulation state and not reset the clock unexpectedly.

---

# 7. Sensor detail dialog requirements

Every sensor card/KPI is clickable and opens a metric-specific dialog/drawer containing:
- Metric name, current/last value, unit, source category.
- Selectable range: 24 hours, 7 days, 30 days, 90 days, 1 year, all available history.
- Metric-specific chart, axes, legend, tooltips.
- Min, max, mean/median when appropriate, sample count, missing count/percentage, times of extrema.
- Data table with pagination/virtualization.
- CSV export including timestamps, units, and provenance.
- Data source, location, timezone, data freshness.
- For simulated metrics, “Why did this value change?” based on actual computed fluxes and relevant equipment/automation events.
- Loading, empty, partial, offline, and error states.
- Escape/button close, focus trap/return, mobile layout.

Specific metrics:
- Temperature: historical outdoor vs simulated indoor, thermal fluxes, heater/AC/ventilation events.
- Humidity: outdoor vs indoor series, vapour/temperature effects, humidifier/dehumidifier/exhaust events.
- CO₂: simulated/override badge, ventilation and plant exchange.
- Substrate moisture: modelled index, irrigation/drying/drainage, pump/reservoir events.
- Light: day/night, grow-light contribution, units clearly stated.
- Reservoir: level, pump consumption, refill, empty alerts.
- Equipment: state transitions, rule cause, final state, physical effects.

---

# 8. Crop profiles and crop-aware growing guidance

Implement a versioned, source-backed crop library, e.g. `src/crops/cropProfiles.ts`. Start with:
- Lettuce
- Spinach
- Basil
- Coriander/cilantro
- Tomato
- Cucumber
- Pepper/chilli
- Microgreens (generic, species-dependent)
- Mint

For each crop and relevant growth stage, record:
- Common and scientific name.
- Day/night temperature range (°C) where supported.
- RH range (%) and caveats where supported.
- PPFD (µmol m⁻² s⁻¹), DLI (mol m⁻² day⁻¹), and photoperiod only where source supports it.
- CO₂ baseline/enrichment notes only where supported.
- Watering/substrate guidance without false precision.
- Relevant substrate, pH, or EC notes only if useful and sourced.
- Source URL, access date, source type, uncertainty, cultivar/stage/production limitations.

Missing parameters must be `unknown`/not specified, not guessed. Distinguish crop targets from safety thresholds. Do not imply all plants need CO₂ enrichment.

### Useful reference starting points

Virginia Tech Extension, DLI examples and guidance:
https://www.pubs.ext.vt.edu/SPES/spes-720/spes-720.html

University of Missouri Extension, light/PPFD guidance:
https://extension.missouri.edu/publications/g6987

Ontario greenhouse CO₂ guidance:
https://www.ontario.ca/page/supplemental-carbon-dioxide-greenhouses

FAO crop water requirements:
https://www.fao.org/4/S2022E/s2022e07.htm

University of Georgia controlled-environment agriculture background:
https://fieldreport.caes.uga.edu/publications/B1595/controlled-environment-agriculture-basics/

Verify the exact pages and cite specific supported values per profile. These are starting sources, not permission to copy universal ranges into every crop.

DLI formula for constant PPFD:
`DLI = PPFD × photoperiod_seconds / 1,000,000`
For variable light, integrate PPFD over time. Do not claim measured DLI from lux or W/m² without a documented conversion.

When a crop is selected:
- Show crop target bands separately from actual simulated lines.
- Calculate time in/out of target from recorded simulation data.
- Explain deviations in plain language.
- Explain trade-offs: ventilation can cool a room when outdoor air is cooler, but warm it when outdoor air is hotter and dilute CO₂.
- Offer to apply suggested setpoints with a confirmation showing exact changes.
- Do not claim guaranteed yield or unsupported disease prediction.
- Let users clone/edit profiles, labelling edits as user-configured.

---

# 9. Historical replay and Scenario Lab

## Historical Replay
- Select location, date range, playback speed.
- Load actual historical outdoor data.
- Step through timestamps in order; document interpolation/resampling assumptions.
- Feed weather into the indoor physics model and automation controller.
- Play/pause, step, speed, reset.
- Show outdoor forcing and simulated indoor response separately.
- Record reproducible run settings and model version.
- If data is missing, fail clearly or pause; do not invent weather records.

## Scenario Lab
Synthetic stress tests are allowed only when visibly labelled “Scenario / Synthetic input”. Include:
- Summer heatwave: 45°C input.
- Winter cold night: 5°C input.
- Temperature emergencies below 15°C and above 32°C.
- Humidity below 30% and above 75%.
- Low CO₂ below 450 ppm.
- Dry substrate below 43%; wet substrate above 70%.
- Empty reservoir.
- Heater/AC and humidifier/dehumidifier conflicts.
- Exhaust override for high humidity/low CO₂.
- Forced exhaust after two simulated hours.
- API offline/malformed response.
- Historical replay across day/night and missing data.

Every scenario shows setup, action, expected result, actual result, PASS/FAIL, decision log, and reset.

---

# 10. Testing and verification

Use the project's existing test framework, or add Vitest. Add Playwright/browser tests if feasible.

## Historical data tests
- Valid response parsing, field units, timestamps, and provenance.
- Actual request URL and compatible variables.
- HTTP 400/error body surfaced correctly.
- Malformed response rejected.
- Missing values preserved and counted.
- Duplicates/out-of-order timestamps handled.
- Asia/Kolkata time conversion.
- Correct actual returned date coverage.
- Cache labelled with retrieval time.
- Retry bounded.
- Offline mode never inserts fabricated historical records.

## Physics causal tests
- Cold outdoor air with exhaust/inlet cools a warmer room.
- Hot outdoor air with exhaust/inlet warms a cooler room.
- Equal indoor/outdoor temperatures cause approximately zero sensible ventilation heat transfer.
- Better insulation slows outdoor temperature response.
- Lights add heat and light.
- AC cools; heater warms.
- Humidifier adds vapour; dehumidifier removes vapour.
- At constant vapour mass, warming lowers RH and cooling raises RH in valid conditions.
- Ventilation changes humidity and CO₂ toward outdoor conditions.
- Carbon filter changes airflow resistance, not CO₂ directly.
- Pump adds substrate water and consumes reservoir water.
- Empty reservoir blocks pump.
- Substrate dries with irrigation off and positive water loss.
- Oscillating fans affect only documented mixing/evaporation effects.
- Fixed inputs produce deterministic results.
- Bounds and numerical stability are maintained.

## Automation boundary tests
Temperature: 14.9, 15, 17.9, 18, 27, 27.1, 32, 32.1°C.
Humidity: 29.9, 30, 39.9, 40, 60, 60.1, 75, 75.1%.
CO₂: 449, 450, 451 ppm.
Substrate: 42.9, 43, 70, 70.1%.
Also test reservoir empty/refill, interlocks, forced exhaust, timer priority, emergency precedence, hysteresis, manual/automatic switching, and exhaust exceptions.

## UI/browser tests
- Every KPI opens the correct detail; no blank screen with valid/empty/error data.
- Dialog close and focus restoration work.
- Every tab works and preserves state.
- Crop selection, growth stage, target overlays, and confirmation work.
- Equipment controls work in manual mode.
- Historical replay works with valid data and fails clearly without it.
- Scenario tests show actual outcomes.
- Mobile and keyboard access work.
- One broken chart does not crash the dashboard.

## Commands and truthful reports
Run actual commands supported by the repository:
- unit tests
- integration tests
- browser tests
- typecheck
- lint
- production build

Do not claim a command ran unless it did. Do not call TypeScript typechecking a separate lint engine unless that is genuinely how the project is configured.

---

# 11. Mandatory project progress record

Create and maintain `PROJECT_PROGRESS.md` in the repository root. This is required, not optional.

Update it throughout the work, not only at the end. Include:

1. **Project status:** working, partial, broken, blocked, or unverified for each major feature.
2. **Task log:** timestamp/date, task, reason, implementation summary, result.
3. **File inventory:** every file added, modified, deleted, or inspected, with purpose and concise change summary.
4. **Feature matrix:** historical API, caching/provenance, each sensor detail, each tab, crop library, each device, each physics relationship, automation, replay, Scenario Lab.
5. **Commands run:** exact terminal commands and actual exit status/results.
6. **Tests:** actual pass/fail counts, skipped tests, and tests not run.
7. **Data status:** real provider, actual successful request date, location, product, actual date coverage, fields, missing-data percentage, cache status. Never record “working” without a successful verified request.
8. **Known bugs/limitations:** include reproducible steps and error messages.
9. **Decisions and assumptions:** why a source, equation, coefficient, dependency, or architecture was selected.
10. **Next steps:** ordered and concrete.
11. **Final verification:** production build status, actual browser verification, unresolved blockers, and what remains unverified.

Update `README.md` with setup and use, `DATA_SOURCES.md` with source/field provenance, and `TEST_REPORT.md` with actual test commands/results. The progress log must not be a fabricated success summary.

If a task is unfinished, write `IN PROGRESS` or `BLOCKED`, explain why, and do not claim completion.

---

# 12. Recommended implementation order

1. Inspect the repository and reproduce the HTTP 400 and blank sensor dialog.
2. Create `PROJECT_PROGRESS.md` before substantial changes and record the initial state.
3. Fix the sensor dialog rendering/empty/error path and add browser tests.
4. Repair and verify the real historical data request with the correct product and field names.
5. Verify the shared coupled physics model and the temperature response to ventilation.
6. Verify all equipment's physical consequences and automation priorities.
7. Organize the UI into the requested tabs without breaking simulation state.
8. Add source-backed crop profiles and crop-aware comparisons.
9. Add/repair historical replay, data provenance, and repeatable tests.
10. Run unit, integration, browser, type, lint, and build checks; fix failures.
11. Update `README.md`, `DATA_SOURCES.md`, `TEST_REPORT.md`, and `PROJECT_PROGRESS.md`.
12. Return a factual final summary: files changed, features verified, exact data source/date coverage, commands/results, known bugs, and next steps.

**Definition of done:** Real historical data is actually loading; sensor cards never open blank screens; the physics responds correctly to equipment and outdoor conditions; crop profiles have traceable sources; all tabs/controls work; tests and build have actual recorded results; and `PROJECT_PROGRESS.md` fully documents the work.

Do not finish with only a plan. Implement, test, and document the actual state of the application.
