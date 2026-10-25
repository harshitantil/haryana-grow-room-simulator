import { describe, expect, it } from 'vitest';
import { fetchHistoricalWeatherData } from '../services/historicalWeatherService';

describe('Historical Weather Service Live API Verification', () => {
  it('successfully fetches and parses real historical data for Hisar from Open-Meteo', async () => {
    // 3 days range in 2024 to keep test quick and deterministic
    const dataset = await fetchHistoricalWeatherData('hisar', '2024-01-01', '2024-01-03', true);

    expect(dataset.records.length).toBe(72); // 3 days * 24 hours
    expect(dataset.provenance.locationName).toBe('Hisar');
    expect(dataset.provenance.productName).toContain('ERA5');

    const first = dataset.records[0];
    expect(first.timestamp).toBe('2024-01-01T00:00');
    expect(typeof first.temperatureC).toBe('number');
    expect(typeof first.relativeHumidityPct).toBe('number');
    expect(typeof first.solarRadiationWm2).toBe('number');
    expect(typeof first.windSpeedKmh).toBe('number');
  });
});
