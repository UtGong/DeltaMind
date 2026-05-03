import type { EvidenceMapItem } from "@/types/verification";
import { claimStatusClass } from "@/lib/verificationUtils";

export function EvidenceMapPanel({ items }: { items: EvidenceMapItem[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Evidence Map</h3>
      <p className="mt-2 text-sm text-slate-500">
        Claim-level verification status across the evidence ledger.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={`rounded-2xl border p-4 ${claimStatusClass(item.status)}`}
          >
            <p className="text-sm font-semibold uppercase tracking-wide">
              {item.label}
            </p>
            <p className="mt-2 text-sm leading-6">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
