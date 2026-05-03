import type { BeliefMass } from "@/types/verification";
import { clampPercent } from "@/lib/verificationUtils";

export function BeliefMassBar({ beliefMass }: { beliefMass?: BeliefMass | null }) {
  if (!beliefMass) return null;

  const belief = clampPercent(beliefMass.belief * 100);
  const disbelief = clampPercent(beliefMass.disbelief * 100);
  const uncertainty = clampPercent(beliefMass.uncertainty * 100);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Belief Mass</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Dempster-Shafer evidence aggregation across support, contradiction,
            and unresolved uncertainty.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
          <p className="text-xs text-slate-300">DS Trust Index</p>
          <p className="text-3xl font-semibold">{beliefMass.trust_index}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <div className="flex h-8 w-full">
          <div className="bg-green-500" style={{ width: `${belief}%` }} />
          <div className="bg-red-500" style={{ width: `${disbelief}%` }} />
          <div className="bg-slate-400" style={{ width: `${uncertainty}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-green-700">
            Belief
          </p>
          <p className="mt-1 text-2xl font-semibold text-green-900">
            {belief.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            Disbelief
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-900">
            {disbelief.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Uncertainty
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {uncertainty.toFixed(1)}%
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        {beliefMass.explanation}
      </p>
    </div>
  );
}
