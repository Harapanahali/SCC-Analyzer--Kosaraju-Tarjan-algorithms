/**
 * Tarjan's Algorithm for finding Strongly Connected Components
 *
 * Time Complexity:  O(V + E)
 * Space Complexity: O(V)  — only needs a stack and disc/low arrays
 *
 * Single-pass DFS:
 *  - Each node gets a discovery time disc[u] and a low-link value low[u]
 *  - low[u] = smallest disc reachable from subtree rooted at u
 *  - When low[u] == disc[u], u is the root of an SCC →
 *    pop stack until u is popped: those nodes form the SCC
 */

function buildAdjList(nodes, edges) {
  const adj = {};
  nodes.forEach(n => (adj[n.id] = []));
  edges.forEach(e => {
    if (adj[e.from] !== undefined) adj[e.from].push(e.to);
  });
  return adj;
}

export function tarjanAlgorithm(nodes, edges) {
  if (nodes.length === 0) return { sccs: [], steps: [] };

  const adj = buildAdjList(nodes, edges);

  let   timer  = 0;
  const disc   = {};   // discovery time
  const low    = {};   // low-link value
  const onStack= {};   // is node currently on Tarjan stack?
  const stack  = [];   // Tarjan stack
  const visited= new Set();
  const sccs   = [];
  const steps  = [];

  function dfs(u) {
    disc[u] = low[u] = timer++;
    stack.push(u);
    onStack[u] = true;
    visited.add(u);

    steps.push({
      type:    'visit',
      node:    u,
      disc:    { ...disc },
      low:     { ...low },
      stack:   [...stack],
      onStack: { ...onStack },
      desc:    `Visit ${u} → disc[${u}]=${disc[u]}, low[${u}]=${low[u]}`,
    });

    for (const v of adj[u]) {
      if (!visited.has(v)) {
        // Tree edge: recurse, then update low[u]
        dfs(v);
        const prev = low[u];
        low[u] = Math.min(low[u], low[v]);
        steps.push({
          type:    'update_low',
          node:    u,
          via:     v,
          disc:    { ...disc },
          low:     { ...low },
          stack:   [...stack],
          onStack: { ...onStack },
          desc:    `Back from ${v}: low[${u}] = min(${prev}, low[${v}]=${low[v]}) = ${low[u]}`,
        });
      } else if (onStack[v]) {
        // Back edge to ancestor on stack
        const prev = low[u];
        low[u] = Math.min(low[u], disc[v]);
        steps.push({
          type:    'back_edge',
          node:    u,
          via:     v,
          disc:    { ...disc },
          low:     { ...low },
          stack:   [...stack],
          onStack: { ...onStack },
          desc:    `Back edge ${u}→${v}: low[${u}] = min(${prev}, disc[${v}]=${disc[v]}) = ${low[u]}`,
        });
      }
    }

    // Check if u is SCC root (low[u] == disc[u])
    if (low[u] === disc[u]) {
      const comp = [];
      while (true) {
        const w = stack.pop();
        onStack[w] = false;
        comp.push(w);
        if (w === u) break;
      }
      sccs.push(comp);

      steps.push({
        type:     'scc_found',
        node:     u,
        scc:      [...comp],
        sccIndex: sccs.length - 1,
        disc:     { ...disc },
        low:      { ...low },
        stack:    [...stack],
        onStack:  { ...onStack },
        desc:     `low[${u}] == disc[${u}] → SCC root! Popped: { ${comp.join(', ')} }`,
      });
    }
  }

  nodes.forEach(n => {
    if (!visited.has(n.id)) dfs(n.id);
  });

  return { sccs, steps };
}
