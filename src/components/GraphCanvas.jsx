import React, { useRef, useState, useEffect } from 'react';
import { SCC_COLORS } from '../utils/graphUtils';

// Colors
const C = {
  nodeFill:    '#161625',
  nodeStroke:  '#3a3a5c',
  nodeText:    '#c8c8e8',
  edgeNormal:  '#2e2e48',
  edgeActive:  '#4d8fff',
  visitColor:  '#f0a030',
  stackColor:  '#4d8fff',
  finishColor: '#5ecb7a',
};

// Compute arrow endpoints offset by node radius
function arrowPoints(x1, y1, x2, y2, r = 22) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len, ny = dy / len;
  return {
    sx: x1 + nx * r, sy: y1 + ny * r,
    ex: x2 - nx * (r + 3), ey: y2 - ny * (r + 3),
  };
}

// Small curved offset for bidirectional edges
function edgePath(from, to, nodes, isBidi) {
  const f = nodes.find(n => n.id === from);
  const t = nodes.find(n => n.id === to);
  if (!f || !t) return null;
  const { sx, sy, ex, ey } = arrowPoints(f.x, f.y, t.x, t.y);
  if (isBidi) {
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const dx = ex - sx, dy = ey - sy;
    const px = -dy * 0.2, py = dx * 0.2;
    return `M${sx},${sy} Q${mx + px},${my + py} ${ex},${ey}`;
  }
  return `M${sx},${sy} L${ex},${ey}`;
}

