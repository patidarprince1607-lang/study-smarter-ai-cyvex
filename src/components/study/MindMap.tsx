import { useMemo, useState } from "react";
import type { Lesson } from "@/lib/types";

type N = { id: string; label: string; info: string; x: number; y: number; depth: 0 | 1 | 2; parent?: string };

const W = 1000, H = 760, CX = 500, CY = 380, R1 = 190, R2 = 330;

function boxW(label: string, depth: number) {
  return Math.min(depth === 0 ? 220 : 170, label.length * (depth === 0 ? 11 : 8) + 32);
}

export function MindMap({ map }: { map: Lesson["mindMap"] }) {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("c");

  const nodes = useMemo(() => {
    const out: N[] = [{ id: "c", label: map.center, info: map.info, x: CX, y: CY, depth: 0 }];
    const n = map.branches.length || 1;
    map.branches.forEach((b, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const id = `b${i}`;
      out.push({ id, label: b.label, info: b.info, x: CX + Math.cos(a) * R1 * 1.25, y: CY + Math.sin(a) * R1, depth: 1, parent: "c" });
      const kids = b.children ?? [];
      kids.forEach((k, j) => {
        const spread = 0.34;
        const ka = a + (j - (kids.length - 1) / 2) * spread;
        out.push({ id: `${id}-${j}`, label: k.label, info: k.info, x: CX + Math.cos(ka) * R2 * 1.3, y: CY + Math.sin(ka) * R2, depth: 2, parent: id });
      });
    });
    return out.map((p) => ({ ...p, x: Math.max(95, Math.min(W - 95, p.x)), y: Math.max(30, Math.min(H - 30, p.y)) }));
  }, [map]);

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const active = hover ?? null;
  const related = new Set<string>();
  if (active) {
    related.add(active);
    const a = byId[active];
    if (a?.parent) { related.add(a.parent); if (byId[a.parent]?.parent) related.add(byId[a.parent].parent!); }
    nodes.forEach((n) => n.parent === active && related.add(n.id));
  }
  const dim = (id: string) => active !== null && !related.has(id);
  const sel = byId[selected] ?? nodes[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="overflow-x-auto rounded-2xl border bg-glow bg-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px] w-full h-auto select-none" role="img" aria-label={`Mind map of ${map.center}`}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-electric" />
            </marker>
          </defs>
          {nodes.filter((n) => n.parent).map((n) => {
            const p = byId[n.parent!];
            const mx = (p.x + n.x) / 2, my = (p.y + n.y) / 2;
            const on = active && related.has(n.id) && related.has(p.id);
            return (
              <path key={`e-${n.id}`} d={`M${p.x},${p.y} Q${mx + (CY - my) * 0.08},${my + (mx - CX) * 0.08} ${n.x},${n.y}`}
                fill="none" markerEnd="url(#arrow)"
                className={`transition-all duration-200 ${on ? "stroke-electric" : "stroke-electric/30"}`}
                strokeWidth={on ? 3 : n.depth === 1 ? 2.2 : 1.5}
                opacity={dim(n.id) ? 0.25 : 1} />
            );
          })}
          {nodes.map((n) => {
            const w = boxW(n.label, n.depth), h = n.depth === 0 ? 58 : n.depth === 1 ? 44 : 36;
            const isSel = selected === n.id;
            const fill = n.depth === 0 ? "fill-primary" : n.depth === 1 ? "fill-card" : "fill-electric-soft";
            const text = n.depth === 0 ? "fill-primary-foreground" : n.depth === 1 ? "fill-primary" : "fill-accent-foreground";
            return (
              <g key={n.id} transform={`translate(${n.x - w / 2},${n.y - h / 2})`} className="cursor-pointer transition-opacity duration-200"
                opacity={dim(n.id) ? 0.3 : 1}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => setSelected(n.id)}>
                <rect width={w} height={h} rx={h / 2} className={`${fill} ${n.depth === 1 || isSel ? "stroke-electric" : "stroke-border"}`} strokeWidth={isSel ? 3 : n.depth === 1 ? 2 : 1} />
                <text x={w / 2} y={h / 2} dominantBaseline="central" textAnchor="middle"
                  className={`${text} font-sans`} fontSize={n.depth === 0 ? 20 : n.depth === 1 ? 15 : 13} fontWeight={n.depth === 2 ? 500 : 700}>
                  {n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="card-surface p-5 animate-pop" key={sel.id}>
        <div className="eyebrow">{sel.depth === 0 ? "Core concept" : sel.depth === 1 ? "Branch" : "Detail"}</div>
        <h4 className="mt-2 text-lg font-bold">{sel.label}</h4>
        {sel.parent && <p className="mt-1 text-xs text-muted-foreground">Part of {byId[sel.parent].label}</p>}
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{sel.info || "Click any node to explore it."}</p>
        <p className="mt-5 text-xs text-muted-foreground">Hover a node to highlight its connections. Click to read about it.</p>
      </aside>
    </div>
  );
}
