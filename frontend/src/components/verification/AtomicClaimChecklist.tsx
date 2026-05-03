import type { AtomicClaim } from "@/types/verification";
import {
  formatLabel,
  statusDotClass,
  claimStatusClass,
} from "@/lib/verificationUtils";
import { MiniBar } from "./MiniBar";

export function AtomicClaimChecklist({ claims }: { claims: AtomicClaim[] }) {
  if (!claims.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Atomic Claim Checklist</h3>
      <p className="mt-2 text-sm text-slate-500">
        Each row is an independently checkable claim unit.
      </p>

      <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {claims.map((claim) => (
          <div key={claim.id} className="p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_140px_160px] md:items-center">
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${statusDotClass(
                    claim.status
                  )}`}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {formatLabel(claim.role)}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${claimStatusClass(
                        claim.status
                      )}`}
                    >
                      {formatLabel(claim.status)}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-slate-950">{claim.text}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {claim.explanation}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs text-slate-500">Confidence</p>
                <MiniBar value={claim.confidence_score} />
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                  Supports: {claim.supporting_source_ids.length}
                </span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                  Conflicts: {claim.conflicting_source_ids.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
