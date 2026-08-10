import React, { useState, useRef, useEffect, useCallback } from 'react';
import GraphCanvas    from './components/GraphCanvas.jsx';
import CondensationDAG from './components/CondensationDAG.jsx';
import AlgoCompare    from './components/AlgoCompare.jsx';
import { kosarajuAlgorithm } from './algorithms/kosaraju.js';
import { tarjanAlgorithm }   from './algorithms/tarjan.js';
import { SCC_COLORS, PRESETS } from './utils/graphUtils.js';

/* ─── tiny helpers ─────────────────────────────────────────────────── */
const btn = (active) => ({
  padding: '5px 12px',
  fontSize: 12,
  border: '1px solid',
  borderColor: active ? '#c8c8e8' : '#2a2a42',
  borderRadius: 6,
  background: active ? '#c8c8e8' : 'transparent',
  color: active ? '#09090f' : '#9090c0',
  fontFamily: 'JetBrains Mono, monospace',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const tabStyle = (active) => ({
  padding: '7px 16px',
  fontSize: 12,
  background: 'none',
  border: 'none',
  borderBottom: `2px solid ${active ? '#c8c8e8' : 'transparent'}`,
  color: active ? '#c8c8e8' : '#5050a0',
  cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace',
  fontWeight: active ? 600 : 400,
  transition: 'all .15s',
});

/* ─── App ──────────────────────────────────────────────────────────── */
export default function App() {
  /* graph state */
  const [nodes, setNodes]     = useState([]);
  const [edges, setEdges]     = useState([]);
  const [nodeCounter, setNodeCounter] = useState(0);

  /* interaction */
  const [mode, setMode]       = useState('select'); // select | addNode | addEdge | delete
  const [edgeStart, setEdgeStart] = useState(null);
  const draggingRef = useRef(null);
  const dragOffRef  = useRef({ x: 0, y: 0 });

  /* algorithm */
  const [algo, setAlgo]       = useState('kosaraju');
  const [result, setResult]   = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimer             = useRef(null);

  /* UI */
  const [tab, setTab]         = useState('graph'); // graph | dag | compare

  /* ── load default preset on mount ── */
  useEffect(() => { loadPreset('default'); }, []);

  /* ── preset loader ── */
  function loadPreset(name) {
    const p = PRESETS[name] || PRESETS.default;
    setNodes(p.nodes.map(n => ({ ...n })));
    setEdges(p.edges.map(([f, t]) => ({ from: f, to: t, id: crypto.randomUUID() })));
    const ids = p.nodes.map(n => n.id);
    setNodeCounter(ids.length);
    setResult(null);
    setStepIdx(0);
    stopPlay();
    setEdgeStart(null);
  }

  /* ── node id generator ── */
  function nextNodeId(count) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[count % 26] + (count >= 26 ? Math.floor(count / 26) : '');
  }

  /* ── run algorithm ── */
  const runAlgo = useCallback(() => {
    if (nodes.length === 0) return;
    stopPlay();
    const res = algo === 'kosaraju'
      ? kosarajuAlgorithm(nodes, edges)
      : tarjanAlgorithm(nodes, edges);
    setResult(res);
    setStepIdx(0);
  }, [nodes, edges, algo]);

  /* ── playback ── */
  function stopPlay() {
    setPlaying(false);
    clearInterval(playTimer.current);
  }

  useEffect(() => {
    if (playing && result) {
      playTimer.current = setInterval(() => {
        setStepIdx(i => {
          if (i >= result.steps.length - 1) { stopPlay(); return i; }
          return i + 1;
        });
      }, 420);
    }
    return () => clearInterval(playTimer.current);
  }, [playing, result]);

  function togglePlay() {
    if (!result) return;
    if (playing) stopPlay();
    else setPlaying(true);
  }

  /* ── canvas interaction callbacks ── */
  const onCanvasClick = useCallback((pt) => {
    if (mode !== 'addNode') return;
    const id = nextNodeId(nodeCounter);
    setNodes(ns => [...ns, { id, x: pt.x, y: pt.y }]);
    setNodeCounter(c => c + 1);
  }, [mode, nodeCounter]);

  const onNodeMouseDown = useCallback((e, nid) => {
    if (mode === 'select') {
      draggingRef.current = nid;
      const node = nodes.find(n => n.id === nid);
      const rect = e.currentTarget.closest('svg').getBoundingClientRect();
      dragOffRef.current = {
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top  - node.y,
      };
    } else if (mode === 'addEdge') {
      if (!edgeStart) {
        setEdgeStart(nid);
      } else {
        if (edgeStart !== nid && !edges.find(ex => ex.from === edgeStart && ex.to === nid)) {
          setEdges(es => [...es, { from: edgeStart, to: nid, id: crypto.randomUUID() }]);
        }
        setEdgeStart(null);
      }
    } else if (mode === 'delete') {
      setNodes(ns => ns.filter(n => n.id !== nid));
      setEdges(es => es.filter(ex => ex.from !== nid && ex.to !== nid));
    }
  }, [mode, edgeStart, edges, nodes]);

  const onEdgeClick = useCallback((idx) => {
    if (mode === 'delete') {
      setEdges(es => es.filter((_, i) => i !== idx));
    }
  }, [mode]);

  /* global mouse-move / mouse-up for dragging */
  useEffect(() => {
    function onMouseMove(e) {
      if (!draggingRef.current) return;
      const svg = document.querySelector('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffRef.current.x;
      const y = e.clientY - rect.top  - dragOffRef.current.y;
      setNodes(ns => ns.map(n => n.id === draggingRef.current ? { ...n, x, y } : n));
    }
    function onMouseUp() { draggingRef.current = null; }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, []);

  /* ── current step info ── */
  const currentStep = result?.steps[stepIdx] || null;

  const getStepDesc = () => {
    if (!currentStep) return 'Run an algorithm to begin.';
    return currentStep.desc || '—';
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

  const completedSCCs = getCompletedSCCs();
  const allSCCs       = result?.sccs || [];

  /* ── graph stats ── */
  const density = nodes.length > 1
    ? ((edges.length / (nodes.length * (nodes.length - 1))) * 100).toFixed(1) + '%'
    : 'N/A';

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090f' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
        background: '#0d0d1c', borderBottom: '1px solid #1a1a2e',
        flexWrap: 'wrap',
      }}>
        {/* Title */}
        <div style={{ marginRight: 8 }}>
          <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#e2e2f0', letterSpacing: '-0.5px' }}>
            SCC <span style={{ color: '#4d8fff' }}>Analyzer</span>
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: '#1e1e36', margin: '0 4px' }} />

        {/* Mode buttons */}
        <span style={{ fontSize: 11, color: '#5050a0' }}>Mode:</span>
        {[
          { key: 'select',  label: '↖ Select'  },
          { key: 'addNode', label: '+ Node'    },
          { key: 'addEdge', label: '→ Edge'    },
          { key: 'delete',  label: '✕ Delete'  },
        ].map(m => (
          <button key={m.key} style={btn(mode === m.key)}
            onClick={() => { setMode(m.key); setEdgeStart(null); }}>
            {m.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: '#1e1e36', margin: '0 4px' }} />

        {/* Preset */}
        <span style={{ fontSize: 11, color: '#5050a0' }}>Preset:</span>
        <select
          onChange={e => loadPreset(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px', background: '#0d0d1c', border: '1px solid #2a2a42', borderRadius: 6, color: '#9090c0' }}>
          <option value="default">Default (7 nodes)</option>
          <option value="cycle3">3-Cycle</option>
          <option value="twoSCCs">Two SCCs</option>
          <option value="pureDAG">Pure DAG</option>
          <option value="complex">Complex</option>
        </select>

        <div style={{ width: 1, height: 20, background: '#1e1e36', margin: '0 4px' }} />

        {/* Algorithm + Run */}
        <span style={{ fontSize: 11, color: '#5050a0' }}>Algo:</span>
        <select
          value={algo}
          onChange={e => setAlgo(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px', background: '#0d0d1c', border: '1px solid #2a2a42', borderRadius: 6, color: '#9090c0' }}>
          <option value="kosaraju">Kosaraju</option>
          <option value="tarjan">Tarjan</option>
        </select>
        <button
          onClick={runAlgo}
          style={{ ...btn(false), background: '#c8c8e8', color: '#09090f', borderColor: '#c8c8e8', fontWeight: 700 }}>
          ▶ Run
        </button>
        <button onClick={() => { setResult(null); setStepIdx(0); stopPlay(); }} style={btn(false)}>
          Reset
        </button>

        {/* Playback (only when result exists) */}
        {result && (
          <>
            <div style={{ width: 1, height: 20, background: '#1e1e36', margin: '0 4px' }} />
            <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} style={btn(false)}>◀</button>
            <button onClick={togglePlay} style={btn(playing)}>
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button onClick={() => setStepIdx(i => Math.min(result.steps.length - 1, i + 1))} style={btn(false)}>▶▶</button>
            <input
              type="range" min={0} max={result.steps.length - 1} value={stepIdx}
              onChange={e => { stopPlay(); setStepIdx(+e.target.value); }}
              style={{ width: 120, accentColor: '#4d8fff' }}
            />
            <span style={{ fontSize: 11, color: '#5050a0', whiteSpace: 'nowrap' }}>
              {stepIdx + 1} / {result.steps.length}
            </span>
          </>
        )}
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: canvas ──────────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            mode={mode}
            edgeStart={edgeStart}
            result={result}
            stepIdx={stepIdx}
            algo={algo}
            onNodeMouseDown={onNodeMouseDown}
            onEdgeClick={onEdgeClick}
            onCanvasClick={onCanvasClick}
          />

          {/* Step description overlay */}
          {currentStep && (
            <div style={{
              position: 'absolute', bottom: 14, left: 14, right: 14,
              background: '#0d0d1cee', border: '1px solid #1e1e36',
              borderRadius: 8, padding: '8px 14px',
              fontSize: 12, color: '#9090c0', lineHeight: 1.6,
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{ color: algo === 'kosaraju' ? '#4d8fff' : '#b87fff', fontWeight: 600 }}>
                [{algo === 'kosaraju' ? 'Kosaraju' : 'Tarjan'}]
              </span>
              {' '}{getStepDesc()}
            </div>
          )}

          {/* Edge-start hint */}
          {edgeStart && mode === 'addEdge' && (
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              background: '#0d0d1cee', border: '1px solid #4d8fff44',
              borderRadius: 6, padding: '5px 14px', fontSize: 12, color: '#4d8fff',
            }}>
              From <strong>{edgeStart}</strong> — click target node
            </div>
          )}
        </div>

        {/* ── RIGHT: sidebar ────────────────────────────────────────── */}
        <div style={{
          width: 240, background: '#0d0d1c',
          borderLeft: '1px solid #1a1a2e',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e' }}>
            {[
              { key: 'graph',   label: 'Info'    },
              { key: 'dag',     label: 'DAG'     },
              { key: 'compare', label: 'Compare' },
            ].map(t => (
              <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── INFO tab ── */}
          {tab === 'graph' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Graph stats */}
              <Section title="Graph">
                <Stat label="Nodes"   value={nodes.length} />
                <Stat label="Edges"   value={edges.length} />
                <Stat label="Density" value={density} />
              </Section>

              {/* Algorithm info */}
              <Section title={algo === 'kosaraju' ? 'Kosaraju' : 'Tarjan'}>
                {algo === 'kosaraju' ? (
                  <>
                    <InfoLine>2-pass DFS approach</InfoLine>
                    <InfoLine>O(V+E) time & space</InfoLine>
                    <InfoLine>Uses reversed graph</InfoLine>
                  </>
                ) : (
                  <>
                    <InfoLine>Single DFS pass</InfoLine>
                    <InfoLine>O(V+E) time, O(V) space</InfoLine>
                    <InfoLine>disc[ ] and low[ ] arrays</InfoLine>
                  </>
                )}
              </Section>

              {/* Kosaraju pass info */}
              {result && algo === 'kosaraju' && currentStep && (
                <Section title={`Pass ${currentStep.phase === 'pass2' ? '2' : '1'}`}>
                  <InfoLine color="#7070a0">
                    {currentStep.phase === 'pass1'
                      ? 'Forward DFS — recording finish order'
                      : 'Reverse DFS — extracting SCCs'}
                  </InfoLine>
                  {currentStep.finishStack?.length > 0 && (
                    <InfoLine color="#5ecb7a">
                      Finish: [{currentStep.finishStack.join(' → ')}]
                    </InfoLine>
                  )}
                </Section>
              )}

              {/* Tarjan stack info */}
              {result && algo === 'tarjan' && currentStep?.stack?.length > 0 && (
                <Section title="Tarjan Stack">
                  <div style={{ fontSize: 11, color: '#4d8fff', lineHeight: 1.7 }}>
                    [{currentStep.stack.join(' → ')}]
                  </div>
                </Section>
              )}

              {/* SCCs found so far */}
              <Section title={`SCCs (${completedSCCs.length} / ${allSCCs.length})`}>
                {completedSCCs.length === 0
                  ? <InfoLine>None yet</InfoLine>
                  : completedSCCs.map((comp, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: SCC_COLORS[i % SCC_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#c8c8e8' }}>{'{' + comp.join(', ') + '}'}</span>
                      </div>
                    ))
                }
              </Section>

              {/* Legend */}
              <Section title="Legend">
                <LegendRow color="#f0a030" label={algo === 'tarjan' ? 'Currently visiting' : 'Currently visiting'} />
                {algo === 'tarjan' && <LegendRow color="#4d8fff" label="On Tarjan stack" />}
                {algo === 'kosaraju' && <LegendRow color="#5ecb7a" label="Finish-order badge" />}
                <LegendRow color="#e05c5c" label="SCC 0" />
                <LegendRow color="#4d8fff" label="SCC 1" />
                <LegendRow color="#5ecb7a" label="SCC 2" />
              </Section>

            </div>
          )}

          {/* ── DAG tab ── */}
          {tab === 'dag' && (
            <CondensationDAG nodes={nodes} edges={edges} sccs={allSCCs} />
          )}

          {/* ── COMPARE tab ── */}
          {tab === 'compare' && (
            <AlgoCompare nodes={nodes} edges={edges} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tiny sub-components ──────────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#3a3a5c', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8, borderBottom: '1px solid #1a1a2e', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#5050a0' }}>
      <span>{label}</span>
      <span style={{ color: '#c8c8e8', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function InfoLine({ children, color = '#5050a0' }) {
  return <div style={{ fontSize: 11, color, lineHeight: 1.7 }}>{children}</div>;
}

function LegendRow({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#7070a0' }}>{label}</span>
    </div>
  );
}
