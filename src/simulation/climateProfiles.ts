import { Season } from './types';

export interface SeasonProfile {
  name: string;
  season: Season;
  description: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  peakHour: number; // 14:30 (peak solar insolation lag)
  troughHour: number; // 05:30 (pre-dawn minimum)
}

export const HARYANA_SEASON_PROFILES: Record<Season, SeasonProfile> = {
  summer: {
    name: 'Haryana Summer (May - June)',
    season: 'summer',
    description: 'Extreme dry heat with scorching loo winds; afternoon highs reaching 42–45°C.',
    tempMin: 28.0,
    tempMax: 44.5,
    humidityMin: 22.0,
    humidityMax: 42.0,
    peakHour: 14.5,
    troughHour: 5.5,
  },
  monsoon: {
    name: 'Haryana Monsoon (July - Aug)',
    season: 'monsoon',
    description: 'Hot, humid subtropical monsoon with high precipitation and heavy cloud cover.',
    tempMin: 26.5,
    tempMax: 36.0,
    humidityMin: 68.0,
    humidityMax: 92.0,
    peakHour: 14.5,
    troughHour: 5.5,
  },
  autumn: {
    name: 'Haryana Autumn (Oct - Nov)',
    season: 'autumn',
    description: 'Post-monsoon transition with clear skies, mild days, and cooling evenings.',
    tempMin: 16.0,
    tempMax: 31.0,
    humidityMin: 40.0,
    humidityMax: 65.0,
    peakHour: 14.5,
    troughHour: 5.5,
  },
  winter: {
    name: 'Haryana Winter (Dec - Jan)',
    season: 'winter',
    description: 'Chilly nights with dense radiation fog; overnight lows dropping to 5–6°C.',
    tempMin: 5.5,
    tempMax: 19.5,
    humidityMin: 52.0,
    humidityMax: 85.0,
    peakHour: 14.5,
    troughHour: 5.5,
  },
  spring: {
    name: 'Haryana Spring (Feb - March)',
    season: 'spring',
    description: 'Temperate, sunny transition season with moderate diurnal swings.',
    tempMin: 13.0,
    tempMax: 27.5,
    humidityMin: 38.0,
    humidityMax: 60.0,
    peakHour: 14.5,
    troughHour: 5.5,
  },
};

/**
 * Calculates deterministic outside temperature and relative humidity
 * based on Haryana climate profiles and time of day using an asymmetric
 * meteorological diurnal insolation curve (pre-dawn trough at 05:30, afternoon peak at 14:30).
 */
export function getOutsideClimate(
  season: Season,
  hour: number,
  minute: number = 0
): { outsideTemperature: number; outsideHumidity: number } {
  const profile = HARYANA_SEASON_PROFILES[season];
  const timeOfDay = hour + minute / 60;
  const tTrough = profile.troughHour; // 5.5
  const tPeak = profile.peakHour;     // 14.5

  let factor: number;
  if (timeOfDay >= tTrough && timeOfDay <= tPeak) {
    // Daytime heating (9 hours from 05:30 to 14:30)
    const phase = ((timeOfDay - tTrough) / (tPeak - tTrough)) * Math.PI;
    factor = (1 - Math.cos(phase)) / 2; // 0 at tTrough, 1 at tPeak
  } else {
    // Nocturnal cooling (15 hours from 14:30 to 05:30 next day)
    let elapsedSincePeak = timeOfDay - tPeak;
    if (elapsedSincePeak < 0) elapsedSincePeak += 24;
    const coolingDuration = 24 - (tPeak - tTrough); // 15 hours
    const phase = (elapsedSincePeak / coolingDuration) * Math.PI;
    factor = (1 + Math.cos(phase)) / 2; // 1 at tPeak, 0 at tTrough
  }

  const rawTemp = profile.tempMin + (profile.tempMax - profile.tempMin) * factor;

  // Humidity is inversely related to temperature
  const rawHum = profile.humidityMax - (profile.humidityMax - profile.humidityMin) * factor;

  return {
    outsideTemperature: Math.round(rawTemp * 10) / 10,
    outsideHumidity: Math.round(rawHum * 10) / 10,
  };
}
