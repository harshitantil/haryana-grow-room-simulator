import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Download,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DataCategory,
  HistoryPoint,
  MetricType,
  SensorState,
  SimulationSourceMode,
} from '../simulation/types';
import { DataProvenance, HourlyWeatherRecord } from '../services/historicalWeatherService';
import { PhysicalFluxes } from '../simulation/physicsModel';

interface SensorDetailModalProps {
  metric: MetricType | null;
  isOpen: boolean;
  onClose: () => void;
  currentSensors: SensorState;
  history: HistoryPoint[];
  historicalOutdoorRecords: HourlyWeatherRecord[];
  latestFluxes?: PhysicalFluxes;
  sourceMode: SimulationSourceMode;
  locationName: string;
  provenance?: DataProvenance | null;
  isLoadingWeather?: boolean;
  weatherError?: string | null;
  onRefreshWeather?: () => void;
}

type TimeRangeFilter = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

// React Error Boundary class to catch any rendering errors inside the modal
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ModalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SensorDetailModal caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', color: '#f8fafc' }}>
          <h3 style={{ fontSize: '18px', color: '#f43f5e', marginBottom: '8px' }}>
            Telemetry Display Error
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            An unexpected error occurred while rendering this sensor chart:{' '}
            <span style={{ color: '#fca5a5' }}>{this.state.error?.message || 'Unknown error'}</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Retry Render
            </button>
            <button
              onClick={this.props.onClose}
              style={{
                background: '#334155',
                color: '#cbd5e1',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Close Dialog
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SensorDetailModal: React.FC<SensorDetailModalProps> = ({
  metric,
  isOpen,
  onClose,
  currentSensors,
  history,
  historicalOutdoorRecords,
  latestFluxes,
  sourceMode,
  locationName,
  provenance,
  isLoadingWeather = false,
  weatherError = null,
  onRefreshWeather,
}) => {
  // Early return BEFORE any hooks to maintain consistent hook order
  if (!isOpen || !metric) return null;

  const [rangeFilter, setRangeFilter] = useState<TimeRangeFilter>('24h');
  const [tablePage, setTablePage] = useState(0);
  const rowsPerPage = 10;

  // Keyboard navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Metadata per metric with robust fallback
  const metricMetaLookup: Record<string, {
    name: string;
    unit: string;
    currentValue: string;
    category: DataCategory;
    badgeText: string;
    badgeColor: string;
    description: string;
  }> = {
    temperature: {
      name: 'Room Air Temperature',
      unit: '°C',
      currentValue: (currentSensors?.temperature ?? 24).toFixed(1),
      category: 'simulated_indoor',
      badgeText: 'Simulated Indoor Output',
      badgeColor: '#10b981',
      description: 'Lumped thermal model combining envelope heat loss, 600W grow lights, AC cooling, heater, and ventilation heat exchange.',
    },
    humidity: {
      name: 'Relative Humidity',
      unit: '% RH',
      currentValue: (currentSensors?.humidity ?? 60).toFixed(1),
      category: 'simulated_indoor',
      badgeText: 'Simulated Indoor Output',
      badgeColor: '#06b6d4',
      description: 'Derived psychrometrically from indoor water-vapour mass (g) and temperature. Accounts for plant transpiration, ultrasonic mist, dehumidifier extraction, and air exchange.',
    },
    co2: {
      name: 'Carbon Dioxide (CO₂)',
      unit: 'ppm',
      currentValue: Math.round(currentSensors?.co2 ?? 420).toString(),
      category: 'simulated_indoor',
      badgeText: 'Simulated Indoor Output',
      badgeColor: '#8b5cf6',
      description: 'Mass balance accounting for plant photosynthetic uptake under lights, night respiration, and fresh-air dilution via exhaust and inlet blowers. (Carbon filter does not scrub CO₂).',
    },
    substrateMoisture: {
      name: 'Substrate Moisture Index',
      unit: '%',
      currentValue: (currentSensors?.substrateMoisture ?? 50).toFixed(1),
      category: 'simulated_indoor',
      badgeText: 'Simulated Indoor Output',
      badgeColor: '#84cc16',
      description: 'Hydration index across 4 plant rootzone beds. Hydrated by water pump drip irrigation; dried by root uptake, canopy transpiration, and airflow evaporation.',
    },
    lightLevel: {
      name: 'Light Intensity Sensor',
      unit: 'lux',
      currentValue: (currentSensors?.lightLevel ?? 0).toLocaleString(),
      category: 'simulated_indoor',
      badgeText: 'Simulated Indoor Output',
      badgeColor: '#eab308',
      description: 'Photoperiod lighting model based on 600W LED array state (48,000 lux) and ambient windowless leakage (250 lux daytime, 0 lux night).',
    },
    reservoirLevel: {
      name: 'Water Reservoir Level',
      unit: '%',
      currentValue: (currentSensors?.reservoirLevel ?? 100).toFixed(1),
      category: 'simulated_indoor',
      badgeText: 'Simulated Indoor Output',
      badgeColor: '#3b82f6',
      description: 'Volume level of 50-Litre nutrient tank. Drawn down during irrigation pump cycles; replenishable via the Refill Reservoir action.',
    },
    outsideTemperature: {
      name: 'Outdoor Ambient Temperature',
      unit: '°C',
      currentValue: (currentSensors?.outsideTemperature ?? 30).toFixed(1),
      category: sourceMode === 'historical_replay' ? 'historical_outdoor' : 'user_override',
      badgeText: sourceMode === 'historical_replay' ? 'Historical Outdoor Data (ERA5-Land)' : 'Scenario / Synthetic Input',
      badgeColor: sourceMode === 'historical_replay' ? '#38bdf8' : '#f59e0b',
      description: sourceMode === 'historical_replay'
        ? `Hourly reanalysis observation from Open-Meteo ERA5-Land for ${locationName}, Haryana (Asia/Kolkata timezone).`
        : 'Synthetic meteorological diurnal scenario input for Haryana.',
    },
    outsideHumidity: {
      name: 'Outdoor Ambient Humidity',
      unit: '% RH',
      currentValue: (currentSensors?.outsideHumidity ?? 50).toFixed(1),
      category: sourceMode === 'historical_replay' ? 'historical_outdoor' : 'user_override',
      badgeText: sourceMode === 'historical_replay' ? 'Historical Outdoor Data (ERA5-Land)' : 'Scenario / Synthetic Input',
      badgeColor: sourceMode === 'historical_replay' ? '#38bdf8' : '#f59e0b',
      description: 'External ambient relative humidity forcing indoor ventilation exchange and building envelope vapour diffusion.',
    },
  };

  const metricMeta = metricMetaLookup[metric] || {
    name: String(metric),
    unit: '',
    currentValue: '—',
    category: 'unavailable' as DataCategory,
    badgeText: 'Telemetry Metric',
    badgeColor: '#94a3b8',
    description: `Telemetry readings and physical simulation trend for ${metric}.`,
  };

  // Prepare chart series & statistics
  // If historical metric is requested and we have historicalOutdoorRecords, use them for large ranges!
  const isOutdoorMetric = metric === 'outsideTemperature' || metric === 'outsideHumidity';

  const chartData = useMemo(() => {
    if (isOutdoorMetric && historicalOutdoorRecords.length > 0) {
      // Filter by range
      let count = historicalOutdoorRecords.length;
      if (rangeFilter === '24h') count = Math.min(24, historicalOutdoorRecords.length);
      else if (rangeFilter === '7d') count = Math.min(24 * 7, historicalOutdoorRecords.length);
      else if (rangeFilter === '30d') count = Math.min(24 * 30, historicalOutdoorRecords.length);
      else if (rangeFilter === '90d') count = Math.min(24 * 90, historicalOutdoorRecords.length);
      else if (rangeFilter === '1y') count = Math.min(24 * 365, historicalOutdoorRecords.length);

      const sliced = historicalOutdoorRecords.slice(historicalOutdoorRecords.length - count);

      // Downsample if dataset is large (e.g. max 120 points for chart performance)
      const step = Math.max(1, Math.floor(sliced.length / 100));
      return sliced
        .filter((_, idx) => idx % step === 0)
        .map((r) => ({
          time: r.timestamp.replace('T', ' ').slice(5, 16),
          value: metric === 'outsideTemperature' ? r.temperatureC : r.relativeHumidityPct,
          timestamp: r.timestamp,
        }));
    }

    // Default to simulation rolling history
    return history.map((h) => {
      let val: number | null = 0;
      if (metric === 'temperature') val = h.temperature;
      else if (metric === 'humidity') val = h.humidity;
      else if (metric === 'co2') val = h.co2;
      else if (metric === 'substrateMoisture') val = h.substrateMoisture;
      else if (metric === 'reservoirLevel') val = h.reservoirLevel;
      else if (metric === 'outsideTemperature') val = h.outsideTemperature;
      else if (metric === 'outsideHumidity') val = h.outsideHumidity || null;
      else if (metric === 'lightLevel') val = h.growLights ? 48000 : 0;

      return {
        time: h.time,
        value: val,
        timestamp: h.time,
      };
    });
  }, [metric, isOutdoorMetric, historicalOutdoorRecords, rangeFilter, history]);

  // Compute Statistics
  const validValues = chartData.map((d) => d.value).filter((v): v is number => v !== null && !isNaN(v));
  const minVal = validValues.length > 0 ? Math.min(...validValues) : 0;
  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 0;
  const meanVal = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  const missingCount = chartData.length - validValues.length;
  const missingPct = chartData.length > 0 ? Math.round((missingCount / chartData.length) * 1000) / 10 : 0;

  // "Why did this value change?" breakdown with real calculated physical fluxes
  const fluxBreakdown = useMemo(() => {
    if (!latestFluxes) return null;

    if (metric === 'temperature') {
      return [
        { label: 'Building Envelope Heat Transfer', value: `${latestFluxes.heat.envelopeW > 0 ? '+' : ''}${latestFluxes.heat.envelopeW} W`, note: 'Wall/ceiling thermal conduction with outside' },
        { label: 'Grow Lights Radiation', value: `${latestFluxes.heat.growLightsW > 0 ? '+' : ''}${latestFluxes.heat.growLightsW} W`, note: '600W fixture sensible heat dissipation (75%)' },
        { label: 'Electric Space Heater', value: `${latestFluxes.heat.heaterW > 0 ? '+' : ''}${latestFluxes.heat.heaterW} W`, note: '2000W electric heating element' },
        { label: 'Air Conditioner Cooling', value: `${latestFluxes.heat.acCoolingW} W`, note: '12,000 BTU sensible cooling extraction' },
        { label: 'Ventilation Air Exchange', value: `${latestFluxes.heat.ventilationW > 0 ? '+' : ''}${latestFluxes.heat.ventilationW} W`, note: 'Heat carried by exhaust/inlet mass flow' },
        { label: 'Equipment & Fan Motors', value: `${latestFluxes.heat.fansW + latestFluxes.heat.dehumidifierW} W`, note: 'Compressor & circulation motor waste heat' },
        { label: 'Net Thermal Flux', value: `${latestFluxes.heat.netHeatW > 0 ? '+' : ''}${latestFluxes.heat.netHeatW} W`, note: 'Rate of temperature change across room thermal mass' },
      ];
    }
    if (metric === 'humidity') {
      return [
        { label: 'Ultrasonic Humidifier', value: `+${latestFluxes.moisture.humidifierGPerH} g/h`, note: 'Cool ultrasonic mist evaporation' },
        { label: 'Refrigerant Dehumidifier', value: `${latestFluxes.moisture.dehumidifierGPerH} g/h`, note: 'Moisture extracted via cooling coil' },
        { label: 'AC Coil Condensation', value: `${latestFluxes.moisture.acCondensationGPerH} g/h`, note: 'Byproduct moisture removal during cooling' },
        { label: 'Plant Canopy Transpiration', value: `+${latestFluxes.moisture.plantTranspirationGPerH} g/h`, note: 'Stomatal transpiration driven by light & substrate' },
        { label: 'Substrate Surface Evaporation', value: `+${latestFluxes.moisture.substrateEvaporationGPerH} g/h`, note: 'Evaporative moisture release from rootzone' },
        { label: 'Ventilation Moisture Exchange', value: `${latestFluxes.moisture.ventilationMoistureGPerH > 0 ? '+' : ''}${latestFluxes.moisture.ventilationMoistureGPerH} g/h`, note: 'Outdoor humidity infiltration / purge' },
        { label: 'Net Moisture Flux', value: `${latestFluxes.moisture.netMoistureGPerH > 0 ? '+' : ''}${latestFluxes.moisture.netMoistureGPerH} g/h`, note: 'Rate of change of room water-vapour mass' },
      ];
    }
    if (metric === 'co2') {
      return [
        { label: 'Photosynthetic Uptake', value: `${latestFluxes.co2.photosynthesisPpmPerMin} ppm/min`, note: 'CO₂ fixation under active grow lights' },
        { label: 'Nocturnal Respiration', value: `+${latestFluxes.co2.respirationPpmPerMin} ppm/min`, note: 'Dark-period plant CO₂ release' },
        { label: 'Ventilation Dilution', value: `${latestFluxes.co2.ventilationPpmPerMin > 0 ? '+' : ''}${latestFluxes.co2.ventilationPpmPerMin} ppm/min`, note: 'Dilution toward 420 ppm outdoor fresh air baseline' },
        { label: 'Net CO₂ Flux', value: `${latestFluxes.co2.netCo2PpmPerMin > 0 ? '+' : ''}${latestFluxes.co2.netCo2PpmPerMin} ppm/min`, note: 'Net atmospheric concentration change rate' },
      ];
    }
    if (metric === 'substrateMoisture') {
      return [
        { label: 'Pump Drip Irrigation', value: `+${latestFluxes.substrate.irrigationPctPerMin} %/min`, note: 'Hydration delivery when pump is active' },
        { label: 'Root Uptake & Evaporation', value: `${latestFluxes.substrate.dryingPctPerMin} %/min`, note: 'Transpiration uptake and bed surface evaporation' },
        { label: 'Net Substrate Delta', value: `${latestFluxes.substrate.netMoisturePctPerMin > 0 ? '+' : ''}${latestFluxes.substrate.netMoisturePctPerMin} %/min`, note: 'Rate of change in rootzone hydration' },
      ];
    }
    if (metric === 'reservoirLevel') {
      return [
        { label: 'Irrigation Pump Drawdown', value: `${latestFluxes.reservoir.pumpDrawdownPctPerMin} %/min`, note: 'Drawdown from 50-Litre nutrient tank during watering' },
      ];
    }
    return null;
  }, [metric, latestFluxes]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Timestamp', `${metricMeta.name} (${metricMeta.unit})`, 'Data_Category', 'Location', 'Source'];
    const rows = chartData.map((d) => [
      d.timestamp,
      d.value !== null ? d.value : 'NaN',
      metricMeta.category,
      locationName,
      provenance?.sourceName || 'Haryana Grow Room Physical Model',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${metric}_telemetry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination for data table
  const totalPages = Math.ceil(chartData.length / rowsPerPage);
  const currentTableRows = chartData.slice(tablePage * rowsPerPage, (tablePage + 1) * rowsPerPage);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${metricMeta.name} Details`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          background: '#0f172a',
          border: '1px solid rgba(100, 116, 139, 0.7)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <ModalErrorBoundary onClose={onClose}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                {metricMeta.name}
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: `${metricMeta.badgeColor}22`,
                border: `1px solid ${metricMeta.badgeColor}66`,
                color: metricMeta.badgeColor,
              }}>
                {metricMeta.badgeText}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {metricMeta.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleExportCsv}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#cbd5e1',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#94a3b8',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Current Value & Statistics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Current Value</span>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {metricMeta.currentValue} <span style={{ fontSize: '14px', color: '#94a3b8' }}>{metricMeta.unit}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Min / Max (Window)</span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
              {minVal.toFixed(1)} / {maxVal.toFixed(1)} {metricMeta.unit}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Mean / Average</span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 600, color: '#38bdf8', marginTop: '4px' }}>
              {meanVal.toFixed(1)} {metricMeta.unit}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Valid Samples / Missing</span>
            <div className="mono" style={{ fontSize: '16px', fontWeight: 600, color: missingCount > 0 ? '#f59e0b' : '#10b981', marginTop: '4px' }}>
              {validValues.length} / {missingCount} ({missingPct}%)
            </div>
          </div>
        </div>

        {/* Time-series Chart */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
              Time-Series Telemetry Trend ({metricMeta.name})
            </span>

            {/* Range Selectors */}
            {isOutdoorMetric && historicalOutdoorRecords.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(30, 41, 59, 0.8)', padding: '2px', borderRadius: '6px' }}>
                {(['24h', '7d', '30d', '90d', '1y', 'all'] as TimeRangeFilter[]).map((rf) => (
                  <button
                    key={rf}
                    onClick={() => setRangeFilter(rf)}
                    style={{
                      border: 'none',
                      background: rangeFilter === rf ? '#10b981' : 'transparent',
                      color: rangeFilter === rf ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {rf.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '100%', minHeight: 240, height: 240, position: 'relative' }}>
            {isOutdoorMetric && isLoadingWeather ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#38bdf8',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '3px solid rgba(56, 189, 248, 0.2)',
                  borderTopColor: '#38bdf8',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Loading ERA5-Land reanalysis historical weather data...
                </span>
              </div>
            ) : isOutdoorMetric && weatherError ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                textAlign: 'center',
                color: '#f87171',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Failed to Load Historical Weather Records</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '400px' }}>{weatherError}</span>
                {onRefreshWeather && (
                  <button
                    onClick={onRefreshWeather}
                    style={{
                      marginTop: '6px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            ) : chartData.length === 0 ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#64748b',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>No telemetry history recorded yet</span>
                <span style={{ fontSize: '11px' }}>Unpause or step the simulation to record sensor data points over time.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis unit={metricMeta.unit} stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={`${metricMeta.name} (${metricMeta.unit})`}
                    stroke={metricMeta.badgeColor}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* "Why did this value change?" Section with Real Fluxes */}
        {fluxBreakdown && (
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <HelpCircle size={16} style={{ color: '#10b981' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                Why did this value change? (Live Calculated Physical Fluxes)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              {fluxBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(51, 65, 85, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{item.label}</span>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: item.value.startsWith('-') ? '#f43f5e' : '#10b981' }}>
                      {item.value}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Provenance & Source Metadata */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          fontSize: '11px',
          color: '#94a3b8',
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
            Data Provenance & Traceability
          </div>
          <div>
            <strong>Source:</strong> {provenance?.sourceName || 'Haryana Indoor Grow Room Simulation Engine'} •{' '}
            <strong>Product:</strong> {provenance?.productName || 'Coupled Energy & Mass Balance (SI Units)'}
          </div>
          <div>
            <strong>Location:</strong> {locationName}, Haryana ({provenance?.latitude.toFixed(4) || '29.1492'}° N,{' '}
            {provenance?.longitude.toFixed(4) || '75.7217'}° E, elev: {provenance?.elevationMeters || 215} m) •{' '}
            <strong>Timezone:</strong> Asia/Kolkata
          </div>
        </div>

        {/* Paginated Data Table */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              Raw Data Records ({chartData.length} records)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                disabled={tablePage === 0}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: tablePage === 0 ? '#475569' : '#cbd5e1',
                  padding: '2px 6px',
                  cursor: tablePage === 0 ? 'default' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="mono" style={{ fontSize: '11px', color: '#94a3b8' }}>
                Page {tablePage + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setTablePage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={tablePage >= totalPages - 1}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: tablePage >= totalPages - 1 ? '#475569' : '#cbd5e1',
                  padding: '2px 6px',
                  cursor: tablePage >= totalPages - 1 ? 'default' : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '6px 8px' }}>Timestamp</th>
                <th style={{ padding: '6px 8px' }}>Value ({metricMeta.unit})</th>
                <th style={{ padding: '6px 8px' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {currentTableRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.3)', color: '#cbd5e1' }}>
                  <td className="mono" style={{ padding: '6px 8px' }}>{row.timestamp}</td>
                  <td className="mono" style={{ padding: '6px 8px', fontWeight: 600, color: row.value === null ? '#f59e0b' : '#f8fafc' }}>
                    {row.value !== null ? row.value : 'MISSING'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ fontSize: '10px', background: 'rgba(51, 65, 85, 0.5)', padding: '1px 5px', borderRadius: '4px' }}>
                      {metricMeta.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        </ModalErrorBoundary>
      </div>
    </div>
  );
};
