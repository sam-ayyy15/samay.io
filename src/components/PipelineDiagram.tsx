type Node = { id: string; x: number; y: number; label: string; sub?: string; accent?: boolean };
type Edge = [string, string];

export type Diagram = { nodes: Node[]; edges: Edge[]; caption: string };

const W = 150;
const H = 58;

/**
 * Lightweight animated architecture diagram (inline SVG, no images).
 * Data "flows" along the edges via stroke-dashoffset, only while the slide
 * is active (.is-active on the parent) so idle slides cost nothing.
 */
const PipelineDiagram = ({ diagram }: { diagram: Diagram }) => {
  const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
  const path = ([a, b]: Edge) => {
    const s = byId[a];
    const t = byId[b];
    const x1 = s.x + W;
    const y1 = s.y + H / 2;
    const x2 = t.x;
    const y2 = t.y + H / 2;
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <figure className="pipeline">
      <svg viewBox="0 0 760 400" role="img" aria-label={diagram.caption}>
        <defs>
          <pattern id="pipeline-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(140,11,38,0.13)" />
          </pattern>
        </defs>
        <rect width="760" height="400" rx="22" fill="url(#pipeline-dots)" />
        {diagram.edges.map((e, i) => (
          <g key={i}>
            <path d={path(e)} className="pipeline-edge-base" />
            <path
              d={path(e)}
              className="pipeline-edge"
              style={{ animationDelay: `${i * -0.35}s` }}
            />
          </g>
        ))}
        {diagram.nodes.map((n, i) => (
          <g
            key={n.id}
            className={`pipeline-node ${n.accent ? "is-accent" : ""}`}
            style={{ transitionDelay: `${0.08 * i}s` }}
            transform={`translate(${n.x} ${n.y})`}
          >
            <rect width={W} height={H} rx="14" />
            <text x={W / 2} y={n.sub ? 25 : 34} textAnchor="middle" className="pipeline-label">
              {n.label}
            </text>
            {n.sub && (
              <text x={W / 2} y={43} textAnchor="middle" className="pipeline-sub">
                {n.sub}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
};

export default PipelineDiagram;
