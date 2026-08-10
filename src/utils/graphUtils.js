/**
 * Graph utility functions
 */

export const SCC_COLORS = [
  '#e05c5c', '#4d8fff', '#5ecb7a', '#f0a030', '#b87fff',
  '#ff7eb3', '#30c9c9', '#f5c842', '#ff8c60', '#7cb8ff',
];

// Build condensation DAG from SCCs
export function buildCondensationDAG(nodes, edges, sccs) {
  const nodeToSCC = {};
  sccs.forEach((comp, i) => comp.forEach(n => (nodeToSCC[n] = i)));

  const dagEdgeSet = new Set();
  edges.forEach(e => {
    const s = nodeToSCC[e.from];
    const t = nodeToSCC[e.to];
    if (s !== undefined && t !== undefined && s !== t) {
      dagEdgeSet.add(`${s}|${t}`);
    }
  });

  return [...dagEdgeSet].map(key => {
    const [from, to] = key.split('|').map(Number);
    return { from, to };
  });
}

// Layout condensation DAG nodes in a circle
export function layoutDAGNodes(sccs, cx = 300, cy = 200, r = 140) {
  return sccs.map((comp, i) => {
    const angle = (2 * Math.PI * i) / sccs.length - Math.PI / 2;
    return {
      id:    i,
      label: comp.join(', '),
      comp,
      x:     cx + r * Math.cos(angle),
      y:     cy + r * Math.sin(angle),
      color: SCC_COLORS[i % SCC_COLORS.length],
    };
  });
}

// Detect in-degree for DAG nodes (for topological info)
export function computeInDegrees(dagNodeCount, dagEdges) {
  const inDeg = Array(dagNodeCount).fill(0);
  dagEdges.forEach(e => inDeg[e.to]++);
  return inDeg;
}

// Default preset graphs
export const PRESETS = {
  default: {
    nodes: [
      { id: 'A', x: 120, y: 100 }, { id: 'B', x: 270, y: 60  },
      { id: 'C', x: 420, y: 120 }, { id: 'D', x: 350, y: 270 },
      { id: 'E', x: 160, y: 300 }, { id: 'F', x: 520, y: 70  },
      { id: 'G', x: 520, y: 280 },
    ],
    edges: [
      ['A','B'],['B','C'],['C','D'],['D','E'],['E','A'],
      ['B','F'],['F','C'],['C','G'],['G','F'],
    ],
  },
  cycle3: {
    nodes: [
      { id: 'A', x: 200, y: 80  },
      { id: 'B', x: 380, y: 80  },
      { id: 'C', x: 290, y: 290 },
    ],
    edges: [['A','B'],['B','C'],['C','A']],
  },
  twoSCCs: {
    nodes: [
      { id: 'A', x: 80,  y: 150 }, { id: 'B', x: 200, y: 80  },
      { id: 'C', x: 200, y: 240 }, { id: 'D', x: 360, y: 150 },
      { id: 'E', x: 480, y: 80  }, { id: 'F', x: 480, y: 240 },
    ],
    edges: [
      ['A','B'],['B','C'],['C','A'],   // SCC 1
      ['C','D'],                        // bridge
      ['D','E'],['E','F'],['F','D'],   // SCC 2
    ],
  },
  pureDAG: {
    nodes: [
      { id: 'A', x: 100, y: 80  }, { id: 'B', x: 260, y: 80  },
      { id: 'C', x: 420, y: 80  }, { id: 'D', x: 180, y: 260 },
      { id: 'E', x: 340, y: 260 },
    ],
    edges: [['A','B'],['A','D'],['B','C'],['B','E'],['D','E'],['C','E']],
  },
  complex: {
    nodes: [
      { id: 'A', x: 80,  y: 100 }, { id: 'B', x: 230, y: 55  },
      { id: 'C', x: 380, y: 110 }, { id: 'D', x: 230, y: 220 },
      { id: 'E', x: 80,  y: 310 }, { id: 'F', x: 490, y: 55  },
      { id: 'G', x: 490, y: 265 }, { id: 'H', x: 340, y: 330 },
    ],
    edges: [
      ['A','B'],['B','C'],['C','D'],['D','E'],['E','A'],
      ['B','F'],['F','C'],['C','G'],['G','F'],['D','H'],['H','G'],
    ],
  },
};
