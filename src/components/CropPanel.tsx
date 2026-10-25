import React, { useState, useMemo } from 'react';
import { Sprout, ChevronDown, ChevronUp, Check, AlertTriangle, HelpCircle, Copy, ExternalLink } from 'lucide-react';
import {
  CROP_PROFILES,
  CropProfile,
  GrowthStage,
  getStageProfile,
  checkTargetRange,
  cloneCropProfile,
} from '../crops/cropProfiles';
import { SensorState } from '../simulation/types';

interface CropPanelProps {
  sensors: SensorState;
}

const STAGE_LABELS: Record<GrowthStage, string> = {
  germination_seedling: 'Germination & Seedling',
  vegetative: 'Vegetative Growth',
  flowering_fruiting: 'Flowering & Fruiting',
  harvest: 'Harvest',
};

function RangeBadge({ status }: { status: 'in_range' | 'below' | 'above' | 'unknown' }) {
  const colors = {
    in_range: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', icon: <Check size={12} /> },
    below: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', icon: <AlertTriangle size={12} /> },
    above: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', icon: <AlertTriangle size={12} /> },
    unknown: { bg: 'rgba(100, 116, 139, 0.15)', border: '#64748b', text: '#94a3b8', icon: <HelpCircle size={12} /> },
  };
  const c = colors[status];
  const label = { in_range: 'In Range', below: 'Below Target', above: 'Above Target', unknown: 'Unknown' }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '10px', fontWeight: 700,
      padding: '2px 6px', borderRadius: '4px',
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>
      {c.icon} {label}
    </span>
  );
}

