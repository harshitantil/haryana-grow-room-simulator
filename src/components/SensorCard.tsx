import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sprout,
  Sun,
  Database,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { MetricType, SensorState, SimulationSettings } from '../simulation/types';

interface SensorCardProps {
  sensors: SensorState;
  settings: SimulationSettings;
  emergencyActive: boolean;
  onSelectMetric: (metric: MetricType) => void;
}

export const SensorCardGrid: React.FC<SensorCardProps> = ({ sensors, settings, onSelectMetric }) => {
  // 1. Temperature Status
  let tempStatus: 'nominal' | 'warning' | 'emergency' = 'nominal';
  let tempStatusText = 'Nominal Target Band';
  if (sensors.temperature < 15 || sensors.temperature > 32) {
    tempStatus = 'emergency';
    tempStatusText = sensors.temperature < 15 ? 'Critical Cold Emergency' : 'Critical Heat Emergency';
  } else if (sensors.temperature < settings.tempHeatingThreshold || sensors.temperature > settings.tempCoolingThreshold) {
    tempStatus = 'warning';
    tempStatusText = sensors.temperature < settings.tempHeatingThreshold ? 'Heating Required' : 'Cooling Required';
  }

  // 2. Humidity Status
  let humStatus: 'nominal' | 'warning' | 'emergency' = 'nominal';
  let humStatusText = 'Optimal Transpiration';
  if (sensors.humidity < 30 || sensors.humidity > 75) {
    humStatus = 'emergency';
    humStatusText = sensors.humidity < 30 ? 'Critical Arid Emergency' : 'Critical Moisture Emergency';
  } else if (sensors.humidity < settings.humidityLowThreshold || sensors.humidity > settings.humidityHighThreshold) {
    humStatus = 'warning';
    humStatusText = sensors.humidity < settings.humidityLowThreshold ? 'Humidification Active' : 'Dehumidification Active';
  }

  // 3. CO2 Status
  let co2Status: 'nominal' | 'warning' | 'emergency' = 'nominal';
  let co2StatusText = 'Photosynthetic Target';
  if (sensors.co2 < 350) {
    co2Status = 'emergency';
    co2StatusText = 'Severe CO₂ Stagnation';
  } else if (sensors.co2 < settings.co2LowThreshold) {
    co2Status = 'warning';
    co2StatusText = 'Fresh Air Exchange Required';
  }

  // 4. Substrate Moisture Status
  let soilStatus: 'nominal' | 'warning' | 'emergency' = 'nominal';
  let soilStatusText = 'Optimal Rootzone Hydration';
  if (sensors.substrateMoisture < 25) {
    soilStatus = 'emergency';
    soilStatusText = 'Critical Root Desiccation';
  } else if (sensors.substrateMoisture < settings.substrateDryThreshold) {
    soilStatus = 'warning';
    soilStatusText = 'Irrigation Triggered (<43%)';
  } else if (sensors.substrateMoisture >= settings.substrateWetThreshold) {
    soilStatus = 'nominal';
    soilStatusText = 'Field Capacity Reached (>70%)';
  }

  // 5. Light Status
  const lightStatusText = sensors.lightLevel > 1000 ? 'Active Photoperiod (48 klx)' : (sensors.lightLevel > 0 ? 'Ambient Infiltration' : 'Dark Period (0 lx)');

  // 6. Reservoir Status
  let resStatus: 'nominal' | 'warning' | 'emergency' = 'nominal';
  let resStatusText = 'Sufficient Water Volume';
  if (sensors.reservoirLevel <= 0.05) {
    resStatus = 'emergency';
    resStatusText = 'Tank Depleted (Pump Cutoff)';
  } else if (sensors.reservoirLevel < 20) {
    resStatus = 'warning';
    resStatusText = 'Low Tank Level (<20%)';
  }

  const getStatusColor = (status: 'nominal' | 'warning' | 'emergency') => {
    switch (status) {
      case 'nominal':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399', icon: <CheckCircle2 size={13} /> };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24', icon: <AlertTriangle size={13} /> };
      case 'emergency':
        return { bg: 'rgba(244, 63, 94, 0.18)', border: 'rgba(244, 63, 94, 0.5)', text: '#fb7185', icon: <AlertCircle size={13} /> };
    }
  };

  const cards: {
    id: MetricType;
    title: string;
    value: string;
    unit: string;
    icon: React.ReactNode;
    status: 'nominal' | 'warning' | 'emergency';
    statusText: string;
    targetBand: string;
    barPercent: number;
    barColor: string;
  }[] = [
    {
      id: 'temperature',
      title: 'Room Temperature',
      value: sensors.temperature.toFixed(1),
      unit: '°C',
      icon: <Thermometer size={20} style={{ color: '#f43f5e' }} />,
      status: tempStatus,
      statusText: tempStatusText,
      targetBand: `${settings.tempHeatingThreshold}°C – ${settings.tempCoolingThreshold}°C`,
      barPercent: Math.min(100, Math.max(0, ((sensors.temperature - 10) / (45 - 10)) * 100)),
      barColor: sensors.temperature > 27 ? '#f43f5e' : (sensors.temperature < 18 ? '#38bdf8' : '#10b981'),
    },
    {
      id: 'humidity',
      title: 'Relative Humidity',
      value: sensors.humidity.toFixed(1),
      unit: '% RH',
      icon: <Droplets size={20} style={{ color: '#06b6d4' }} />,
      status: humStatus,
      statusText: humStatusText,
      targetBand: `${settings.humidityLowThreshold}% – ${settings.humidityHighThreshold}% RH`,
      barPercent: Math.min(100, Math.max(0, sensors.humidity)),
      barColor: sensors.humidity > 60 ? '#38bdf8' : (sensors.humidity < 40 ? '#f59e0b' : '#10b981'),
    },
    {
      id: 'co2',
      title: 'Carbon Dioxide (CO₂)',
      value: Math.round(sensors.co2).toString(),
      unit: 'ppm',
      icon: <Wind size={20} style={{ color: '#10b981' }} />,
      status: co2Status,
      statusText: co2StatusText,
      targetBand: `≥ ${settings.co2LowThreshold} ppm (Target ${settings.targetCo2})`,
      barPercent: Math.min(100, Math.max(0, (sensors.co2 / 1600) * 100)),
      barColor: sensors.co2 < 450 ? '#f59e0b' : '#10b981',
    },
    {
      id: 'substrateMoisture',
      title: 'Substrate Moisture',
      value: sensors.substrateMoisture.toFixed(1),
      unit: '%',
      icon: <Sprout size={20} style={{ color: '#84cc16' }} />,
      status: soilStatus,
      statusText: soilStatusText,
      targetBand: `${settings.substrateDryThreshold}% Trigger – ${settings.substrateWetThreshold}% Cutoff`,
      barPercent: Math.min(100, Math.max(0, sensors.substrateMoisture)),
      barColor: sensors.substrateMoisture < 43 ? '#f59e0b' : '#10b981',
    },
    {
      id: 'lightLevel',
      title: 'Light Intensity Sensor',
      value: sensors.lightLevel.toLocaleString(),
      unit: 'lux',
      icon: <Sun size={20} style={{ color: '#eab308' }} />,
      status: 'nominal',
      statusText: lightStatusText,
      targetBand: `Photoperiod (${settings.dayStartHour}:00 – ${settings.dayEndHour}:00)`,
      barPercent: Math.min(100, Math.max(0, (sensors.lightLevel / 50000) * 100)),
      barColor: sensors.lightLevel > 0 ? '#eab308' : '#64748b',
    },
    {
      id: 'reservoirLevel',
      title: 'Water Reservoir Tank',
      value: sensors.reservoirLevel.toFixed(1),
      unit: '%',
      icon: <Database size={20} style={{ color: '#3b82f6' }} />,
      status: resStatus,
      statusText: resStatusText,
      targetBand: 'Minimum > 10% (Auto Cutoff @ 0%)',
      barPercent: Math.min(100, Math.max(0, sensors.reservoirLevel)),
      barColor: sensors.reservoirLevel <= 0.05 ? '#f43f5e' : (sensors.reservoirLevel < 20 ? '#f59e0b' : '#3b82f6'),
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
      marginBottom: '20px',
    }}>
      {cards.map((c) => {
        const statusStyle = getStatusColor(c.status);
        return (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectMetric(c.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectMetric(c.id);
              }
            }}
            className={`glass-card ${c.status === 'emergency' ? 'emergency-glow' : ''}`}
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title="Click to view detailed time-series, statistics, physical fluxes, and CSV export"
          >
            {/* Top Bar: Title & Simulated Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {c.icon}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>{c.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  background: 'rgba(51, 65, 85, 0.45)',
                  color: '#94a3b8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}>
                  SIMULATED
                </span>
                <ExternalLink size={12} style={{ color: '#64748b' }} />
              </div>
            </div>

            {/* Middle: Big Value with unit */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '8px 0' }}>
              <span className="mono" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: '#f8fafc' }}>
                {c.value}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8' }}>
                {c.unit}
              </span>
            </div>

            {/* Gauge bar */}
            <div style={{ width: '100%', height: '5px', background: 'rgba(51, 65, 85, 0.5)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
              <div
                style={{
                  width: `${c.barPercent}%`,
                  height: '100%',
                  background: c.barColor,
                  transition: 'width 0.4s ease, background 0.3s ease',
                  borderRadius: '3px',
                }}
              />
            </div>

            {/* Bottom: Status Pill & Range */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: statusStyle.bg,
                border: `1px solid ${statusStyle.border}`,
                color: statusStyle.text,
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {statusStyle.icon}
                <span>{c.statusText}</span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                {c.targetBand}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
