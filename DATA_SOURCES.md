# DATA_SOURCES.md — Environmental Data Provenance & Dictionary

This document details the external meteorological datasets, physical model parameters, data handling practices, caching strategies, and data dictionaries used in the **Haryana Indoor Plant Grow Room Simulator**.

---

## 1. External Historical Weather Data Provider

| Attribute | Specification |
| :--- | :--- |
| **Provider** | [Open-Meteo](https://open-meteo.com) |
| **API Endpoint** | `https://archive-api.open-meteo.com/v1/archive` |
| **Meteorological Product** | **ERA5-Land Reanalysis** (Copernicus Climate Change Service / ECMWF) |
| **Spatial Resolution** | ~9 km global terrestrial reanalysis grid |
| **Temporal Resolution** | Hourly records (interpolated deterministically to simulation minutely ticks) |
| **Timezone** | `Asia/Kolkata` (UTC+05:30) |
| **Attribution Requirement** | *"Contains modified Copernicus Climate Change Service information [2024]"* |
| **License** | Open Database License (ODbL) / ECMWF Copernicus Terms |
| **Publication Delay** | Typical 2 to 5-day publication delay for reanalysis quality assurance |

### Supported Haryana Locations & Coordinates

| Location | District / Region | Latitude | Longitude | Elevation | Regional Microclimate Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hisar** | Western Haryana | `29.1492° N` | `75.7217° E` | 215 m | Semi-arid agricultural hub; extreme diurnal swings (<5°C winter, >44°C summer). |
| **Rohtak** | Central Haryana | `28.8955° N` | `76.6066° E` | 220 m | Central Indo-Gangetic alluvial plain. |
| **Gurugram** | Southern Haryana (NCR) | `28.4595° N` | `77.0266° E` | 217 m | Bordering Aravalli range with urban-fringe thermal effects. |
| **Karnal** | Northern Haryana | `29.6857° N` | `76.9905° E` | 228 m | Intensive rice-wheat agricultural belt. |
| **Ambala** | Sub-Himalayan Plains | `30.3782° N` | `76.7767° E` | 264 m | Transitional sub-Himalayan plains; higher monsoon rainfall, cooler winters. |

---

## 2. Data Fields & Dictionary

| Field Name | Category | Units | Origin / Source | Physical Meaning & Educational Role |
| :--- | :--- | :--- | :--- | :--- |
| `temperature_2m` | Historical Outdoor | °C | ERA5-Land reanalysis | 2-meter dry-bulb air temperature; drives wall heat transfer and ventilation thermal load. |
| `relative_humidity_2m` | Historical Outdoor | % RH | ERA5-Land reanalysis | 2-meter relative humidity; forces ventilation moisture exchange and infiltration vapour flux. |
| `surface_solar_radiation` | Historical Outdoor | W/m² | ERA5-Land reanalysis | Downward global horizontal solar irradiance; contributes to building roof conduction. |
| `precipitation` | Historical Outdoor | mm | ERA5-Land reanalysis | Surface precipitation depth (informational). |
| `wind_speed_10m` | Historical Outdoor | km/h | ERA5-Land reanalysis | 10-meter wind velocity (informational). |
| `indoorTemperature` | Simulated Indoor | °C | Lumped Thermal Model | Calculated from sensible energy balance: $Q_{env} + Q_{solar} + Q_{lights} + Q_{heater} - Q_{ac} + Q_{vent} + Q_{fans}$. |
| `indoorHumidity` | Simulated Indoor | % RH | Psychrometric Mass Model | Derived from total indoor water-vapour mass ($m_v$ in grams) and temperature using Tetens saturation vapour pressure. |
| `indoorCo2` | Simulated Indoor | ppm | Mass Balance Model | Derived from plant photosynthetic consumption, dark respiration, and fresh air ventilation dilution. |
| `substrateMoisture` | Simulated Indoor | % | Water Balance Model | Rootzone hydration index across 4 plant beds (hydrated by drip pump, dried by transpiration/evaporation). |
| `lightLevel` | Simulated Indoor | lux | Photoperiod Model | 48,000 lux under 600W LED array; 250 lux daytime ambient leakage; 0 lux night. |
| `reservoirLevel` | Simulated Indoor | % | Storage Tank Balance | Percentage of 50-Litre nutrient tank (drawn down by pump, replenished via refill action). |

---

## 3. Data Integrity & Missing-Data Policy

1. **Zero Fabrication:** The system never invents missing outdoor observations, fake sensor history, or false connectivity states.
2. **Missing Data Preservation:** If an hourly record has missing temperature or humidity values, it is preserved as `null`. Interpolation across missing points returns `null` rather than generating artificial data. Missing sample counts and percentages are displayed in the metric drill-down panel.
3. **Traceable Categorization:** Every metric in the dashboard and drill-down panels displays an explicit origin badge:
   - `Historical outdoor`: Returned by documented weather provider.
   - `Simulated indoor`: Model output calculated by physical conservation equations.
   - `Derived`: Values computed from source data (min, max, mean, degree-hours).
   - `User override / Scenario input`: Controlled test values from the Scenario Lab.
   - `Unavailable`: Offline or unrecorded states.
4. **Client Caching:** Successful Open-Meteo API responses are cached in `localStorage` keyed by `haryana_weather_cache_v2_{locId}_{startDate}_{endDate}` with a 24-hour TTL. Cached data is explicitly tagged with `Cached historical data` and the exact retrieval timestamp.

---

## 4. Known Limitations

- **Reanalysis Grid Size:** ERA5-Land operates at a 9 km grid cell scale. Values reflect regional ambient weather, not hyper-local building surface microclimates or exact on-site weather station barometry.
- **Publication Lag:** Recent 2–5 days of reanalysis data are subject to processing publication delay; the app computes dates dynamically up to the latest verified publication window.
- **Carbon Filter Independence:** Standard activated carbon filters absorb VOCs/odors and add airflow resistance; they do not scrub inorganic gaseous carbon dioxide ($CO_2$).