export default function GraphCanvas({
  nodes, edges, mode, edgeStart,
  result, stepIdx,
  onNodeMouseDown, onEdgeClick, onCanvasClick,
  algo,
}) {
  const svgRef = useRef();
  const [mousePos, setMousePos] = useState(null);

  const svgPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Build set of bidi edge pairs
  const bidiSet = new Set();
  edges.forEach(e => {
    if (edges.find(e2 => e2.from === e.to && e2.to === e.from)) {
      bidiSet.add(`${e.from}-${e.to}`);
    }
  });

  // ── Step state extraction ─────────────────────────────────────────────────
  const getVisitingNode = () => {
    if (!result) return null;
    const s = result.steps[stepIdx];
    return s?.node || s?.visiting || null;
  };

  const getStackNodes = () => {
    if (!result) return new Set();
    const s = result.steps[stepIdx];
    return new Set(s?.stack || s?.onStack || []);
  };

  const getPass2Nodes = () => {
    if (!result || algo !== 'kosaraju') return new Set();
    const s = result.steps[stepIdx];
    return new Set(s?.sccNodes || []);
  };

  const getCompletedSCCs = () => {
    if (!result) return [];
    const done = [];
    for (let i = 0; i <= stepIdx; i++) {
      const s = result.steps[i];
      if (s?.scc) done.push(s.scc);
    }
    return done;
  };

  const getNodeSCCColor = (nid) => {
    const sccs = getCompletedSCCs();
    for (let i = 0; i < sccs.length; i++) {
      if (sccs[i].includes(nid)) return SCC_COLORS[i % SCC_COLORS.length];
    }
    return null;
  };

  const getDiscLow = (nid) => {
    if (!result || algo !== 'tarjan') return null;
    const s = result.steps[stepIdx];
    if (!s?.disc || s.disc[nid] === undefined) return null;
    return { disc: s.disc[nid], low: s.low[nid] };
  };

  const getFinishOrder = () => {
    if (!result || algo !== 'kosaraju') return {};
    const s = result.steps[stepIdx];
    const fo = s?.finishStack || [];
    const map = {};
    fo.forEach((n, i) => (map[n] = i + 1));
    return map;
  };

  const visiting  = getVisitingNode();
  const stackSet  = getStackNodes();
  const pass2Set  = getPass2Nodes();
  const finishOrd = getFinishOrder();

  const edgeSCCColor = (from, to) => {
    const sccs = getCompletedSCCs();
    for (let i = 0; i < sccs.length; i++) {
      if (sccs[i].includes(from) && sccs[i].includes(to))
        return SCC_COLORS[i % SCC_COLORS.length];
    }
    return null;
  };

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#09090f' }}
      onClick={e => { if (mode === 'addNode') onCanvasClick(svgPoint(e)); }}
      onMouseMove={e => {
        if (mode === 'addEdge' && edgeStart) setMousePos(svgPoint(e));
      }}
      onMouseLeave={() => setMousePos(null)}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="arrow-scc" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Temp edge while adding */}
      {mode === 'addEdge' && edgeStart && mousePos && (() => {
        const src = nodes.find(n => n.id === edgeStart);
        if (!src) return null;
        return (
          <line
            x1={src.x} y1={src.y} x2={mousePos.x} y2={mousePos.y}
            stroke={C.edgeActive} strokeWidth={1.5}
            strokeDasharray="6 4" markerEnd="url(#arrow)"
            opacity={0.7}
          />
        );
      })()}

      {/* Edges */}
      {edges.map((e, i) => {
        const path = edgePath(e.from, e.to, nodes, bidiSet.has(`${e.from}-${e.to}`));
        if (!path) return null;
        const sccCol = edgeSCCColor(e.from, e.to);
        const col    = sccCol || C.edgeNormal;
        const w      = sccCol ? 2 : 1.5;
        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={col}
            strokeWidth={w}
            markerEnd="url(#arrow)"
            style={{ cursor: mode === 'delete' ? 'pointer' : 'default' }}
            onClick={() => { if (mode === 'delete') onEdgeClick(i); }}
            opacity={sccCol ? 0.9 : 0.6}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const sccCol  = getNodeSCCColor(n.id);
        const isVisit = visiting === n.id;
        const isStack = stackSet.has(n.id);
        const isP2    = pass2Set.has(n.id);
        const dl      = getDiscLow(n.id);
        const finOrd  = finishOrd[n.id];

        let strokeColor = sccCol || C.nodeStroke;
        let strokeWidth = 1.5;
        if (isVisit) { strokeColor = C.visitColor; strokeWidth = 3; }
        else if (isStack && algo === 'tarjan') { strokeColor = C.stackColor; strokeWidth = 2.5; }
        else if (isP2) { strokeColor = C.finishColor; strokeWidth = 2; }

        const fillColor = sccCol
          ? sccCol + '28'
          : isVisit ? '#f0a03018' : C.nodeFill;

        return (
          <g
            key={n.id}
            onMouseDown={e => { e.stopPropagation(); onNodeMouseDown(e, n.id); }}
            style={{ cursor: mode === 'delete' ? 'pointer' : mode === 'select' ? 'grab' : 'crosshair' }}
          >
            {/* Glow ring for visited */}
            {isVisit && (
              <circle cx={n.x} cy={n.y} r={28}
                fill="none" stroke={C.visitColor} strokeWidth={1}
                opacity={0.35} filter="url(#glow)" />
            )}
            {/* Main circle */}
            <circle
              cx={n.x} cy={n.y} r={20}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Node label */}
            <text
              x={n.x} y={n.y + 1}
              textAnchor="middle" dominantBaseline="central"
              fontSize={14} fontWeight={600}
              fill={sccCol || (isVisit ? C.visitColor : C.nodeText)}
              style={{ fontFamily: 'JetBrains Mono, monospace', userSelect: 'none' }}
            >
              {n.id}
            </text>

            {/* Tarjan disc/low values */}
            {dl && (
              <text
                x={n.x} y={n.y + 34}
                textAnchor="middle"
                fontSize={9}
                fill="#7070a0"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {`d:${dl.disc} l:${dl.low}`}
              </text>
            )}

            {/* Kosaraju finish order badge */}
            {finOrd !== undefined && (
              <g>
                <circle cx={n.x + 16} cy={n.y - 16} r={9} fill={C.finishColor} opacity={0.9} />
                <text
                  x={n.x + 16} y={n.y - 15}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fontWeight={700} fill="#09090f"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {finOrd}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Edge-start highlight */}
      {edgeStart && (() => {
        const n = nodes.find(nd => nd.id === edgeStart);
        if (!n) return null;
        return (
          <circle cx={n.x} cy={n.y} r={24} fill="none"
            stroke={C.edgeActive} strokeWidth={2} strokeDasharray="4 3" opacity={0.8} />
        );
      })()}
    </svg>
  );
}
