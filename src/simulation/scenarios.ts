import { ScenarioPreset } from './types';

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'nominal_spring',
    name: 'Nominal Spring Day',
    season: 'spring',
    description: 'Optimal growing conditions in pleasant Haryana spring climate.',
    initialSensors: {
      temperature: 24.0,
      humidity: 52.0,
      co2: 650,
      substrateMoisture: 58.0,
      reservoirLevel: 85.0,
    },
    mode: 'automatic',
    notes: 'Balanced environmental equilibrium with normal light and ventilation cycles.',
  },
  {
    id: 'summer_heatwave',
    name: 'Haryana Summer Heatwave',
    season: 'summer',
    description: 'Blistering afternoon loo winds pushing outside temperatures past 44°C.',
    initialSensors: {
      temperature: 33.5, // triggers Priority 1 emergency (>32°C)
      humidity: 32.0,
      co2: 520,
      substrateMoisture: 42.0,
      reservoirLevel: 65.0,
    },
    mode: 'automatic',
    notes: 'Tests Priority 1 thermal emergency: AC activates, grow lights shut down, exhaust restricted to prevent superheated ambient influx.',
  },
  {
    id: 'winter_cold_night',
    name: 'Haryana Winter Cold Night',
    season: 'winter',
    description: 'Sub-6°C freezing fog conditions testing heating capacity.',
    initialSensors: {
      temperature: 13.8, // triggers Priority 1 emergency (<15°C)
      humidity: 62.0,
      co2: 700,
      substrateMoisture: 55.0,
      reservoirLevel: 90.0,
    },
    mode: 'automatic',
    notes: 'Tests severe cold emergency: Heater engaged, AC locked off, exhaust restricted to preserve heat.',
  },
  {
    id: 'high_humidity',
    name: 'Monsoon High Humidity Spike',
    season: 'monsoon',
    description: 'Persistent 88% ambient humidity during torrential July monsoon downpours.',
    initialSensors: {
      temperature: 27.2,
      humidity: 78.5, // triggers Priority 1 humidity emergency (>75%)
      co2: 580,
      substrateMoisture: 68.0,
      reservoirLevel: 75.0,
    },
    mode: 'automatic',
    notes: 'Tests humidity emergency: Dehumidifier forced ON, humidifier locked OFF, exhaust assists in moisture purge.',
  },
  {
    id: 'low_co2',
    name: 'Stagnant Low CO₂ Depletion',
    season: 'spring',
    description: 'Intense photosynthesis in sealed room driving CO₂ below threshold.',
    initialSensors: {
      temperature: 24.5,
      humidity: 54.0,
      co2: 385, // below 450 ppm threshold
      substrateMoisture: 52.0,
      reservoirLevel: 70.0,
    },
    mode: 'automatic',
    notes: 'Tests Priority 4 Fresh Air rules: Exhaust and inlet fans forced ON to ingest outside fresh air.',
  },
  {
    id: 'dry_substrate',
    name: 'Parched Rootzone Substrate',
    season: 'autumn',
    description: 'Rapid dryback dropping soil moisture below 43%.',
    initialSensors: {
      temperature: 25.0,
      humidity: 48.0,
      co2: 620,
      substrateMoisture: 38.0, // below 43% trigger
      reservoirLevel: 50.0,
    },
    mode: 'automatic',
    notes: 'Tests automated irrigation: Water pump activates until substrate moisture climbs above threshold.',
  },
  {
    id: 'empty_reservoir',
    name: 'Depleted Water Reservoir',
    season: 'summer',
    description: 'Irrigation reservoir has run dry while substrate needs water.',
    initialSensors: {
      temperature: 26.0,
      humidity: 46.0,
      co2: 600,
      substrateMoisture: 40.0, // needs water
      reservoirLevel: 0.0, // EMPTY!
    },
    mode: 'automatic',
    notes: 'Tests water pump dry-run safety interlock and warning alert.',
  },
];
