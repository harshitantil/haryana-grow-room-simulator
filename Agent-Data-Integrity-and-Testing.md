# Agent Implementation Brief: Historical Data, Sensor Drill-Downs, and Verification

## Mission

Audit and upgrade the existing Haryana Indoor Plant Grow Room Simulator. The interface may already exist, but do not assume it is correct because it looks convincing. Replace fabricated/default demo datasets with a traceable historical-weather data pipeline, make every sensor and environmental metric explorable, and prove the automation works with automated tests and a visible test report.

**Work in the existing repository. Inspect the current code before changing it. Preserve working features and avoid rebuilding everything unnecessarily. Do not stop after writing a plan: implement, run, test, and report actual results.**

## Non-negotiable data integrity rules

1. Do not invent historical weather observations, timestamps, sensor readings, chart points, alert history, equipment events, source names, or test results.
2. Never silently fall back to hard-coded arrays or random values when the historical API fails.
3. If data cannot be fetched, show a clear error state with a Retry action and explain which features are unavailable. Keep the rest of the app usable where possible.
4. Every historical dataset must show its source, location, selected date range, timezone, retrieval/update time, units, and whether it contains observations, station measurements, or reanalysis/modelled weather.
5. Never label an indoor estimate as a real measurement. A simulated indoor sensor is an estimate produced by the room model.
6. Do not use random data to fill gaps. Represent missing values as missing; display gaps in charts and identify the missing-data percentage.
7. No fake “live” readings, fake API success, fake connectivity indicators, fake alert events, or hard-coded chart history presented as historical data.
8. Any illustrative/demo scenario must be explicitly labelled **Scenario / Synthetic input** and must not be mixed into historical charts without a visible distinction.
9. Do not claim all values are directly observed if the chosen weather source is reanalysis. Explain its limitations in the UI.
10. Provide a data provenance panel and a way to inspect the raw source records used for a selected period.

## Historical weather data

### Location and date range

- Provide a Haryana location selector using named cities/districts and their documented coordinates. At minimum support Hisar, Rohtak, and Gurugram; add more if practical.
- Set a sensible default location, but display it clearly and allow changing it.
- Fetch the **latest available rolling 24 months** of hourly outdoor weather data. Compute dates dynamically from the current date. Historical providers can have a publication delay; display the actual returned date range and never pretend unavailable recent dates are present.
- The interface should allow selecting a custom range within the available dataset.
- Use the correct location timezone (Asia/Kolkata) for display and day/night logic. Store timestamps consistently and avoid timezone conversion bugs.

### Suggested source

Use the Open-Meteo Historical Weather API (Archive API) or another documented, reliable source with an appropriate licence and attribution. Prefer hourly historical fields such as:
- 2 m air temperature
- 2 m relative humidity
- precipitation, if available/useful
- wind speed/direction, if useful for contextual outdoor conditions
- surface solar radiation or shortwave radiation, if available

Choose and document the source product (for example, ERA5 or ERA5-Land). These are reanalysis products, not necessarily direct measurements from a local weather station. State this clearly. If using a station-observation source instead, identify the station and the actual observed fields.

### Fetching, persistence, and reliability

- Inspect whether the current application has a backend/database. Reuse it if appropriate; do not add infrastructure without a reason.
- Fetch historical records from a service layer, not inside UI components.
- Add server-side proxying if needed to protect credentials or handle CORS; do not expose secrets in frontend code.
- Cache successfully fetched data with source, coordinates, date range, product, units, and retrieval timestamp. Use an appropriate cache key and TTL.
- Validate HTTP status, response schema, units, timestamps, duplicates, monotonic ordering, and missing values.
- Add loading, empty, partial-data, rate-limit, offline, and error states.
- A failed refresh must not silently replace valid data with invented data. If cached records are shown, label them **Cached historical data** and show their retrieval time.
- Add retry/backoff for transient failures, with bounded retries.
- Provide a “Refresh historical data” action and a “View source / attribution” link.
- Do not download two years repeatedly on every render or every sensor click.
- Document any API limits and source licence/attribution requirements.

## Keep historical, derived, and simulated data separate

The app must have clear data categories:

1. **Historical outdoor data**: values returned by the documented provider, with original timestamps and source metadata.
2. **Derived metrics**: values calculated from historical records, such as daily min/max/mean or degree-hours. Show the formula.
3. **Simulated indoor data**: room-model estimates driven by outdoor conditions, room parameters, sensor inputs, and equipment states.
4. **User overrides / scenario inputs**: values manually entered by the user. Show when an override is active.
5. **Missing data**: no fabricated replacement. Preserve gaps and show their impact.

Charts must never merge these categories without separate legend entries and an explicit explanation. Historical outdoor temperature is not the same as simulated room temperature. Soil/coco moisture, indoor CO₂, reservoir level, and equipment states do not come from outdoor weather history; they must be modelled or user-controlled and visibly marked as simulated.

## Clickable sensor and metric drill-down

