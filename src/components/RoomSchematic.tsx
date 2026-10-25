import React from 'react';
import {
  Fan,
  Flame,
  Snowflake,
  Droplets,
  CloudRain,
  Sun,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { EquipmentState, SensorState } from '../simulation/types';

interface RoomSchematicProps {
  equipment: EquipmentState;
  sensors: SensorState;
}

export const RoomSchematic: React.FC<RoomSchematicProps> = ({ equipment, sensors }) => {
  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      
      {/* Header with dimensions & active atmospheric ambience */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              10 ft × 10 ft Grow Room Schematic & Physical Topology
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Plan View (100 sq ft floor area • 800 cu ft volume • Scaled architectural layout)
          </p>
        </div>

        {/* Legend / Status badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '11px',
            background: equipment.growLights ? 'rgba(234, 179, 8, 0.15)' : 'rgba(71, 85, 105, 0.3)',
            color: equipment.growLights ? '#facc15' : '#94a3b8',
            border: `1px solid ${equipment.growLights ? 'rgba(234, 179, 8, 0.4)' : 'rgba(71, 85, 105, 0.4)'}`,
            padding: '3px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <Sun size={13} />
            <span>Overhead LEDs: {equipment.growLights ? 'ON (600W)' : 'OFF'}</span>
          </div>

          <div style={{
            fontSize: '11px',
            background: equipment.carbonFilter ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: equipment.carbonFilter ? '#34d399' : '#f87171',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <ShieldCheck size={13} />
            <span>Carbon Filter: {equipment.carbonFilter ? 'Equipped' : 'Bypassed'}</span>
          </div>
        </div>
      </div>

      {/* 2D Architectural Room Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        aspectRatio: '1 / 1',
        background: equipment.growLights
          ? 'radial-gradient(circle at center, rgba(234, 179, 8, 0.12) 0%, rgba(15, 23, 42, 0.95) 75%)'
          : 'radial-gradient(circle at center, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.98) 75%)',
        border: '3px solid #334155',
        borderRadius: '16px',
        boxShadow: equipment.growLights
          ? 'inset 0 0 40px rgba(234, 179, 8, 0.15), 0 0 25px rgba(0,0,0,0.5)'
          : 'inset 0 0 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        transition: 'all 0.5s ease',
      }}>

        {/* Dimension Marks */}
        {/* Top wall label: 10 ft North */}
        <div style={{
          position: 'absolute',
          top: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '0.1em',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '1px 8px',
          borderRadius: '4px',
          zIndex: 5,
        }}>
          NORTH WALL (10 FT)
        </div>

        {/* South wall label: 10 ft South */}
        <div style={{
          position: 'absolute',
          bottom: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '0.1em',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '1px 8px',
          borderRadius: '4px',
          zIndex: 5,
        }}>
          SOUTH WALL (10 FT)
        </div>

        {/* West wall label: 10 ft West */}
        <div style={{
          position: 'absolute',
          left: '6px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '0.1em',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '1px 8px',
          borderRadius: '4px',
          zIndex: 5,
        }}>
          WEST WALL (10 FT)
        </div>

        {/* East wall label: 10 ft East */}
        <div style={{
          position: 'absolute',
          right: '6px',
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '0.1em',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '1px 8px',
          borderRadius: '4px',
          zIndex: 5,
        }}>
          EAST WALL (10 FT)
        </div>

        {/* ============================================================ */}
        {/* NORTH WALL FIXTURES: AC & Exhaust Fan with Carbon Filter */}
        {/* ============================================================ */}
        {/* AC Unit */}
        <div style={{
          position: 'absolute',
          top: '28px',
          left: '20%',
          transform: 'translateX(-50%)',
          background: equipment.ac ? 'rgba(6, 182, 212, 0.25)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.ac ? '#06b6d4' : '#475569'}`,
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          boxShadow: equipment.ac ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Snowflake size={16} style={{ color: equipment.ac ? '#22d3ee' : '#94a3b8' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: equipment.ac ? '#22d3ee' : '#94a3b8' }}>
              AC UNIT
            </span>
          </div>
          <span style={{ fontSize: '9px', color: equipment.ac ? '#a5f3fc' : '#64748b' }}>
            {equipment.ac ? 'COOLING ACTIVE' : 'STANDBY'}
          </span>
          {equipment.ac && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '35px',
              background: 'linear-gradient(to bottom, rgba(6, 182, 212, 0.35), transparent)',
              borderRadius: '0 0 12px 12px',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Exhaust Fan + Carbon Filter Assembly */}
        <div style={{
          position: 'absolute',
          top: '28px',
          right: '20%',
          transform: 'translateX(50%)',
          background: equipment.exhaustFan ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.exhaustFan ? '#10b981' : '#475569'}`,
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          boxShadow: equipment.exhaustFan ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Fan size={16} className={equipment.exhaustFan ? 'fan-spinning' : ''} style={{ color: equipment.exhaustFan ? '#34d399' : '#94a3b8' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: equipment.exhaustFan ? '#34d399' : '#94a3b8' }}>
              EXHAUST + FILTER
            </span>
          </div>
          <span style={{ fontSize: '9px', color: equipment.exhaustFan ? '#6ee7b7' : '#64748b' }}>
            {equipment.exhaustFan ? (equipment.carbonFilter ? 'FILTERED EXHAUST' : 'UNFILTERED EXHAUST') : 'CLOSED'}
          </span>
        </div>

        {/* ============================================================ */}
        {/* SOUTH WALL FIXTURES: Fresh Air Inlet & Water Reservoir Tank */}
        {/* ============================================================ */}
        {/* Inlet Fan */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          left: '20%',
          transform: 'translateX(-50%)',
          background: equipment.inletFan ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.inletFan ? '#10b981' : '#475569'}`,
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          boxShadow: equipment.inletFan ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Fan size={16} className={equipment.inletFan ? 'fan-spinning' : ''} style={{ color: equipment.inletFan ? '#34d399' : '#94a3b8' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: equipment.inletFan ? '#34d399' : '#94a3b8' }}>
              INLET FAN
            </span>
          </div>
          <span style={{ fontSize: '9px', color: equipment.inletFan ? '#6ee7b7' : '#64748b' }}>
            {equipment.inletFan ? 'INTAKE ACTIVE' : 'CLOSED'}
          </span>
        </div>

        {/* Water Reservoir Tank & Submerged Pump */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          right: '20%',
          transform: 'translateX(50%)',
          background: equipment.waterPump ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.waterPump ? '#3b82f6' : (sensors.reservoirLevel <= 0.05 ? '#ef4444' : '#475569')}`,
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          boxShadow: equipment.waterPump ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CloudRain size={16} style={{ color: equipment.waterPump ? '#60a5fa' : (sensors.reservoirLevel <= 0.05 ? '#ef4444' : '#94a3b8') }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: equipment.waterPump ? '#60a5fa' : '#94a3b8' }}>
              RESERVOIR & PUMP
            </span>
          </div>
          <span style={{ fontSize: '9px', color: sensors.reservoirLevel <= 0.05 ? '#f87171' : (equipment.waterPump ? '#93c5fd' : '#64748b') }}>
            {sensors.reservoirLevel <= 0.05 ? 'EMPTY (0%)' : (equipment.waterPump ? `PUMPING (${sensors.reservoirLevel.toFixed(0)}%)` : `IDLE (${sensors.reservoirLevel.toFixed(0)}%)`)}
          </span>
        </div>

        {/* ============================================================ */}
        {/* WEST WALL FIXTURES: Humidifier & Dehumidifier */}
        {/* ============================================================ */}
        <div style={{
          position: 'absolute',
          left: '26px',
          top: '32%',
          transform: 'translateY(-50%)',
          background: equipment.humidifier ? 'rgba(6, 182, 212, 0.3)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.humidifier ? '#06b6d4' : '#475569'}`,
          borderRadius: '8px',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          zIndex: 10,
        }}>
          <Droplets size={16} style={{ color: equipment.humidifier ? '#22d3ee' : '#94a3b8' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: equipment.humidifier ? '#22d3ee' : '#94a3b8' }}>
            HUMIDIFIER
          </span>
          <span style={{ fontSize: '8px', color: equipment.humidifier ? '#a5f3fc' : '#64748b' }}>
            {equipment.humidifier ? 'MIST ON' : 'OFF'}
          </span>
        </div>

        <div style={{
          position: 'absolute',
          left: '26px',
          top: '68%',
          transform: 'translateY(-50%)',
          background: equipment.dehumidifier ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.dehumidifier ? '#f59e0b' : '#475569'}`,
          borderRadius: '8px',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          zIndex: 10,
        }}>
          <Droplets size={16} style={{ color: equipment.dehumidifier ? '#fbbf24' : '#94a3b8' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: equipment.dehumidifier ? '#fbbf24' : '#94a3b8' }}>
            DEHUMIDIFIER
          </span>
          <span style={{ fontSize: '8px', color: equipment.dehumidifier ? '#fde68a' : '#64748b' }}>
            {equipment.dehumidifier ? 'DRAIN ON' : 'OFF'}
          </span>
        </div>

        {/* ============================================================ */}
        {/* EAST WALL FIXTURE: Ceramic/Electric Heater */}
        {/* ============================================================ */}
        <div style={{
          position: 'absolute',
          right: '26px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: equipment.heater ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 41, 59, 0.8)',
          border: `2px solid ${equipment.heater ? '#ef4444' : '#475569'}`,
          borderRadius: '8px',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          boxShadow: equipment.heater ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 10,
        }}>
          <Flame size={18} style={{ color: equipment.heater ? '#f87171' : '#94a3b8' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: equipment.heater ? '#f87171' : '#94a3b8' }}>
            HEATER
          </span>
          <span style={{ fontSize: '9px', color: equipment.heater ? '#fca5a5' : '#64748b' }}>
            {equipment.heater ? 'HEATING (2kW)' : 'OFF'}
          </span>
          {equipment.heater && (
            <div style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '50px',
              background: 'linear-gradient(to left, rgba(239, 68, 68, 0.4), transparent)',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* ============================================================ */}
        {/* CORNER OSCILLATING FANS */}
        {/* ============================================================ */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Fan size={20} className={equipment.oscillatingFans ? 'fan-spinning' : ''} style={{ color: equipment.oscillatingFans ? '#38bdf8' : '#64748b' }} />
          <span style={{ fontSize: '8px', color: '#64748b' }}>Fan A</span>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          transform: 'translate(50%, 50%)',
          zIndex: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Fan size={20} className={equipment.oscillatingFans ? 'fan-spinning' : ''} style={{ color: equipment.oscillatingFans ? '#38bdf8' : '#64748b' }} />
          <span style={{ fontSize: '8px', color: '#64748b' }}>Fan B</span>
        </div>

        {/* ============================================================ */}
        {/* CENTER CANOPY: 4 Plant Trays under Grow Light Fixture */}
        {/* ============================================================ */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '52%',
          height: '52%',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '2px dashed rgba(100, 116, 139, 0.6)',
          borderRadius: '12px',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '10px',
          boxShadow: equipment.growLights
            ? '0 0 35px rgba(234, 179, 8, 0.35)'
            : 'none',
        }}>

          {/* Plant Pots 1 to 4 */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(51, 65, 85, 0.8)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '22px' }}>🌿</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', marginTop: '2px' }}>
                Bed #{i}
              </span>
              <span style={{ fontSize: '8px', color: '#10b981' }}>
                Moisture: {sensors.substrateMoisture.toFixed(0)}%
              </span>
              {/* Irrigation drop animation */}
              {equipment.waterPump && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  color: '#3b82f6',
                  fontSize: '10px',
                }}>
                  💧
                </div>
              )}
            </div>
          ))}

          {/* Overhead Light Overlay Banner */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: equipment.growLights ? 'rgba(234, 179, 8, 0.9)' : 'rgba(15, 23, 42, 0.9)',
            color: equipment.growLights ? '#422006' : '#94a3b8',
            border: '1px solid rgba(234, 179, 8, 0.5)',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: equipment.growLights ? '0 0 16px rgba(234, 179, 8, 0.8)' : 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            {equipment.growLights ? '☀️ 600W LED PHOTONS ON' : '🌙 PHOTOPERIOD OFF'}
          </div>

        </div>

      </div>

      {/* Footer Notes on Physical Layout */}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
        <span>Active Room Dimensions: 10 ft × 10 ft × 8 ft (22.65 m³ air volume)</span>
        <span>Carbon filter acts as exhaust air resistance accessory (does not absorb CO₂)</span>
      </div>

    </div>
  );
};
