import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, User, Car, MapPin, Calendar, Filter, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import { LINK_NODES, LINK_EDGES } from '../../data/mockData';

const NODE_COLORS: Record<string, { fill: string; stroke: string }> = {
  suspect:  { fill: '#1F0E0E', stroke: '#DC2626' },
  victim:   { fill: '#0C1F14', stroke: '#16A34A' },
  vehicle:  { fill: '#0C1630', stroke: '#2563EB' },
  location: { fill: '#1F1A08', stroke: '#D97706' },
  event:    { fill: '#1F1208', stroke: '#EA580C' },
};

const NODE_ICONS: Record<string, React.FC<{ size: number }>> = {
  suspect:  ({ size }) => <User size={size} />,
  victim:   ({ size }) => <User size={size} />,
  vehicle:  ({ size }) => <Car size={size} />,
  location: ({ size }) => <MapPin size={size} />,
  event:    ({ size }) => <Calendar size={size} />,
};

const LinkAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<typeof LINK_NODES[0] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState(LINK_NODES.map(n => ({ ...n })));
  const [draggingNode, setDraggingNode] = useState<string | null>(null);

  const entityCounts = {
    suspects: LINK_NODES.filter(n => n.type === 'suspect').length,
    victims: LINK_NODES.filter(n => n.type === 'victim').length,
    vehicles: LINK_NODES.filter(n => n.type === 'vehicle').length,
    locations: LINK_NODES.filter(n => n.type === 'location').length,
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) setSelected(node as any);
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x, y } : n));
    } else if (dragging) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleSvgMouseUp = () => {
    setDragging(false);
    setDraggingNode(null);
  };

  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  return (
    <div style={{ height: 'calc(100vh - var(--topbar-height))', display: 'flex', overflow: 'hidden' }}>
      {/* Left Panel — Entity Explorer */}
      <div style={{ width: 240, background: 'var(--navy-900)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="text-h4" style={{ fontWeight: 700, marginBottom: 4 }}>{t('link_entity_explorer')}</div>
          <div className="search-bar" style={{ marginTop: 8, minWidth: 'unset' }}>
            <Search size={13} color="var(--text-muted)" />
            <input type="text" placeholder={t('link_search_entity')} />
          </div>
        </div>

        {/* Entity Type Counts */}
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { type: 'suspect', label: t('link_suspects'), count: entityCounts.suspects, color: '#DC2626' },
            { type: 'victim', label: t('link_victims'), count: entityCounts.victims, color: '#16A34A' },
            { type: 'vehicle', label: t('link_vehicles'), count: entityCounts.vehicles, color: '#2563EB' },
            { type: 'location', label: t('link_locations'), count: entityCounts.locations, color: '#D97706' },
          ].map(e => (
            <div key={e.type} className="flex items-center justify-between" style={{ padding: '6px 0' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color }} />
                <span className="text-caption text-secondary">{e.label}</span>
              </div>
              <span className="text-label text-muted">{e.count}</span>
            </div>
          ))}
        </div>

        {/* Node List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
          {nodes.map(node => {
            const colors = NODE_COLORS[node.type];
            return (
              <div
                key={node.id}
                className="nav-item"
                style={{ marginBottom: 2, border: selected?.id === node.id ? `1px solid ${colors.stroke}44` : undefined }}
                onClick={() => setSelected(node as any)}
              >
                <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-md)', background: colors.fill, border: `1.5px solid ${colors.stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {React.createElement(NODE_ICONS[node.type] || NODE_ICONS.suspect, { size: 11 })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-caption truncate" style={{ fontWeight: 500 }}>{node.label}</div>
                  <div className="text-label text-muted" style={{ textTransform: 'capitalize' }}>{node.type}</div>
                </div>
                <span className={`badge badge-${node.risk}`} style={{ padding: '1px 5px', fontSize: 9 }}>{node.risk}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-primary btn-sm w-full"><Plus size={12} /> {t('link_add_entity')}</button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--navy-950)', overflow: 'hidden' }}>
        {/* Graph controls */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 4, flexDirection: 'column' }}>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}><ZoomIn size={13} /></button>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}><ZoomOut size={13} /></button>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Filter size={13} /></button>
        </div>

        {/* Graph title */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 2 }}>{t('link_node_graph')}</div>
          <div className="text-caption text-muted">Case INC-2024-08741 · {nodes.length} entities · {LINK_EDGES.length} relationships</div>
        </div>

        {/* Zoom indicator */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10 }}>
          <span className="text-label text-muted">{Math.round(zoom * 100)}%</span>
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(100,116,139,0.5)" />
            </marker>
          </defs>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {LINK_EDGES.map((edge, i) => {
              const source = getNodeById(edge.source);
              const target = getNodeById(edge.target);
              if (!source || !target) return null;
              const mx = (source.x + target.x) / 2;
              const my = (source.y + target.y) / 2;
              return (
                <g key={i}>
                  <line
                    x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                    stroke="rgba(100,116,139,0.3)" strokeWidth={1.5}
                    markerEnd="url(#arrowhead)"
                  />
                  <text x={mx} y={my - 5} textAnchor="middle" fontSize={9} fill="rgba(148,163,184,0.6)" fontFamily="IBM Plex Sans">
                    {edge.label}
                  </text>
                </g>
              );
            })}
            {/* Nodes */}
            {nodes.map(node => {
              const colors = NODE_COLORS[node.type];
              const r = 22;
              const isSelected = selected?.id === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle r={r + 8} fill="none" stroke={colors.stroke} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
                  )}
                  {/* Node circle */}
                  <circle r={r} fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected ? 2.5 : 1.5} />
                  {/* Icon area */}
                  <text textAnchor="middle" dominantBaseline="central" fontSize={12} fill={colors.stroke} style={{ userSelect: 'none' }}>
                    {node.type === 'suspect' ? '👤' : node.type === 'victim' ? '🧑' : node.type === 'vehicle' ? '🚗' : node.type === 'location' ? '📍' : '⚡'}
                  </text>
                  {/* Label */}
                  <text y={r + 14} textAnchor="middle" fontSize={10} fill="rgba(241,245,249,0.85)" fontFamily="IBM Plex Sans" fontWeight={500} style={{ userSelect: 'none' }}>
                    {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                  </text>
                  {/* Risk dot */}
                  <circle cx={r - 5} cy={-(r - 5)} r={5}
                    fill={node.risk === 'critical' ? '#DC2626' : node.risk === 'high' ? '#EA580C' : node.risk === 'medium' ? '#D97706' : '#16A34A'}
                    stroke="var(--navy-950)" strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Right Panel — Entity Details */}
      {selected && (
        <div style={{ width: 280, background: 'var(--navy-900)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="text-h4" style={{ fontWeight: 700 }}>{t('link_details')}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
            {/* Entity header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: NODE_COLORS[selected.type].fill,
                border: `2px solid ${NODE_COLORS[selected.type].stroke}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {selected.type === 'suspect' ? '👤' : selected.type === 'victim' ? '🧑' : selected.type === 'vehicle' ? '🚗' : selected.type === 'location' ? '📍' : '⚡'}
              </div>
              <div>
                <div className="text-h4" style={{ fontWeight: 700 }}>{selected.label}</div>
                <div className="text-caption text-muted" style={{ textTransform: 'capitalize', marginTop: 2 }}>{selected.type}</div>
              </div>
            </div>

            <span className={`badge badge-${selected.risk}`} style={{ marginBottom: 16, fontSize: 12, padding: '4px 10px' }}>
              Risk: {selected.risk.charAt(0).toUpperCase() + selected.risk.slice(1)}
            </span>

            <div className="divider" />

            {/* Connections */}
            <div style={{ marginTop: 12 }}>
              <div className="card-title mb-3">{t('link_relationships')}</div>
              {LINK_EDGES
                .filter(e => e.source === selected.id || e.target === selected.id)
                .map((e, i) => {
                  const otherId = e.source === selected.id ? e.target : e.source;
                  const other = getNodeById(otherId);
                  const isSource = e.source === selected.id;
                  return (
                    <div key={i} className="flex items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span className="text-caption text-muted">{isSource ? '→' : '←'}</span>
                      <div style={{ flex: 1 }}>
                        <div className="text-caption" style={{ fontWeight: 600 }}>{other?.label}</div>
                        <div className="text-label text-muted">{e.label}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: NODE_COLORS[other?.type || 'suspect'].stroke, flexShrink: 0 }} />
                    </div>
                  );
                })}
            </div>

            {/* Timeline */}
            <div style={{ marginTop: 16 }}>
              <div className="card-title mb-3">{t('link_timeline')}</div>
              {[
                { event: 'First seen', date: '12 Jun 2024', desc: 'CCTV footage at Whitefield ATM' },
                { event: 'Incident', date: '14 Jun 2024', desc: 'Involved in INC-08741 robbery' },
                { event: 'Last seen', date: '20 Jun 2024', desc: 'Mobile tower ping — Silk Board' },
              ].map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 3 }} />
                    {i < 2 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: 2 }} />}
                  </div>
                  <div>
                    <div className="text-caption" style={{ fontWeight: 600 }}>{ev.event}</div>
                    <div className="text-label text-muted">{ev.date}</div>
                    <div className="text-caption text-secondary" style={{ marginTop: 2 }}>{ev.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm flex-1">Add Note</button>
            <button className="btn btn-primary btn-sm flex-1">Full Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkAnalysis;
