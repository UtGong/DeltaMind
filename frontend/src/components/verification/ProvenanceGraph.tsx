"use client";

import type { SourceItem } from "@/types/verification";
import { formatLabel, stanceClass } from "@/lib/verificationUtils";

type GraphNode = {
  id: string;
  label: string;
  kind: "claim" | "source" | "origin";
  x: number;
  y: number;
  source?: SourceItem;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "evidence" | "dependency" | "origin";
  label?: string;
};

function shortLabel(text: string, max = 34) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + "…";
}

function sourceNodeClass(source?: SourceItem) {
  if (!source) return "border-slate-300 bg-white";

  if (source.stance === "supports") return "border-green-300 bg-green-50";
  if (source.stance === "partially_supports") return "border-yellow-300 bg-yellow-50";
  if (source.stance === "contradicts") return "border-red-300 bg-red-50";
  return "border-slate-300 bg-white";
}

function edgeClass(kind: GraphEdge["kind"]) {
  if (kind === "dependency") return "stroke-orange-400";
  if (kind === "origin") return "stroke-indigo-400";
  return "stroke-slate-300";
}

export function ProvenanceGraph({
  claim,
  sources,
}: {
  claim: string;
  sources: SourceItem[];
}) {
  if (!sources.length) return null;

  const displayedSources = sources.slice(0, 8);

  const originNames = Array.from(
    new Set(
      displayedSources
        .map((source) => source.detected_origin || source.similarity_group)
        .filter((value): value is string => Boolean(value))
    )
  );

  const nodes: GraphNode[] = [
    {
      id: "claim",
      label: "Input claim",
      kind: "claim",
      x: 60,
      y: 220,
    },
  ];

  originNames.forEach((origin, index) => {
    nodes.push({
      id: `origin-${origin}`,
      label: origin,
      kind: "origin",
      x: 360,
      y: 80 + index * 90,
    });
  });

  displayedSources.forEach((source, index) => {
    nodes.push({
      id: source.id,
      label: source.normalized_domain || source.title,
      kind: "source",
      x: 690,
      y: 45 + index * 72,
      source,
    });
  });

  const edges: GraphEdge[] = [];

  displayedSources.forEach((source) => {
    const origin = source.detected_origin || source.similarity_group;

    if (origin) {
      edges.push({
        id: `claim-origin-${origin}`,
        from: "claim",
        to: `origin-${origin}`,
        kind: "origin",
        label: "origin group",
      });

      edges.push({
        id: `origin-${origin}-${source.id}`,
        from: `origin-${origin}`,
        to: source.id,
        kind: "origin",
      });
    } else {
      edges.push({
        id: `claim-${source.id}`,
        from: "claim",
        to: source.id,
        kind: "evidence",
      });
    }

    if (source.copied_from) {
      edges.push({
        id: `dependency-${source.id}-${source.copied_from}`,
        from: source.copied_from,
        to: source.id,
        kind: "dependency",
        label: "possible dependency",
      });
    }
  });

  function getNode(id: string) {
    return nodes.find((node) => node.id === id);
  }

  const dependentCount = displayedSources.filter(
    (source) => source.copied_from || source.similarity_group || source.detected_origin
  ).length;

  const independentCount = displayedSources.length - dependentCount;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Provenance Graph</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Visualizes how retrieved sources connect to the claim and whether any
            source appears to share an origin, similarity group, or dependency path.
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Independent: {independentCount}
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
            Dependency risk: {dependentCount}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="relative h-[660px] min-w-[980px]">
          <svg className="absolute inset-0 h-full w-full">
            <defs>
              <marker
                id="arrow"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const from = getNode(edge.from);
              const to = getNode(edge.to);

              if (!from || !to) return null;

              const x1 = from.x + 150;
              const y1 = from.y + 28;
              const x2 = to.x;
              const y2 = to.y + 28;
              const midX = (x1 + x2) / 2;

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    strokeWidth={edge.kind === "dependency" ? 2.5 : 1.8}
                    className={edgeClass(edge.kind)}
                    markerEnd="url(#arrow)"
                  />
                  {edge.label && (
                    <text
                      x={midX - 30}
                      y={(y1 + y2) / 2 - 6}
                      className="fill-slate-500 text-[11px]"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => {
            if (node.kind === "claim") {
              return (
                <div
                  key={node.id}
                  className="absolute w-[160px] rounded-2xl border border-slate-950 bg-slate-950 p-4 text-white shadow-sm"
                  style={{ left: node.x, top: node.y }}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Claim
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {shortLabel(claim, 54)}
                  </p>
                </div>
              );
            }

            if (node.kind === "origin") {
              return (
                <div
                  key={node.id}
                  className="absolute w-[180px] rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm"
                  style={{ left: node.x, top: node.y }}
                >
                  <p className="text-xs uppercase tracking-wide text-indigo-500">
                    Origin / group
                  </p>
                  <p className="mt-1 text-sm font-semibold text-indigo-950">
                    {shortLabel(node.label, 42)}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={node.id}
                className={`absolute w-[240px] rounded-2xl border p-4 shadow-sm ${sourceNodeClass(
                  node.source
                )}`}
                style={{ left: node.x, top: node.y }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {node.source?.source_role ?? "Source"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {shortLabel(node.label, 44)}
                    </p>
                  </div>
                  {node.source && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${stanceClass(
                        node.source.stance
                      )}`}
                    >
                      {formatLabel(node.source.stance)}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-xl bg-white/70 p-2">
                    <p className="text-slate-500">Auth</p>
                    <p className="font-semibold">{node.source?.authority_score ?? "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-2">
                    <p className="text-slate-500">Ind</p>
                    <p className="font-semibold">
                      {node.source?.independence_score ?? "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-2">
                    <p className="text-slate-500">Prior</p>
                    <p className="font-semibold">
                      {node.source?.reliability_prior ?? "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-slate-300" />
          Direct evidence path
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-indigo-400" />
          Shared origin / group
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-orange-400" />
          Possible dependency
        </span>
      </div>
    </div>
  );
}
