import { clampPercent } from "@/lib/verificationUtils";

export function MiniBar({
  value,
  max = 100,
}: {
  value?: number | null;
  max?: number;
}) {
  const percent = value == null ? 0 : clampPercent((value / max) * 100);

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{value ?? "N/A"}</p>
    </div>
  );
}
