import { X, Database, ExternalLink, AlertTriangle } from 'lucide-react';
import { DataProvenance } from '../services/historicalWeatherService';

interface DataProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  provenance: DataProvenance | null;
  error?: string | null;
  onRetry?: () => void;
}

export const DataProvenanceModal: React.FC<DataProvenanceModalProps> = ({
  isOpen,
  onClose,
  provenance,
  error,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Data Provenance and Source Metadata"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 220,
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: '#0f172a',
          border: '1px solid rgba(100, 116, 139, 0.6)',
          borderRadius: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              Historical Data Provenance & Traceability
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontWeight: 600 }}>
              <AlertTriangle size={18} />
              <span>Historical API Connection Failure</span>
            </div>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {error}
            </p>
            {onRetry && (
              <div>
                <button
                  onClick={onRetry}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f43f5e',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry Historical Fetch
                </button>
              </div>
            )}
          </div>
        ) : provenance ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Source card */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  {provenance.sourceName}
                </span>
                <a
                  href={provenance.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#38bdf8',
                    fontSize: '11px',
                    textDecoration: 'none',
                  }}
                >
                  <span>API Docs</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                <strong>Product:</strong> {provenance.productName}
              </p>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {provenance.attribution}
              </p>
            </div>

            {/* Grid of properties */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Selected Location</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  {provenance.locationName}, Haryana
                </div>
                <div className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
                  {provenance.latitude.toFixed(4)}°N, {provenance.longitude.toFixed(4)}°E (elev {provenance.elevationMeters}m)
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 42, 0.4)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Timezone & Range</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  {provenance.timezone}
                </div>
                <div className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
                  {provenance.actualStartDate} to {provenance.actualEndDate}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Records & Integrity</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>
                  {provenance.validRecordsCount.toLocaleString()} valid hourly records
                </div>
                <div style={{ fontSize: '11px', color: provenance.missingRecordsCount > 0 ? '#f59e0b' : '#64748b' }}>
                  Missing: {provenance.missingRecordsCount} ({provenance.missingDataPercentage}%)
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Data Freshness & Cache</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>
                  {provenance.isCached ? 'Cached Local Dataset' : 'Fresh API Response'}
                </div>
                <div className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
                  Retrieved: {new Date(provenance.retrievedAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Reanalysis disclaimer & Limitations */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(51, 65, 85, 0.4)',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.5,
            }}>
              <strong>Reanalysis Weather Limitations:</strong> ERA5-Land values are produced by combining historical weather station records with atmospheric physical models at a 9 km spatial grid. They represent regional outdoor ambient conditions, not hyper-local indoor microclimates or exact on-site weather station barometry.
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
            No provenance metadata available. Historical dataset has not yet been loaded.
          </div>
        )}

      </div>
    </div>
  );
};
