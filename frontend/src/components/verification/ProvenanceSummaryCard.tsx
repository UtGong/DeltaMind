import type { SourceItem } from "@/types/verification";

function extractList(summary: string | null | undefined, label: string): string[] {
  if (!summary) return [];

  const pattern = new RegExp(`${label}: \\[(.*?)\\]`);
  const match = summary.match(pattern);

  if (!match?.[1]) return [];

  return match[1]
    .split(",")
    .map((item) => item.replaceAll("'", "").replaceAll('"', "").trim())
    .filter(Boolean);
}

function extractNumber(summary: string | null | undefined, pattern: RegExp) {
  if (!summary) return 0;
  const match = summary.match(pattern);
  return match?.[1] ? Number(match[1]) : 0;
}

export function ProvenanceSummaryCard({
  summary,
  sources = [],
}: {
  summary?: string | null;
  sources?: SourceItem[];
}) {
  const totalSources =
    sources.length || extractNumber(summary, /(\d+) source\(s\) analyzed/);

  const dependencyRiskCount =
    sources.filter(
      (source) =>
        source.copied_from ||
        source.similarity_group ||
        source.independence_score !== undefined && source.independence_score < 0.75
    ).length ||
    extractNumber(summary, /(\d+) source\(s\) show possible dependency/);

  const independentCount = Math.max(0, totalSources - dependencyRiskCount);

  const origins =
    sources.length > 0
      ? Array.from(
          new Set(
            sources
              .map((source) => source.detected_origin)
              .filter((value): value is string => Boolean(value))
          )
        )
      : extractList(summary, "Detected named origin\\(s\\)");

  const groups =
    sources.length > 0
      ? Array.from(
          new Set(
            sources
              .map((source) => source.similarity_group)
              .filter((value): value is string => Boolean(value))
          )
        )
      : extractList(summary, "Similarity/provenance group\\(s\\)");

  const dependencyPercent =
    totalSources > 0 ? Math.round((dependencyRiskCount / totalSources) * 100) : 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Provenance Summary</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Checks whether retrieved sources appear independent or may share an
            origin, citation path, or repeated reporting pattern.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
          <p className="text-xs text-slate-300">Dependency risk</p>
          <p className="text-3xl font-semibold">{dependencyPercent}%</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sources analyzed
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">
            {totalSources}
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-green-700">
            Likely independent
          </p>
          <p className="mt-1 text-3xl font-semibold text-green-900">
            {independentCount}
          </p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
            Dependency risk
          </p>
          <p className="mt-1 text-3xl font-semibold text-orange-900">
            {dependencyRiskCount}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Detected origin signals
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {origins.length > 0 ? (
              origins.map((origin) => (
                <span
                  key={origin}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                >
                  {origin}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                None detected
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">
            Similarity / provenance groups
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.length > 0 ? (
              groups.map((group) => (
                <span
                  key={group}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                >
                  {group}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                None detected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          <span className="font-semibold text-slate-900">Interpretation: </span>
          {dependencyRiskCount === 0
            ? "No obvious echo-chamber or source dependency pattern was detected in the current evidence set."
            : `${dependencyRiskCount} of ${totalSources} source(s) may share an origin or repeated evidence path, so they should not be counted as fully independent confirmation.`}
        </p>
      </div>
    </div>
  );
}