export const CropPanel: React.FC<CropPanelProps> = ({ sensors }) => {
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<GrowthStage>('vegetative');
  const [expandedSources, setExpandedSources] = useState(false);
  const [userProfiles, setUserProfiles] = useState<CropProfile[]>([]);

  const allProfiles = useMemo(() => [...CROP_PROFILES, ...userProfiles], [userProfiles]);
  const selectedCrop = allProfiles.find((c) => c.id === selectedCropId) || null;
  const stageProfile = selectedCrop ? getStageProfile(selectedCrop, selectedStage) : null;

  const handleClone = () => {
    if (!selectedCrop) return;
    const newId = `${selectedCrop.id}_custom_${Date.now()}`;
    const cloned = cloneCropProfile(selectedCrop, newId);
    cloned.commonName = `${cloned.commonName} (Custom)`;
    setUserProfiles((prev) => [...prev, cloned]);
    setSelectedCropId(newId);
  };

  // Check current conditions vs targets
  const comparisons = useMemo(() => {
    if (!stageProfile) return null;
    return {
      dayTemp: checkTargetRange(sensors.temperature, stageProfile.dayTempMinC, stageProfile.dayTempMaxC),
      rh: checkTargetRange(sensors.humidity, stageProfile.rhMinPct, stageProfile.rhMaxPct),
      ppfd: stageProfile.ppfdMin !== null || stageProfile.ppfdMax !== null
        ? checkTargetRange(
            sensors.lightLevel > 0 ? sensors.lightLevel / 54 : 0, // rough lux→PPFD for white LED
            stageProfile.ppfdMin,
            stageProfile.ppfdMax,
          )
        : null,
    };
  }, [sensors, stageProfile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Sprout size={20} style={{ color: '#10b981' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
          Crops &amp; Growing Plan
        </h2>
      </div>

      {/* Crop Selector */}
      <div className="glass-card" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(51, 65, 85, 0.6)', borderRadius: '12px' }}>
        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
          Select Crop
        </label>
        <select
          value={selectedCropId || ''}
          onChange={(e) => {
            setSelectedCropId(e.target.value || null);
            setSelectedStage('vegetative');
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '13px',
          }}
        >
          <option value="">— Choose a crop —</option>
          {allProfiles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.commonName} ({c.scientificName}){c.isUserConfigured ? ' [Custom]' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedCrop && (
        <>
          {/* Growth Stage Selector */}
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(51, 65, 85, 0.6)', borderRadius: '12px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Growth Stage
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {selectedCrop.stages.map((s) => (
                <button
                  key={s.stage}
                  onClick={() => setSelectedStage(s.stage)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selectedStage === s.stage ? '1px solid #10b981' : '1px solid #334155',
                    background: selectedStage === s.stage ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                    color: selectedStage === s.stage ? '#34d399' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {STAGE_LABELS[s.stage]}
                  {s.durationDays ? ` (~${s.durationDays}d)` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Grid: current vs target */}
          {stageProfile && comparisons && (
            <div className="glass-card" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(51, 65, 85, 0.6)', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
                Current Conditions vs. {selectedCrop.commonName} Targets ({STAGE_LABELS[selectedStage]})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>

                {/* Temperature */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Day Temperature</span>
                    <RangeBadge status={comparisons.dayTemp} />
                  </div>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    {sensors.temperature.toFixed(1)} °C
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    Target: {stageProfile.dayTempMinC ?? '?'}–{stageProfile.dayTempMaxC ?? '?'} °C
                  </div>
                </div>

                {/* Humidity */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Relative Humidity</span>
                    <RangeBadge status={comparisons.rh} />
                  </div>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    {sensors.humidity.toFixed(1)} %
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    Target: {stageProfile.rhMinPct ?? '?'}–{stageProfile.rhMaxPct ?? '?'} %
                    {stageProfile.rhCaveats && ` · ${stageProfile.rhCaveats}`}
                  </div>
                </div>

                {/* PPFD (estimated from lux) */}
                {comparisons.ppfd && (
                  <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>PPFD (est. from lux)</span>
                      <RangeBadge status={comparisons.ppfd} />
                    </div>
                    <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      {sensors.lightLevel > 0 ? Math.round(sensors.lightLevel / 54) : 0} µmol/m²/s
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Target: {stageProfile.ppfdMin ?? '?'}–{stageProfile.ppfdMax ?? '?'} µmol/m²/s
                    </div>
                  </div>
                )}

                {/* DLI */}
                {stageProfile.dliMin !== null && (
                  <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>DLI Target</span>
                    <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: '#eab308', marginTop: '4px' }}>
                      {stageProfile.dliMin}–{stageProfile.dliMax ?? '?'} mol/m²/day
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Photoperiod: {stageProfile.photoperiodHours ?? 'unknown'} h
                    </div>
                  </div>
                )}

              </div>

              {/* Guidance Notes */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stageProfile.co2Notes && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '6px' }}>
                    <strong style={{ color: '#a78bfa' }}>CO₂:</strong> {stageProfile.co2Notes}
                  </div>
                )}
                {stageProfile.wateringGuidance && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px' }}>
                    <strong style={{ color: '#38bdf8' }}>Watering:</strong> {stageProfile.wateringGuidance}
                  </div>
                )}
                {stageProfile.substrateNotes && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 10px', background: 'rgba(132, 204, 22, 0.1)', border: '1px solid rgba(132, 204, 22, 0.3)', borderRadius: '6px' }}>
                    <strong style={{ color: '#84cc16' }}>Substrate:</strong> {stageProfile.substrateNotes}
                  </div>
                )}
              </div>

              {/* Trade-off explanation */}
              {comparisons.dayTemp === 'above' && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#fbbf24', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px' }}>
                  <strong>Trade-off:</strong> Ventilation can cool the room when outdoor air is cooler, but will warm it when outdoor temp exceeds indoor temp. Ventilation also dilutes indoor CO₂ toward ambient (~420 ppm).
                </div>
              )}
            </div>
          )}

          {/* Clone / Customise */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleClone}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '6px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid #334155',
                color: '#cbd5e1', fontSize: '12px', cursor: 'pointer',
              }}
            >
              <Copy size={14} /> Clone &amp; Customise Profile
            </button>
          </div>

          {/* Sources */}
          <div className="glass-card" style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '10px' }}>
            <button
              onClick={() => setExpandedSources(!expandedSources)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              }}
            >
              <span>Reference Sources ({selectedCrop.sources.length})</span>
              {expandedSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expandedSources && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedCrop.sources.map((src, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 8px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <ExternalLink size={10} />
                      <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                        {src.title}
                      </a>
                    </div>
                    <div>{src.publisher} · Accessed {src.accessDate} · {src.sourceType.replace(/_/g, ' ')}</div>
                    {src.limitations && <div style={{ color: '#64748b', marginTop: '2px' }}>Limitations: {src.limitations}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General Notes */}
          {selectedCrop.generalNotes && (
            <div style={{ fontSize: '12px', color: '#94a3b8', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(51, 65, 85, 0.4)', borderRadius: '8px' }}>
              {selectedCrop.generalNotes}
            </div>
          )}
        </>
      )}

      {!selectedCrop && (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
          <Sprout size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px' }}>Select a crop above to view growth-stage targets, compare with current indoor conditions, and see source-backed growing guidance.</p>
        </div>
      )}
    </div>
  );
};
