import type { SourceItem } from "@/types/verification";
import {
  formatLabel,
  stanceClass,
  stanceLabel,
} from "@/lib/verificationUtils";

export function RetrievedSourcesPanel({ sources }: { sources: SourceItem[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Retrieved Sources</h3>
      <p className="mt-2 text-sm text-slate-500">
        Sources are sorted by stance, authority, and independence. They are
        evaluated by credibility, freshness, provenance, authority priors,
        temporal decay, and echo-chamber risk.
      </p>

      <div className="mt-5 grid gap-4">
        {sources.map((source) => (
          <div key={source.url} className="rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-semibold">{source.title}</h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${stanceClass(
                      source.stance
                    )}`}
                  >
                    {stanceLabel(source.stance)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {source.source_role ?? formatLabel(source.source_type)}
                </p>

                <p className="mt-3 leading-7 text-slate-700">
                  {source.evidence_summary}
                </p>

                <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p><span className="font-medium text-slate-900">Domain:</span> {source.normalized_domain ?? "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Source tier:</span> {source.source_tier ?? "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Reliability prior:</span> {source.reliability_prior ?? "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Bias risk:</span> {source.bias_risk ?? "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Evidence type:</span> {source.evidence_type ? formatLabel(source.evidence_type) : "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Provenance:</span> {source.provenance_origin ?? "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Similarity group:</span> {source.similarity_group ?? "None detected"}</p>
                  <p><span className="font-medium text-slate-900">Copied from:</span> {source.copied_from ?? "None detected"}</p>
                  <p><span className="font-medium text-slate-900">Temporal status:</span> {source.temporal_status ? formatLabel(source.temporal_status) : "N/A"}</p>
                  <p><span className="font-medium text-slate-900">Temporal decay:</span> {source.temporal_decay_score ?? "N/A"}</p>
                  <p className="md:col-span-2"><span className="font-medium text-slate-900">Authority reason:</span> {source.authority_reason ?? "N/A"}</p>
                  <p className="md:col-span-2"><span className="font-medium text-slate-900">Independence reason:</span> {source.independence_reason ?? "No dependency signal detected."}</p>
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-slate-700 underline underline-offset-4"
                >
                  View source
                </a>
              </div>

              <div className="grid min-w-56 grid-cols-2 gap-2 text-center lg:grid-cols-1">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Credibility</p>
                  <p className="text-2xl font-semibold">{source.credibility_score}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Authority</p>
                  <p className="text-2xl font-semibold">{source.authority_score ?? "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Freshness</p>
                  <p className="text-2xl font-semibold">{source.freshness_score}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Independence</p>
                  <p className="text-2xl font-semibold">{source.independence_score ?? "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
