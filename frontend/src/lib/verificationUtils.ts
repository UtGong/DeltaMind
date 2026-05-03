import type {
  AtomicClaim,
  DeltaSignal,
  EvidenceGraph,
  EvidenceMapItem,
  SourceItem,
} from "@/types/verification";

export function formatLabel(value?: string | null) {
  if (!value) return "N/A";
  return value.replaceAll("_", " ");
}

export function stanceLabel(stance: SourceItem["stance"]) {
  if (stance === "supports") return "Supports";
  if (stance === "partially_supports") return "Partially supports";
  if (stance === "contradicts") return "Contradicts";
  return "Unclear";
}

export function stanceClass(stance: SourceItem["stance"]) {
  if (stance === "supports") return "bg-green-100 text-green-800";
  if (stance === "partially_supports") return "bg-yellow-100 text-yellow-800";
  if (stance === "contradicts") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

export function impactClass(impact: DeltaSignal["impact"]) {
  if (impact === "positive") return "border-green-200 bg-green-50 text-green-800";
  if (impact === "negative") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export function claimStatusClass(status: AtomicClaim["status"] | EvidenceMapItem["status"]) {
  if (status === "verified") return "border-green-200 bg-green-50 text-green-800";
  if (status === "partially_verified") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (status === "uncorroborated") return "border-orange-200 bg-orange-50 text-orange-800";
  if (status === "contradicted") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export function statusDotClass(status: AtomicClaim["status"]) {
  if (status === "verified") return "bg-green-500";
  if (status === "partially_verified") return "bg-yellow-500";
  if (status === "contradicted") return "bg-red-500";
  if (status === "uncorroborated") return "bg-orange-500";
  return "bg-slate-400";
}

export function scoreBarClass(key: string) {
  if (key.includes("penalty")) return "bg-red-500";
  return "bg-slate-900";
}

export function clampScore(value: number, max = 20) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function sourceSortScore(source: SourceItem) {
  const stancePriority: Record<SourceItem["stance"], number> = {
    supports: 0,
    contradicts: 1,
    partially_supports: 2,
    unclear: 3,
  };

  return (
    stancePriority[source.stance] * 1000 +
    (source.source_tier ?? 9) * 100 -
    (source.authority_score ?? 0) -
    (source.independence_score ?? 0) * 10
  );
}

export function atomicClaimSortScore(claim: AtomicClaim) {
  const rolePriority: Record<AtomicClaim["role"], number> = {
    core: 0,
    supporting_detail: 1,
    contextual_detail: 2,
  };

  return rolePriority[claim.role] ?? 9;
}

export function evidenceMapSortScore(item: EvidenceMapItem) {
  const statusPriority: Record<EvidenceMapItem["status"], number> = {
    contradicted: 0,
    uncorroborated: 1,
    uncertain: 2,
    partially_verified: 3,
    verified: 4,
  };

  return statusPriority[item.status] ?? 9;
}

export function graphTypeCount(graph: EvidenceGraph | null | undefined, type: string) {
  if (!graph) return 0;
  return graph.nodes.filter((node) => node.type === type).length;
}

export function relationCount(graph: EvidenceGraph | null | undefined, relation: string) {
  if (!graph) return 0;
  return graph.edges.filter((edge) => edge.relation === relation).length;
}
