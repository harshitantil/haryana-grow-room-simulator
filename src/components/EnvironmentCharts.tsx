import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { LineChart as ChartIcon } from 'lucide-react';
import { HistoryPoint, SimulationSettings } from '../simulation/types';

interface EnvironmentChartsProps {
  history: HistoryPoint[];
  settings: SimulationSettings;
}

export const EnvironmentCharts: React.FC<EnvironmentChartsProps> = ({
  history,
  settings,
}) => {
  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChartIcon size={18} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Historical Trend Telemetry & Multi-Variable Oscillations
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Rolling simulation window ({history.length} samples recorded • 1 sample/min)
          </p>
        </div>
      </div>

      {history.length < 2 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          color: '#64748b',
          fontSize: '13px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '8px',
          border: '1px dashed rgba(51, 65, 85, 0.5)',
        }}>
          Accumulating simulation data points... Trends will plot as simulation clock advances.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chart 1: Temperature (°C) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                Thermal Profile: Indoor Room vs Outside Ambient (°C)
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Target: {settings.tempHeatingThreshold}°C – {settings.tempCoolingThreshold}°C | Emergency: &lt;15°C or &gt;32°C
              </span>
            </div>

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 48]} unit="°C" stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  {/* Safe Target Band */}
                  <ReferenceArea
                    y1={settings.tempHeatingThreshold}
                    y2={settings.tempCoolingThreshold}
                    fill="#10b981"
                    fillOpacity={0.08}
                  />
                  {/* Emergency Critical Thresholds */}
                  <ReferenceLine y={15} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Low Emg (15°C)', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine y={32} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'High Emg (32°C)', fill: '#f43f5e', fontSize: 10 }} />

                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Room Temp (°C)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="outsideTemperature"
                    name="Outside Amb Temp (°C)"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Humidity (% RH) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                Humidity Dynamics: Indoor Room vs Outside Ambient (% RH)
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Target: {settings.humidityLowThreshold}% – {settings.humidityHighThreshold}% | Emergency: &lt;30% or &gt;75%
              </span>
            </div>

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[15, 95]} unit="%" stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  {/* Safe Target Band */}
                  <ReferenceArea
                    y1={settings.humidityLowThreshold}
                    y2={settings.humidityHighThreshold}
                    fill="#06b6d4"
                    fillOpacity={0.08}
                  />
                  <ReferenceLine y={30} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Dry Emg (30%)', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'High Emg (75%)', fill: '#f43f5e', fontSize: 10 }} />

                  <Line
                    type="monotone"
                    dataKey="humidity"
                    name="Room Humidity (% RH)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="outsideHumidity"
                    name="Outside Amb Humidity (%)"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: CO₂ (ppm) & Substrate Moisture (%) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                Bio-Gaseous CO₂ (ppm) & Rootzone Irrigation Telemetry (%)
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                CO₂ Threshold: {settings.co2LowThreshold} ppm | Substrate Trigger: {settings.substrateDryThreshold}%
              </span>
            </div>

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis yAxisId="co2" domain={[300, 1200]} unit="ppm" stroke="#64748b" fontSize={11} />
                  <YAxis yAxisId="moist" orientation="right" domain={[0, 100]} unit="%" stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <ReferenceLine yAxisId="co2" y={450} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '450 ppm trigger', fill: '#f59e0b', fontSize: 10 }} />

                  <Line
                    yAxisId="co2"
                    type="monotone"
                    dataKey="co2"
                    name="CO₂ Concentration (ppm)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="moist"
                    type="monotone"
                    dataKey="substrateMoisture"
                    name="Substrate Moisture (%)"
                    stroke="#84cc16"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="moist"
                    type="monotone"
                    dataKey="reservoirLevel"
                    name="Reservoir Tank (%)"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
