import { describe, expect, it } from 'vitest';
import {
  getDefaultRolling24MonthsDateRange,
  HARYANA_LOCATIONS,
  HourlyWeatherRecord,
  interpolateWeatherAtEpoch,
} from '../services/historicalWeatherService';

describe('Historical Weather Service & Data Integrity', () => {
  it('contains documented Haryana locations with valid coordinates', () => {
    expect(HARYANA_LOCATIONS.length).toBeGreaterThanOrEqual(5);

    const hisar = HARYANA_LOCATIONS.find((l) => l.id === 'hisar');
    expect(hisar).toBeDefined();
    expect(hisar?.latitude).toBeCloseTo(29.1492, 3);
    expect(hisar?.longitude).toBeCloseTo(75.7217, 3);

    const rohtak = HARYANA_LOCATIONS.find((l) => l.id === 'rohtak');
    expect(rohtak).toBeDefined();

    const gurugram = HARYANA_LOCATIONS.find((l) => l.id === 'gurugram');
    expect(gurugram).toBeDefined();
  });

  it('computes rolling 24 months date range with ERA5 reanalysis publication delay', () => {
    const { startDate, endDate } = getDefaultRolling24MonthsDateRange();

    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const startEpoch = new Date(startDate).getTime();
    const endEpoch = new Date(endDate).getTime();
    const nowEpoch = Date.now();

    // End date must be in the past (to account for ERA5-Land publication lag)
    expect(endEpoch).toBeLessThan(nowEpoch);
    // Span should be approximately 2 years (730 days +/- 3 days)
    const diffDays = (endEpoch - startEpoch) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThanOrEqual(728);
    expect(diffDays).toBeLessThanOrEqual(733);
  });

  it('linearly interpolates outdoor weather between hourly records without fabricating missing data', () => {
    const records: HourlyWeatherRecord[] = [
      {
        timestamp: '2024-05-15T12:00:00+05:30',
        timeEpochMs: 1715754600000,
        temperatureC: 40.0,
        relativeHumidityPct: 30.0,
        precipitationMm: 0,
        solarRadiationWm2: 800,
        windSpeedKmh: 14,
      },
      {
        timestamp: '2024-05-15T13:00:00+05:30',
        timeEpochMs: 1715754600000 + 3600000, // +1 hour
        temperatureC: 42.0,
        relativeHumidityPct: 26.0,
        precipitationMm: 0,
        solarRadiationWm2: 850,
        windSpeedKmh: 16,
      },
    ];

    // Midpoint: 12:30 (halfway between 40°C and 42°C => 41°C)
    const midEpoch = 1715754600000 + 1800000;
    const interp = interpolateWeatherAtEpoch(records, midEpoch);

    expect(interp.temperatureC).toBe(41.0);
    expect(interp.relativeHumidityPct).toBe(28.0);
    expect(interp.solarRadiationWm2).toBe(825.0);
    expect(interp.isExact).toBe(false);
  });

  it('preserves gaps: returns null when surrounding hourly weather data is missing', () => {
    const recordsWithGap: HourlyWeatherRecord[] = [
      {
        timestamp: '2024-05-15T12:00:00+05:30',
        timeEpochMs: 1715754600000,
        temperatureC: 40.0,
        relativeHumidityPct: 30.0,
        precipitationMm: 0,
        solarRadiationWm2: 800,
        windSpeedKmh: 14,
      },
      {
        timestamp: '2024-05-15T13:00:00+05:30',
        timeEpochMs: 1715754600000 + 3600000,
        temperatureC: null, // MISSING
        relativeHumidityPct: null, // MISSING
        precipitationMm: null,
        solarRadiationWm2: null,
        windSpeedKmh: null,
      },
    ];

    const midEpoch = 1715754600000 + 1800000;
    const result = interpolateWeatherAtEpoch(recordsWithGap, midEpoch);

    // MUST NOT fabricate values for missing records!
    expect(result.temperatureC).toBeNull();
    expect(result.relativeHumidityPct).toBeNull();
  });
});
