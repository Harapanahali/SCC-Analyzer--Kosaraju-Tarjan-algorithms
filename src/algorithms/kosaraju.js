/**
 * Kosaraju's Algorithm for finding Strongly Connected Components
 *
 * Time Complexity:  O(V + E)
 * Space Complexity: O(V + E)  — stores the reversed graph
 *
 * Two-pass DFS approach:
 *  Pass 1: Run DFS on original graph, push nodes to stack by finish time
 *  Pass 2: Run DFS on reversed graph in reverse finish order → each DFS tree = 1 SCC
 */

function buildAdjList(nodes, edges) {
  const adj = {};
  nodes.forEach(n => (adj[n.id] = []));
  edges.forEach(e => {
    if (adj[e.from] !== undefined) adj[e.from].push(e.to);
  });
  return adj;
}

function buildReverseAdj(nodes, edges) {
  const adj = {};
  nodes.forEach(n => (adj[n.id] = []));
  edges.forEach(e => {
    if (adj[e.to] !== undefined) adj[e.to].push(e.from);
  });
  return adj;
}

export function kosarajuAlgorithm(nodes, edges) {
  if (nodes.length === 0) return { sccs: [], steps: [] };

  const adj    = buildAdjList(nodes, edges);
  const revAdj = buildReverseAdj(nodes, edges);

  const visited     = new Set();
  const finishStack = [];   // nodes ordered by finish time (ascending)
  const steps       = [];

  // ── PASS 1: forward DFS to get finish order ──────────────────────────────
  function dfs1(u) {
    visited.add(u);
    steps.push({
      phase:       'pass1',
      type:        'visit',
      node:        u,
      finishStack: [...finishStack],
      desc:        `Pass 1 — visiting node ${u}`,
    });

    for (const v of adj[u]) {
      if (!visited.has(v)) dfs1(v);
    }

    finishStack.push(u);
    steps.push({
      phase:       'pass1',
      type:        'finish',
      node:        u,
      finishStack: [...finishStack],
      desc:        `Pass 1 — finished ${u}, pushed to finish stack`,
    });
  }

  nodes.forEach(n => {
    if (!visited.has(n.id)) dfs1(n.id);
  });

  steps.push({
    phase:       'pass1',
    type:        'done',
    node:        null,
    finishStack: [...finishStack],
    desc:        `Pass 1 complete. Finish order: [${finishStack.join(' → ')}]`,
  });

  // ── PASS 2: reverse DFS in reverse finish order ───────────────────────────
  const visited2 = new Set();
  const sccs     = [];

  while (finishStack.length > 0) {
    const u = finishStack.pop();
    if (visited2.has(u)) continue;

    const currentSCC = [];

    function dfs2(v) {
      visited2.add(v);
      currentSCC.push(v);
      steps.push({
        phase:       'pass2',
        type:        'visit',
        node:        v,
        sccNodes:    [...currentSCC],
        finishStack: [...finishStack],
        desc:        `Pass 2 (reverse graph) — visiting ${v}`,
      });

      for (const w of revAdj[v]) {
        if (!visited2.has(w)) dfs2(w);
      }
    }

    dfs2(u);
    sccs.push([...currentSCC]);

    steps.push({
      phase:       'pass2',
      type:        'scc_found',
      node:        null,
      scc:         [...currentSCC],
      sccIndex:    sccs.length - 1,
      finishStack: [...finishStack],
      desc:        `SCC found: { ${currentSCC.join(', ')} }`,
    });
  }

  return { sccs, steps };
}
