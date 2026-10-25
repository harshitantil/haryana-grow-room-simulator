/**
 * Historical Weather Service
 * Integrates with Open-Meteo Historical Weather API (ERA5 / ERA5-Land reanalysis).
 * Provides traceable hourly historical outdoor data for Haryana locations with
 * local caching, data validation, missing-data accounting, and timezone handling.
 */

export interface HaryanaLocation {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  description: string;
}

export const HARYANA_LOCATIONS: HaryanaLocation[] = [
  {
    id: 'hisar',
    name: 'Hisar',
    district: 'Hisar District, Western Haryana',
    latitude: 29.1492,
    longitude: 75.7217,
    elevationMeters: 215,
    description: 'Semi-arid agricultural zone known for extreme temperature swings (sub-5°C winter, 45°C+ summer).',
  },
  {
    id: 'rohtak',
    name: 'Rohtak',
    district: 'Rohtak District, Central Haryana',
    latitude: 28.8955,
    longitude: 76.6066,
    elevationMeters: 220,
    description: 'Major agricultural hub in the Indo-Gangetic alluvial plain.',
  },
  {
    id: 'gurugram',
    name: 'Gurugram',
    district: 'Gurugram District, Southern Haryana',
    latitude: 28.4595,
    longitude: 77.0266,
    elevationMeters: 217,
    description: 'NCR southern sector bordering the Aravalli range with intense urban-fringe microclimate.',
  },
  {
    id: 'karnal',
    name: 'Karnal',
    district: 'Karnal District, Northern Haryana',
    latitude: 29.6857,
    longitude: 76.9905,
    elevationMeters: 228,
    description: 'National agricultural research centre in the fertile rice-wheat belt of Haryana.',
  },
  {
    id: 'ambala',
    name: 'Ambala',
    district: 'Ambala District, Northern Haryana',
    latitude: 30.3782,
    longitude: 76.7767,
    elevationMeters: 264,
    description: 'Sub-Himalayan plains transitional zone with higher monsoon rainfall and colder winters.',
  },
];

export interface HourlyWeatherRecord {
  timestamp: string; // ISO 8601 string in Asia/Kolkata timezone
  timeEpochMs: number;
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  precipitationMm: number | null;
  solarRadiationWm2: number | null;
  windSpeedKmh: number | null;
  isInterpolated?: boolean;
}

export interface DataProvenance {
  sourceName: string;
  productName: string;
  sourceUrl: string;
  locationName: string;
  district: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  timezone: string;
  requestedStartDate: string;
  requestedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  retrievedAt: string;
  isCached: boolean;
  totalRecordsCount: number;
  validRecordsCount: number;
  missingRecordsCount: number;
  missingDataPercentage: number;
  license: string;
  attribution: string;
}

export interface HistoricalWeatherDataset {
  records: HourlyWeatherRecord[];
  provenance: DataProvenance;
}

const CACHE_PREFIX = 'haryana_weather_cache_v2_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Calculates a dynamic 24-month date range up to the latest available publication date.
 * Open-Meteo ERA5-Land reanalysis has a typical 2 to 5 day publication lag.
 */
export function getDefaultRolling24MonthsDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  // 5 days ago to respect reanalysis processing delay
  const end = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  // 24 months earlier
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 2);

  const formatIsoDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  };
}

/**
 * Fetches real historical weather data from Open-Meteo Archive API
 * with client-side caching, data integrity checks, and missing-data tracking.
 */