Every sensor card, KPI, environmental metric, and major equipment status must be keyboard-accessible and clickable. Use a modal/dialog, drawer, or detail route. A click must open a panel **only about the selected metric**, not a generic dashboard.

The detail view must contain:

- Metric name, unit, current value, and status.
- A clear source badge: Historical outdoor / Derived / Simulated indoor / User override / Unavailable.
- A time-series chart for that metric only, with selectable ranges (24 hours, 7 days, 30 days, 90 days, 1 year, full available history where applicable).
- Historical outdoor data should offer a full available two-year view.
- Summary statistics calculated from actual available data: min, max, mean/median where appropriate, sample count, missing count, and time of extrema.
- A date/time range selector and readable chart axes/tooltips.
- Data source, location, timestamp/timezone, and data freshness.
- A data table for the currently selected interval, with pagination or virtualisation for large datasets.
- CSV export of the displayed data, including timestamps, units, and source/provenance columns.
- Loading, no-data, partial-data, and fetch-error states.
- For simulated values, explain which model factors affect it and show relevant equipment/automation events on the same timeline when available.
- Do not show made-up “precision” or statistics when the sample count is insufficient.

Metric-specific expectations:

- **Temperature:** outdoor historical series and simulated indoor series as distinct lines; min/max/mean; season/day-night comparison; heater/AC events.
- **Humidity:** historical outdoor relative humidity and simulated indoor relative humidity separately; humidifier/dehumidifier/exhaust events.
- **CO₂:** label as simulated or manually set unless a real CO₂ data source/sensor is actually connected; show ventilation events and model assumptions.
- **Soil/coco moisture:** label as simulated/user-controlled; show watering events, pump state, reservoir-empty blocks, and drying/watering trend.
- **Light:** show day/night schedule, grow-light state, and simulated light level. Do not imply a real light sensor exists.
- **Reservoir:** show simulated tank level, pump usage, refill events, and empty-tank alerts.
- **Equipment:** show ON/OFF transitions, which rule requested the state, the final resolved state, and any priority override.
- **Outside temperature:** use actual provider records for the selected location and date range, not a generated seasonal curve when historical mode is selected.

Dialog behaviour:
- Clicking a metric opens the corresponding details panel.
- Close with close button, Escape, and (where suitable) clicking outside.
- Manage focus correctly and return focus to the trigger.
- On mobile, use a responsive full-height sheet or equivalent.
- Do not render an inert clickable-looking card. Every clickable item must do something useful.
- Provide loading feedback while detail data is being prepared and a clear error if it fails.

## Historical replay mode

Add a **Historical Replay** mode to run the indoor model against the real historical outdoor series:

1. User selects location, start/end dates, and playback speed.
2. Load actual hourly outdoor records for that period.
3. Advance the simulation clock through those timestamps in order.
4. Feed each outdoor record into the indoor room model; interpolate between points only if the interpolation method is documented.
5. Run the automation controller at its defined timestep. If hourly source data is used with minute-level simulation, document interpolation/resampling assumptions.
6. Keep indoor results marked as simulated.
7. Show the outdoor forcing data and simulated indoor response together on a timeline.
8. Allow play, pause, step forward/back, speed change, and reset to replay start.
9. Record a reproducible run configuration (source/product, location, date range, room settings, automation settings, scenario overrides, model version).
10. Do not generate a fictional historical replay if the API/data is missing. Explain why replay cannot start.

Provide a separate **Scenario Lab** for controlled hypothetical experiments such as a 45°C outside heatwave, 5°C winter night, high humidity, low CO₂, dry substrate, and empty reservoir. These are deliberately user-selected test inputs, not historical claims. Keep the two modes visually distinct.

## Automation correctness and explainability

Keep the original priority order:

1. Emergency
2. Temperature
3. Humidity
4. CO₂ / fresh air
5. Watering
6. Normal timers

For every controller tick, produce a structured decision record with:
- input sensor values and their data category;
- rules evaluated and their outcomes;
- winning rule and priority for each device;
- requested state vs final output state;
- any interlock/override and its reason;
- timestamp in simulation time.

Retain the specified rules:
- Temperature below 18°C requests heater; above 27°C requests AC.
- Emergency below 15°C or above 32°C.
- Humidity below 40% requests humidifier; above 60% requests dehumidifier and allows exhaust.
- Emergency humidity below 30% or above 75%.
- CO₂ below 450 ppm requests exhaust and inlet fan.
- Force a short exhaust run every two simulated hours.
- Substrate moisture below 43% requests watering; above 70% stops watering.
- Empty reservoir always stops the water pump and creates an alert.
- Heater and AC cannot run together in automatic mode.
- Humidifier and dehumidifier cannot run together in automatic mode.
- Limit exhaust while heating/cooling unless a documented exception applies, including very high humidity or very low CO₂.
- Grow-light schedule and other normal timers are lowest priority.

Use hysteresis to prevent rapid oscillation, but document the ON and OFF thresholds. Avoid changing the requested thresholds silently. In manual mode, user-selected device states should not be silently rewritten by normal automation; safety alerts and any explicit safety interlock must be clearly explained.

