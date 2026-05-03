import type { DeltaSignal } from "@/types/verification";
import { formatLabel, impactClass } from "@/lib/verificationUtils";

export function DeltaSignalsPanel({ signals }: { signals: DeltaSignal[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Source Delta Signals</h3>
      <p className="mt-2 text-sm text-slate-500">
        Signals generated from source authority, contradiction, provenance,
        temporal decay, and echo-chamber risk.
      </p>

      <div className="mt-4 space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.type}
            className={`rounded-2xl border p-4 ${impactClass(signal.impact)}`}
          >
            <p className="font-medium">{formatLabel(signal.type)}</p>
            <p className="mt-1 text-sm leading-6">{signal.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
