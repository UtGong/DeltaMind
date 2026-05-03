import type { EvidenceGraph } from "@/types/verification";
import { graphTypeCount, relationCount } from "@/lib/verificationUtils";
import { MetricCard } from "./MetricCard";

export function EvidenceGraphSummary({ graph }: { graph?: EvidenceGraph | null }) {
  if (!graph) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Evidence Graph Summary</h3>
      <p className="mt-2 text-sm text-slate-500">
        A provenance-aware graph representation of claims, atomic claims,
        sources, evidence spans, and dependency edges.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <MetricCard label="Claim nodes" value={graphTypeCount(graph, "claim")} />
        <MetricCard label="Atomic claim nodes" value={graphTypeCount(graph, "atomic_claim")} />
        <MetricCard label="Source nodes" value={graphTypeCount(graph, "source")} />
        <MetricCard label="Evidence nodes" value={graphTypeCount(graph, "evidence")} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Graph edges"
          value={graph.edges.length}
          description="Total relations in the evidence graph."
        />
        <MetricCard
          label="Support edges"
          value={relationCount(graph, "supports")}
          description="Evidence-to-claim support relations."
        />
        <MetricCard
          label="Dependency edges"
          value={relationCount(graph, "possibly_derived_from")}
          description="Potential source-origin dependency links."
        />
      </div>
    </div>
  );
}