## Testing requirements: prove functionality, do not just claim it

Implement automated tests using the project's existing framework, or add Vitest if no test framework exists. Add browser-level tests with Playwright if the project can support it.

### Unit tests for data pipeline

- API success parses valid records and preserves timestamps/units.
- HTTP failure shows an error and does not insert fabricated data.
- Malformed response is rejected with a useful error.
- Missing data remains missing and is counted.
- Duplicate/out-of-order timestamps are handled deterministically.
- Timezone conversion is correct for Asia/Kolkata.
- Date range uses latest available data and shows the true returned range.
- Cached data is labelled with its retrieval time.
- Retry behaviour is bounded.
- Source attribution and product metadata are retained.

### Unit tests for automation

Test below, at, and above each threshold:
- Temperature: 14.9, 15, 17.9, 18, 27, 27.1, 32, 32.1°C.
- Humidity: 29.9, 30, 39.9, 40, 60, 60.1, 75, 75.1%.
- CO₂: 449, 450, 451 ppm.
- Substrate moisture: 42.9, 43, 70, 70.1%.
- Reservoir: empty, low, normal, and refill.
- Heater/AC interlock.
- Humidifier/dehumidifier interlock.
- Exhaust reduction with heater/AC and exceptions for high humidity / very low CO₂.
- Forced exhaust cycle after two simulated hours and its configured duration.
- Timer priority.
- Emergency precedence over all normal rules.
- Hysteresis and alert recovery.
- Automatic/manual mode transitions.
- Device states remain deterministic for the same inputs and seed.

### UI / browser tests

- Every sensor/KPI card opens the correct metric-specific details panel.
- The panel contains the correct metric name and units.
- Range selector updates chart and statistics.
- Closing the panel works by button and Escape, and focus returns correctly.
- Data table and CSV export contain the selected metric and timestamps.
- Source badge correctly distinguishes historical, derived, simulated, overridden, and unavailable data.
- Season and location selectors update the displayed context.
- Historical replay play/pause/step/reset works and never invents missing historical values.
- Each equipment control works in manual mode.
- Automatic mode changes devices according to priority.
- Empty reservoir prevents pump operation.
- Alerts appear for critical temperature/humidity and empty reservoir.
- Charts update from real simulation/history state, not placeholder arrays.
- API failure shows an error state rather than fake data.
- Responsive/mobile layout remains usable.
- Keyboard navigation and accessible labels work.

### Test scenarios to expose in the app

Add a developer/testing panel with named, repeatable tests:
1. Haryana summer heatwave (45°C scenario input).
2. Haryana winter cold night (5°C scenario input).
3. Temperature emergency low (<15°C).
4. Temperature emergency high (>32°C).
5. Humidity emergency low (<30%).
6. Humidity emergency high (>75%).
7. Low CO₂ (<450 ppm).
8. Substrate dry (<43%).
9. Substrate wet (>70%).
10. Empty reservoir.
11. Heater/AC conflict.
12. Humidifier/dehumidifier conflict.
13. Exhaust override due to high humidity.
14. Forced exhaust at two simulated hours.
15. Historical API offline / malformed response.
16. Historical replay across day/night.
17. Missing records in a selected interval.

Each test must show:
- setup/input values;
- action performed;
- expected result;
- actual result;
- PASS/FAIL;
- relevant decision log or error;
- reset action.

Test scenarios are synthetic inputs for validating logic, not historical observations. Make that distinction explicit.

## Test report and definition of done

- Run the actual unit test, type-check, lint, build, and browser-test commands available in the repo.
- Fix failures caused by the changes.
- Never fabricate a test report. Include exact commands and actual pass/fail counts.
- Clearly list anything that could not be run and why.
- Add a `DATA_SOURCES.md` with source URLs, products, fields, units, timezone handling, licence/attribution, caching, known limitations, and a data dictionary.
- Add or update `README.md` with setup, configuration, API/data flow, controls, test commands, and model limitations.
- Add a `TEST_REPORT.md` with date, commit/version, commands, results, and outstanding issues.
- Do not call the project complete until historical data is fetched and verified, metric drill-downs work, the automation tests pass, and the UI error states are verified.
- End the implementation response with: files changed, data source actually used, actual date coverage, test commands/results, and known limitations.

## Implementation sequence

1. Inspect the existing repository, framework, simulation loop, charts, and current data sources.
2. Identify and remove fake historical/demo chart arrays and unlabelled random values.
3. Implement and test the historical data service and provenance metadata.
4. Separate historical outdoor, derived, simulated indoor, user override, and missing data models.
5. Build reusable, accessible metric-detail dialogs with metric-specific data and export.
6. Implement historical replay and clearly separated Scenario Lab.
7. Add automation decision logs and threshold/interlock tests.
8. Add browser tests and the in-app repeatable scenario test panel.
9. Run tests, type-check, lint, and production build; fix issues.
10. Update documentation and produce a factual test report.

**Start by inspecting the existing repository and then implement the changes. Do not respond with only a plan or a mockup.**