export async function fetchHistoricalWeatherData(
  locationId: string,
  startDate?: string,
  endDate?: string,
  forceRefresh = false
): Promise<HistoricalWeatherDataset> {
  const location = HARYANA_LOCATIONS.find((l) => l.id === locationId) || HARYANA_LOCATIONS[0];
  const { startDate: defaultStart, endDate: defaultEnd } = getDefaultRolling24MonthsDateRange();

  const queryStart = startDate || defaultStart;
  const queryEnd = endDate || defaultEnd;

  const cacheKey = `${CACHE_PREFIX}${location.id}_${queryStart}_${queryEnd}`;

  // Check cache unless forceRefresh
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached: HistoricalWeatherDataset = JSON.parse(cachedRaw);
        const retrievedTime = new Date(cached.provenance.retrievedAt).getTime();
        if (Date.now() - retrievedTime < CACHE_TTL_MS) {
          return {
            ...cached,
            provenance: {
              ...cached.provenance,
              isCached: true,
            },
          };
        }
      }
    } catch {
      // Ignore localStorage parse error and proceed to network fetch
    }
  }

  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', location.latitude.toString());
  url.searchParams.set('longitude', location.longitude.toString());
  url.searchParams.set('start_date', queryStart);
  url.searchParams.set('end_date', queryEnd);
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation,wind_speed_10m'
  );
  url.searchParams.set('timezone', 'Asia/Kolkata');

  if (import.meta.env?.DEV) {
    console.info(`[HistoricalWeatherService] Fetching Open-Meteo URL: ${url.toString()}`);
  }

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Network connection failure fetching historical weather from Open-Meteo: ${errorMsg}. Please verify internet access and click Retry.`
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errText = await response.text();
      try {
        const errJson = JSON.parse(errText);
        detail = errJson.reason || errText;
      } catch {
        detail = errText;
      }
    } catch {
      detail = response.statusText;
    }
    console.error(`[HistoricalWeatherService Error] URL: ${url.toString()} -> Status ${response.status}: ${detail}`);
    throw new Error(
      `Open-Meteo Historical API returned HTTP ${response.status} (${response.statusText}): ${detail}. Features dependent on historical outdoor series are temporarily unavailable.`
    );
  }

  const data = await response.json();

  if (!data.hourly || !Array.isArray(data.hourly.time)) {
    throw new Error(
      'Malformed weather data received from Open-Meteo: hourly time series array is missing or invalid.'
    );
  }

  const times: string[] = data.hourly.time;
  const temps: (number | null)[] = data.hourly.temperature_2m || [];
  const humidities: (number | null)[] = data.hourly.relative_humidity_2m || [];
  const precipitations: (number | null)[] = data.hourly.precipitation || [];
  const solarRadiations: (number | null)[] = data.hourly.shortwave_radiation || data.hourly.surface_solar_radiation || [];
  const windSpeeds: (number | null)[] = data.hourly.wind_speed_10m || [];

  const records: HourlyWeatherRecord[] = [];
  let missingCount = 0;

  for (let i = 0; i < times.length; i++) {
    const tStr = times[i];
    const epochMs = new Date(tStr + ':00+05:30').getTime();

    const temp = temps[i] !== undefined && temps[i] !== null ? temps[i] : null;
    const hum = humidities[i] !== undefined && humidities[i] !== null ? humidities[i] : null;
    const precip = precipitations[i] !== undefined && precipitations[i] !== null ? precipitations[i] : null;
    const solar = solarRadiations[i] !== undefined && solarRadiations[i] !== null ? solarRadiations[i] : null;
    const wind = windSpeeds[i] !== undefined && windSpeeds[i] !== null ? windSpeeds[i] : null;

    if (temp === null || hum === null) {
      missingCount++;
    }

    records.push({
      timestamp: tStr,
      timeEpochMs: isNaN(epochMs) ? i * 3600000 : epochMs,
      temperatureC: temp,
      relativeHumidityPct: hum,
      precipitationMm: precip,
      solarRadiationWm2: solar,
      windSpeedKmh: wind,
    });
  }

  if (records.length === 0) {
    throw new Error(`Zero weather records returned for ${location.name} in date range ${queryStart} to ${queryEnd}.`);
  }

  const actualStartDate = records[0].timestamp.split('T')[0];
  const actualEndDate = records[records.length - 1].timestamp.split('T')[0];
  const missingPct = Math.round((missingCount / records.length) * 1000) / 10;

  const dataset: HistoricalWeatherDataset = {
    records,
    provenance: {
      sourceName: 'Open-Meteo Historical Weather Archive API',
      productName: 'ERA5-Land reanalysis / Copernicus Climate Change Service',
      sourceUrl: 'https://open-meteo.com/en/docs/historical-weather-api',
      locationName: location.name,
      district: location.district,
      latitude: location.latitude,
      longitude: location.longitude,
      elevationMeters: location.elevationMeters,
      timezone: 'Asia/Kolkata',
      requestedStartDate: queryStart,
      requestedEndDate: queryEnd,
      actualStartDate,
      actualEndDate,
      retrievedAt: new Date().toISOString(),
      isCached: false,
      totalRecordsCount: records.length,
      validRecordsCount: records.length - missingCount,
      missingRecordsCount: missingCount,
      missingDataPercentage: missingPct,
      license: 'Open Database License (ODbL) / ECMWF Copernicus Terms',
      attribution: 'Contains modified Copernicus Climate Change Service information [2024]. Reanalysis weather product, not direct local station sensor.',
    },
  };

  // Cache to localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(dataset));
    } catch {
      // Storage quota exceeded or disabled; safe to continue
    }
  }

  return dataset;
}

/**
 * Linearly interpolates hourly historical weather data for any arbitrary minute timestamp.
 * If data is missing around the timestamp, returns null rather than fabricating numbers.
 */
export function interpolateWeatherAtEpoch(
  records: HourlyWeatherRecord[],
  targetEpochMs: number
): {
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  solarRadiationWm2: number | null;
  isExact: boolean;
} {
  if (records.length === 0) {
    return { temperatureC: null, relativeHumidityPct: null, solarRadiationWm2: null, isExact: false };
  }

  // If outside bounds, clamp to boundaries or return null
  if (targetEpochMs <= records[0].timeEpochMs) {
    const r = records[0];
    return {
      temperatureC: r.temperatureC,
      relativeHumidityPct: r.relativeHumidityPct,
      solarRadiationWm2: r.solarRadiationWm2,
      isExact: true,
    };
  }

  if (targetEpochMs >= records[records.length - 1].timeEpochMs) {
    const r = records[records.length - 1];
    return {
      temperatureC: r.temperatureC,
      relativeHumidityPct: r.relativeHumidityPct,
      solarRadiationWm2: r.solarRadiationWm2,
      isExact: true,
    };
  }

  // Binary search for surrounding records
  let low = 0;
  let high = records.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (records[mid].timeEpochMs === targetEpochMs) {
      const r = records[mid];
      return {
        temperatureC: r.temperatureC,
        relativeHumidityPct: r.relativeHumidityPct,
        solarRadiationWm2: r.solarRadiationWm2,
        isExact: true,
      };
    } else if (records[mid].timeEpochMs < targetEpochMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const prev = records[high];
  const next = records[low];

  if (!prev || !next) {
    return { temperatureC: null, relativeHumidityPct: null, solarRadiationWm2: null, isExact: false };
  }

  if (prev.temperatureC === null || next.temperatureC === null) {
    return { temperatureC: null, relativeHumidityPct: null, solarRadiationWm2: null, isExact: false };
  }

  const fraction = (targetEpochMs - prev.timeEpochMs) / (next.timeEpochMs - prev.timeEpochMs);

  const interpTemp = prev.temperatureC + fraction * (next.temperatureC - prev.temperatureC);
  const interpHum =
    prev.relativeHumidityPct !== null && next.relativeHumidityPct !== null
      ? prev.relativeHumidityPct + fraction * (next.relativeHumidityPct - prev.relativeHumidityPct)
      : null;
  const interpSolar =
    prev.solarRadiationWm2 !== null && next.solarRadiationWm2 !== null
      ? prev.solarRadiationWm2 + fraction * (next.solarRadiationWm2 - prev.solarRadiationWm2)
      : null;

  return {
    temperatureC: Math.round(interpTemp * 100) / 100,
    relativeHumidityPct: interpHum !== null ? Math.round(interpHum * 10) / 10 : null,
    solarRadiationWm2: interpSolar !== null ? Math.round(interpSolar * 10) / 10 : null,
    isExact: false,
  };
}
