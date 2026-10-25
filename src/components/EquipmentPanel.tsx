import React from 'react';
import {
  Flame,
  Snowflake,
  Fan,
  Droplets,
  CloudRain,
  Sun,
  ShieldCheck,
  RefreshCw,
  Power,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { EquipmentId, EquipmentState, SimulationMode } from '../simulation/types';

interface EquipmentPanelProps {
  equipment: EquipmentState;
  manualEquipment: EquipmentState;
  mode: SimulationMode;
  toggleEquipment: (id: EquipmentId) => void;
  refillReservoir: () => void;
  reservoirLevel: number;
  interlocksTriggered: string[];
}

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipment,
  manualEquipment,
  mode,
  toggleEquipment,
  refillReservoir,
  reservoirLevel,
  interlocksTriggered,
}) => {
  const activeEquipment = mode === 'automatic' ? equipment : manualEquipment;

  const devices: {
    id: EquipmentId;
    name: string;
    description: string;
    category: string;
    icon: React.ReactNode;
    activeColor: string;
    isAccessory?: boolean;
  }[] = [
    {
      id: 'heater',
      name: 'Electric Heater',
      description: '2000W ceramic core (Active < 18°C)',
      category: 'Thermal',
      icon: <Flame size={18} />,
      activeColor: '#f43f5e',
    },
    {
      id: 'ac',
      name: 'Air Conditioner',
      description: '12,000 BTU Inverter (Active > 27°C)',
      category: 'Thermal',
      icon: <Snowflake size={18} />,
      activeColor: '#06b6d4',
    },
    {
      id: 'exhaustFan',
      name: 'Exhaust Fan',
      description: '350 CFM inline blower for heat & humidity exhaust',
      category: 'Ventilation',
      icon: <Fan size={18} />,
      activeColor: '#10b981',
    },
    {
      id: 'inletFan',
      name: 'Inlet Fan',
      description: '250 CFM filtered positive intake blower',
      category: 'Ventilation',
      icon: <Fan size={18} />,
      activeColor: '#10b981',
    },
    {
      id: 'oscillatingFans',
      name: 'Oscillating Fans',
      description: 'Dual canopy circulation fans to prevent boundary layer stagnancy',
      category: 'Circulation',
      icon: <Fan size={18} />,
      activeColor: '#38bdf8',
    },
    {
      id: 'humidifier',
      name: 'Ultrasonic Humidifier',
      description: 'Cool ultrasonic mist generator (Active < 40% RH)',
      category: 'Humidity',
      icon: <Droplets size={18} />,
      activeColor: '#06b6d4',
    },
    {
      id: 'dehumidifier',
      name: 'Refrigerant Dehumidifier',
      description: 'Compressor condensation moisture extractor (Active > 60% RH)',
      category: 'Humidity',
      icon: <Droplets size={18} />,
      activeColor: '#f59e0b',
    },
    {
      id: 'waterPump',
      name: 'Submersible Water Pump',
      description: 'Substrate drip irrigation delivery pump (Active < 43% moisture)',
      category: 'Watering',
      icon: <CloudRain size={18} />,
      activeColor: '#3b82f6',
    },
    {
      id: 'growLights',
      name: 'LED Grow Lights',
      description: '600W full-spectrum horticultural LED fixture (Photoperiod schedule)',
      category: 'Lighting',
      icon: <Sun size={18} />,
      activeColor: '#eab308',
    },
    {
      id: 'carbonFilter',
      name: 'Activated Carbon Filter',
      description: 'Exhaust duct attachment; odor control & airflow resistance accessory',
      category: 'Accessory',
      icon: <ShieldCheck size={18} />,
      activeColor: '#10b981',
      isAccessory: true,
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      
      {/* Title & Mode Notice */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Power size={18} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Equipment Status & Manual Actuator Panel
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {mode === 'automatic'
              ? 'Automatic Supervisory Controller is actively determining equipment outputs.'
              : 'Manual Override Mode: Toggle individual equipment states directly below.'}
          </p>
        </div>

        {/* Refill Reservoir Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={refillReservoir}
            aria-label="Refill water reservoir to 100%"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              background: 'rgba(59, 130, 246, 0.18)',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} />
            Refill Reservoir (100%)
          </button>
        </div>
      </div>

      {/* Interlock Notices if any */}
      {interlocksTriggered.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Info size={16} />
          <span><strong>Safety Interlock Active:</strong> {interlocksTriggered.join(' • ')}</span>
        </div>
      )}

      {/* 10 Equipment Devices Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '12px',
      }}>
        {devices.map((device) => {
          const isOn = activeEquipment[device.id];
          const isPumpDryCutoff = device.id === 'waterPump' && reservoirLevel <= 0.05;

          return (
            <div
              key={device.id}
              style={{
                background: isOn ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isOn ? 'rgba(100, 116, 139, 0.7)' : 'rgba(51, 65, 85, 0.5)'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: isOn ? `${device.activeColor}22` : 'rgba(51, 65, 85, 0.4)',
                  color: isOn ? device.activeColor : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: isOn ? `0 0 12px ${device.activeColor}33` : 'none',
                }}>
                  {device.icon}
                </span>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                      {device.name}
                    </span>
                    {device.isAccessory && (
                      <span style={{ fontSize: '10px', background: 'rgba(51, 65, 85, 0.6)', color: '#94a3b8', padding: '1px 5px', borderRadius: '4px' }}>
                        Accessory
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', maxWidth: '210px' }}>
                    {isPumpDryCutoff ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>INTERLOCKED: Reservoir Empty</span>
                    ) : (
                      device.description
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Toggle Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: isOn ? device.activeColor : '#64748b',
                }}>
                  {isOn ? 'ON' : 'OFF'}
                </span>

                <button
                  onClick={() => toggleEquipment(device.id)}
                  disabled={isPumpDryCutoff && !isOn}
                  aria-label={`Toggle ${device.name}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: isPumpDryCutoff ? 'not-allowed' : 'pointer',
                    color: isOn ? device.activeColor : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  title={mode === 'automatic' ? 'Click to toggle (Switches control value)' : 'Toggle device ON/OFF'}
                >
                  {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
