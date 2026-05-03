import type { ScoringBreakdown } from "@/types/verification";
import {
  clampScore,
  formatLabel,
  scoreBarClass,
} from "@/lib/verificationUtils";

export function ScoringBreakdownPanel({
  scoring,
}: {
  scoring?: ScoringBreakdown;
}) {
  if (!scoring) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Rule-Based Scoring Breakdown</h3>
      <p className="mt-2 text-sm text-slate-500">
        Earlier rule-based scoring retained for comparison with Dempster-Shafer aggregation.
      </p>

      <div className="mt-5 space-y-4">
        {Object.entries(scoring)
          .filter(([key]) => key !== "final_score")
          .map(([key, value]) => {
            const max = key.includes("penalty")
              ? 15
              : key.includes("recency")
                ? 10
                : 20;

            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-slate-700">
                    {formatLabel(key)}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${scoreBarClass(key)}`}
                    style={{ width: `${clampScore(Number(value), max)}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
