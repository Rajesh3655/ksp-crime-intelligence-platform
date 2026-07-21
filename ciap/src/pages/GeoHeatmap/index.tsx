import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Filter, ZoomIn, ZoomOut, Crosshair, Info } from 'lucide-react';
import { DISTRICTS } from '../../data/mockData';

// Dynamic import for Leaflet (no SSR issues)
let L: any = null;

const getRiskColor = (score: number) => {
  if (score >= 65) return '#DC2626';
  if (score >= 50) return '#EA580C';
  if (score >= 40) return '#D97706';
  return '#16A34A';
};

const getRiskLabel = (score: number) => {
  if (score >= 65) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const GeoHeatmap: React.FC = () => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<typeof DISTRICTS[0] | null>(null);
  const [activeLayer, setActiveLayer] = useState<'density' | 'risk' | 'hotspot'>('risk');
  const [crimeFilter, setCrimeFilter] = useState('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    import('leaflet').then((leafletModule) => {
      L = leafletModule.default;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [14.5, 75.7],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark-themed tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ position: 'bottomright', prefix: 'KSP CIAP' }).addTo(map);

      // Add district markers
      DISTRICTS.forEach(district => {
        const color = getRiskColor(district.riskScore);
        const size = Math.max(24, district.riskScore / 3);

        const circleIcon = L.divIcon({
          html: `
            <div style="
              width:${size}px;height:${size}px;
              border-radius:50%;
              background:${color}28;
              border:2px solid ${color};
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;
              transition:all 0.2s;
            ">
              <div style="
                width:${size * 0.45}px;height:${size * 0.45}px;
                border-radius:50%;
                background:${color};
                opacity:0.9;
              "></div>
            </div>
          `,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([district.lat, district.lng], { icon: circleIcon })
          .addTo(map)
          .bindPopup(`
            <div style="background:var(--navy-900,#0F1629);color:var(--text-primary,#F1F5F9);border-radius:8px;min-width:200px;font-family:'IBM Plex Sans',sans-serif;">
              <div style="font-weight:700;font-size:14px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">${district.name}</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="color:#94A3B8;font-size:12px;">Risk Score</span>
                <strong style="color:${color}">${district.riskScore}/100</strong>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="color:#94A3B8;font-size:12px;">Incidents MTD</span>
                <strong style="font-size:12px;">${district.incidents.toLocaleString()}</strong>
              </div>
              <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:4px;margin-top:10px;">
                <div style="height:100%;width:${district.riskScore}%;background:${color};border-radius:4px;"></div>
              </div>
            </div>
          `, {
            className: 'ciap-popup',
            maxWidth: 240,
          });

        marker.on('click', () => setSelectedDistrict(district));
      });

      // Add a faint Karnataka boundary polygon (simplified)
      const karnatakaCenter = L.circle([14.5, 75.7], {
        radius: 380000,
        color: 'rgba(59,130,246,0.3)',
        fillColor: 'rgba(59,130,246,0.03)',
        fillOpacity: 1,
        weight: 1,
        dashArray: '6 4',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ height: 'calc(100vh - var(--topbar-height))', display: 'flex', overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Map Controls */}
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Layer Control */}
          <div className="card card-sm" style={{ padding: '12px 16px', minWidth: 200 }}>
            <div className="card-title mb-3">
              <div className="flex items-center gap-2"><Layers size={12} /> {t('heatmap_layers')}</div>
            </div>
            {(['density', 'risk', 'hotspot'] as const).map(layer => (
              <div
                key={layer}
                className="flex items-center gap-2"
                style={{ padding: '6px 0', cursor: 'pointer' }}
                onClick={() => setActiveLayer(layer)}
              >
                <div style={{
                  width: 14, height: 14,
                  border: `2px solid ${activeLayer === layer ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  borderRadius: 3,
                  background: activeLayer === layer ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {activeLayer === layer && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: 1 }} />}
                </div>
                <span className="text-caption text-secondary" style={{ textTransform: 'capitalize' }}>
                  {layer === 'density' ? t('heatmap_density') : layer === 'risk' ? t('heatmap_risk') : t('heatmap_hotspots')}
                </span>
              </div>
            ))}
            <div className="divider" style={{ margin: '8px 0' }} />
            {/* Crime Type Filter */}
            <div className="card-title mb-2">
              <div className="flex items-center gap-2"><Filter size={12} /> {t('heatmap_crime_type_filter')}</div>
            </div>
            <select className="select" style={{ width: '100%', height: 28, fontSize: 11 }} value={crimeFilter} onChange={e => setCrimeFilter(e.target.value)}>
              <option value="all">{t('common_all')}</option>
              <option value="theft">{t('crime_theft')}</option>
              <option value="assault">{t('crime_assault')}</option>
              <option value="robbery">{t('crime_robbery')}</option>
              <option value="cybercrime">{t('crime_cybercrime')}</option>
              <option value="murder">{t('crime_murder')}</option>
            </select>
          </div>

          {/* Risk Legend */}
          <div className="card card-sm" style={{ padding: '12px 16px', minWidth: 160 }}>
            <div className="card-title mb-2">Risk Level</div>
            {[{ label: 'Critical (65+)', color: '#DC2626' }, { label: 'High (50–64)', color: '#EA580C' }, { label: 'Medium (40–49)', color: '#D97706' }, { label: 'Low (<40)', color: '#16A34A' }].map(l => (
              <div key={l.label} className="flex items-center gap-2" style={{ marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                <span className="text-label" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="btn btn-secondary btn-icon" onClick={() => mapInstanceRef.current?.zoomIn()} aria-label="Zoom in"><ZoomIn size={15} /></button>
          <button className="btn btn-secondary btn-icon" onClick={() => mapInstanceRef.current?.zoomOut()} aria-label="Zoom out"><ZoomOut size={15} /></button>
          <button className="btn btn-secondary btn-icon" onClick={() => mapInstanceRef.current?.setView([14.5, 75.7], 7)} aria-label="Reset view"><Crosshair size={15} /></button>
        </div>

        {/* Page title overlay */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, pointerEvents: 'none',
        }}>
          <div className="card card-sm" style={{ padding: '8px 16px', textAlign: 'center' }}>
            <div className="text-caption text-muted">{t('heatmap_title')} — Karnataka State</div>
          </div>
        </div>

        {/* Leaflet Map */}
        <div ref={mapRef} style={{ width: '100%', height: '100%', background: 'var(--navy-950)' }} id="karnataka-map" />

        {/* Leaflet CSS */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

        {/* Custom popup styles */}
        <style>{`
          .leaflet-popup-content-wrapper {
            background: var(--navy-900) !important;
            border: 1px solid var(--border-default) !important;
            border-radius: 8px !important;
            box-shadow: var(--shadow-lg) !important;
          }
          .leaflet-popup-tip { background: var(--navy-900) !important; }
          .leaflet-popup-content { margin: 12px 14px !important; }
        `}</style>
      </div>

      {/* Side Panel — District Detail */}
      {selectedDistrict && (
        <div className="card" style={{ width: 300, margin: 16, flexShrink: 0, overflowY: 'auto', borderRadius: 'var(--radius-lg)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-h4" style={{ fontWeight: 700 }}>{selectedDistrict.name}</div>
              <div className="text-caption text-muted">{t('heatmap_district_detail')}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedDistrict(null)} aria-label="Close panel">✕</button>
          </div>

          {/* Risk Score */}
          <div className={`badge badge-${getRiskLabel(selectedDistrict.riskScore)}`} style={{ marginBottom: 16, fontSize: 13, padding: '6px 12px' }}>
            Risk Score: {selectedDistrict.riskScore}/100
          </div>

          <div className="progress-bar mb-4">
            <div className={`progress-fill ${getRiskLabel(selectedDistrict.riskScore)}`} style={{ width: `${selectedDistrict.riskScore}%` }} />
          </div>

          <div className="divider" />

          {/* Stats */}
          {[
            { label: 'Incidents MTD', value: selectedDistrict.incidents.toLocaleString() },
            { label: 'Coordinates', value: `${selectedDistrict.lat.toFixed(4)}°N, ${selectedDistrict.lng.toFixed(4)}°E` },
            { label: 'Risk Level', value: getRiskLabel(selectedDistrict.riskScore).toUpperCase() },
          ].map(s => (
            <div key={s.label} className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-caption text-muted">{s.label}</span>
              <span className="text-caption" style={{ fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}

          <div className="divider" />
          <button className="btn btn-primary w-full" style={{ marginTop: 8 }}>
            View Full Report
          </button>
        </div>
      )}
    </div>
  );
};

export default GeoHeatmap;
