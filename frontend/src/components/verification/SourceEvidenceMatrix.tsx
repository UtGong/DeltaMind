import type { SourceItem } from "@/types/verification";
import { formatLabel, stanceClass } from "@/lib/verificationUtils";
import { MiniBar } from "./MiniBar";

export function SourceEvidenceMatrix({ sources }: { sources: SourceItem[] }) {
  if (!sources.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Source Evidence Matrix</h3>
      <p className="mt-2 text-sm text-slate-500">
        Compact comparison of stance, authority, independence, temporal fit, and
        provenance risk.
      </p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Stance</th>
              <th className="px-4 py-3">Authority</th>
              <th className="px-4 py-3">Independence</th>
              <th className="px-4 py-3">Reliability</th>
              <th className="px-4 py-3">Temporal</th>
              <th className="px-4 py-3">Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sources.map((source) => (
              <tr key={source.id} className="align-top">
                <td className="max-w-xs px-4 py-4">
                  <p className="font-medium text-slate-950">{source.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {source.normalized_domain ?? source.source_role ?? "N/A"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${stanceClass(
                      source.stance
                    )}`}
                  >
                    {formatLabel(source.stance)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <MiniBar value={source.authority_score ?? null} />
                </td>
                <td className="px-4 py-4">
                  <MiniBar value={(source.independence_score ?? 0) * 100} />
                </td>
                <td className="px-4 py-4">
                  <MiniBar value={(source.reliability_prior ?? 0) * 100} />
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    {formatLabel(source.temporal_status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {source.copied_from || source.similarity_group ? (
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs text-orange-700">
                      dependency risk
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      no signal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
