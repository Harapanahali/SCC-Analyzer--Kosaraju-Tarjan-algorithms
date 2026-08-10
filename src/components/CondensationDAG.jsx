import React from 'react';
import { SCC_COLORS, buildCondensationDAG, layoutDAGNodes, computeInDegrees } from '../utils/graphUtils';

export default function CondensationDAG({ nodes, edges, sccs }) {
  if (!sccs || sccs.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5050a0', fontSize: 13 }}>
        Run an algorithm first to see the condensation DAG.
      </div>
    );
  }

  const dagEdges  = buildCondensationDAG(nodes, edges, sccs);
  const dagNodes  = layoutDAGNodes(sccs, 300, 200, sccs.length === 1 ? 0 : 140);
  const inDegrees = computeInDegrees(sccs.length, dagEdges);

  // Arrow helper
  function Arrow({ from, to }) {
    const f = dagNodes[from], t = dagNodes[to];
    if (!f || !t) return null;
    const dx = t.x - f.x, dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;
    const r = 28;
    const x1 = f.x + nx * r, y1 = f.y + ny * r;
    const x2 = t.x - nx * (r + 3), y2 = t.y - ny * (r + 3);
    return (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#3a3a5c" strokeWidth={1.5}
        strokeDasharray="5 4"
        markerEnd="url(#dag-arrow)"
        opacity={0.75}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 16, overflowY: 'auto' }}>
      <div style={{ fontSize: 11, color: '#5050a0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Condensation DAG — {sccs.length} SCC{sccs.length !== 1 ? 's' : ''} as nodes
      </div>

      <svg viewBox="0 0 600 400" style={{ width: '100%', maxHeight: 360, background: '#0d0d1c', borderRadius: 10, border: '1px solid #1e1e36' }}>
        <defs>
          <marker id="dag-arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {dagEdges.map((e, i) => <Arrow key={i} from={e.from} to={e.to} />)}

        {dagNodes.map((n, i) => (
          <g key={i}>
            {/* Outer ring */}
            <circle cx={n.x} cy={n.y} r={28} fill="none"
              stroke={n.color} strokeWidth={1.5} opacity={0.4} />
            {/* Fill */}
            <circle cx={n.x} cy={n.y} r={24} fill={n.color + '22'} stroke={n.color} strokeWidth={1.5} />
            {/* SCC ID */}
            <text x={n.x} y={n.y - 4} textAnchor="middle" dominantBaseline="central"
              fontSize={12} fontWeight={700} fill={n.color}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              SCC{i}
            </text>
            {/* In-degree badge */}
            <text x={n.x} y={n.y + 9} textAnchor="middle"
              fontSize={9} fill={n.color + 'aa'}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              in:{inDegrees[i]}
            </text>
            {/* Member nodes label below circle */}
            <text x={n.x} y={n.y + 42} textAnchor="middle"
              fontSize={10} fill="#5050a0"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {'{' + n.comp.join(', ') + '}'}
            </text>
          </g>
        ))}
      </svg>

      {/* SCC legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        {sccs.map((comp, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: SCC_COLORS[i % SCC_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: '#9090c0' }}>
              SCC{i}: <span style={{ color: '#c8c8e8' }}>{'{' + comp.join(', ') + '}'}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Structural analysis */}
      <div style={{ border: '1px solid #1e1e36', borderRadius: 8, padding: '12px 14px', background: '#0d0d1c' }}>
        <div style={{ fontSize: 11, color: '#5050a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Structure analysis
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12, color: '#7070a0' }}>
          <span>Total SCCs</span><span style={{ color: '#c8c8e8' }}>{sccs.length}</span>
          <span>DAG edges</span><span style={{ color: '#c8c8e8' }}>{dagEdges.length}</span>
          <span>Source SCCs (in=0)</span><span style={{ color: '#c8c8e8' }}>{inDegrees.filter(d => d === 0).length}</span>
          <span>Sink SCCs (out=0)</span>
          <span style={{ color: '#c8c8e8' }}>
            {(() => {
              const outDeg = Array(sccs.length).fill(0);
              dagEdges.forEach(e => outDeg[e.from]++);
              return outDeg.filter(d => d === 0).length;
            })()}
          </span>
          <span>Trivial SCCs (size=1)</span><span style={{ color: '#c8c8e8' }}>{sccs.filter(c => c.length === 1).length}</span>
          <span>Non-trivial SCCs</span><span style={{ color: '#c8c8e8' }}>{sccs.filter(c => c.length > 1).length}</span>
        </div>
      </div>
    </div>
  );
}
