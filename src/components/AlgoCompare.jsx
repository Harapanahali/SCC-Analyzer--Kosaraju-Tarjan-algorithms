import React, { useState } from 'react';
import { kosarajuAlgorithm } from '../algorithms/kosaraju';
import { tarjanAlgorithm }   from '../algorithms/tarjan';
import { SCC_COLORS }        from '../utils/graphUtils';

const ROW_STYLE = {
  display: 'grid',
  gridTemplateColumns: '1.6fr 1fr 1fr',
  gap: '4px 12px',
  fontSize: 12,
  padding: '4px 0',
  borderBottom: '1px solid #1a1a2e',
};

const THEORY_ROWS = [
  ['Time complexity',      'O(V + E)',          'O(V + E)'],
  ['Space (extra)',        'O(V + E) reversed', 'O(V) stack only'],
  ['DFS passes',           '2',                 '1'],
  ['Auxiliary structure',  'Reversed graph',    'Stack + low[]'],
  ['Implementation',       'Simpler',           'More complex'],
  ['Cache performance',    'Lower',             'Higher (single pass)'],
  ['Conceptual clarity',   'Very intuitive',    'Elegant but subtle'],
];

export default function AlgoCompare({ nodes, edges }) {
  const [kResult, setKResult] = useState(null);
  const [tResult, setTResult] = useState(null);
  const [timing,  setTiming]  = useState(null);

  const runBoth = () => {
    if (nodes.length === 0) return;
    const t0 = performance.now();
    const kr  = kosarajuAlgorithm(nodes, edges);
    const t1  = performance.now();
    const tr  = tarjanAlgorithm(nodes, edges);
    const t2  = performance.now();

    setKResult(kr);
    setTResult(tr);
    setTiming({ k: (t1 - t0).toFixed(4), t: (t2 - t1).toFixed(4) });
  };

  const sameResult = kResult && tResult
    ? JSON.stringify(kResult.sccs.map(s => [...s].sort()).sort())
      === JSON.stringify(tResult.sccs.map(s => [...s].sort()).sort())
    : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 14, overflowY: 'auto' }}>

      <button
        onClick={runBoth}
        style={{
          padding: '10px 20px', background: '#c8c8e8', color: '#09090f',
          border: 'none', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
        }}
      >
        ▶ Run Both Algorithms
      </button>

      {/* Performance metrics */}
      {timing && kResult && tResult && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Kosaraju', color: SCC_COLORS[1], r: kResult, t: timing.k },
            { label: 'Tarjan',   color: SCC_COLORS[4], r: tResult, t: timing.t },
          ].map(({ label, color, r, t }) => (
            <div key={label} style={{ background: '#0d0d1c', border: '1px solid #1e1e36', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{label}</div>
              {[
                ['Time (ms)',   t],
                ['SCCs found', r.sccs.length],
                ['DFS steps',  r.steps.length],
                ['Nodes',      nodes.length],
                ['Edges',      edges.length],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#7070a0' }}>
                  <span>{k}</span>
                  <span style={{ color: '#c8c8e8', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Results match indicator */}
      {sameResult !== null && (
        <div style={{
          background: sameResult ? '#5ecb7a18' : '#e05c5c18',
          border: `1px solid ${sameResult ? '#5ecb7a44' : '#e05c5c44'}`,
          borderRadius: 6, padding: '8px 12px', fontSize: 12,
          color: sameResult ? '#5ecb7a' : '#e05c5c',
        }}>
          {sameResult
            ? '✓ Both algorithms produced identical SCCs (order may differ)'
            : '✗ SCC membership differs — check for bugs'}
        </div>
      )}

      {/* SCC breakdown side by side */}
      {kResult && tResult && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Kosaraju SCCs', r: kResult, color: SCC_COLORS[1] },
            { label: 'Tarjan SCCs',   r: tResult, color: SCC_COLORS[4] },
          ].map(({ label, r, color }) => (
            <div key={label} style={{ background: '#0d0d1c', border: '1px solid #1e1e36', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color, marginBottom: 8, fontWeight: 600 }}>{label}</div>
              {r.sccs.map((comp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: SCC_COLORS[i % SCC_COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: '#9090c0' }}>{'{' + comp.join(', ') + '}'}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Theory comparison table */}
      <div style={{ background: '#0d0d1c', border: '1px solid #1e1e36', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: '#5050a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Algorithm Comparison
        </div>
        <div style={{ ...ROW_STYLE, color: '#5050a0', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #2a2a44', paddingBottom: 6 }}>
          <span>Property</span>
          <span style={{ color: SCC_COLORS[1] }}>Kosaraju</span>
          <span style={{ color: SCC_COLORS[4] }}>Tarjan</span>
        </div>
        {THEORY_ROWS.map(([prop, k, t]) => (
          <div key={prop} style={ROW_STYLE}>
            <span style={{ color: '#7070a0' }}>{prop}</span>
            <span style={{ color: '#c8c8e8' }}>{k}</span>
            <span style={{ color: '#c8c8e8' }}>{t}</span>
          </div>
        ))}
      </div>

      {/* How each works */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#0d0d1c', border: '1px solid #1e1e36', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SCC_COLORS[1], marginBottom: 8 }}>Kosaraju's Algorithm</div>
          <ol style={{ fontSize: 11, color: '#7070a0', lineHeight: 1.8, paddingLeft: 16 }}>
            <li>Run DFS on original graph</li>
            <li>Push nodes to stack by finish time</li>
            <li>Build the reversed graph</li>
            <li>Pop from stack, DFS on reversed graph</li>
            <li>Each DFS tree = one SCC</li>
          </ol>
        </div>
        <div style={{ background: '#0d0d1c', border: '1px solid #1e1e36', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SCC_COLORS[4], marginBottom: 8 }}>Tarjan's Algorithm</div>
          <ol style={{ fontSize: 11, color: '#7070a0', lineHeight: 1.8, paddingLeft: 16 }}>
            <li>Run single DFS, track disc[] and low[]</li>
            <li>Push every node onto explicit stack</li>
            <li>low[u] = min disc reachable from u's subtree</li>
            <li>When low[u] == disc[u]: u is SCC root</li>
            <li>Pop stack until u → that's the SCC</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
