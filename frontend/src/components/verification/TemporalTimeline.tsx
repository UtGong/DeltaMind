import type { SourceItem } from "@/types/verification";
import { formatLabel } from "@/lib/verificationUtils";

type TimelineEvent = {
  id: string;
  label: string;
  year: number;
  lane: "claim" | "source";
  source?: SourceItem;
};

function shortLabel(text: string, max = 32) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + "…";
}

function sourceStatusClass(status?: string | null) {
  if (!status) return "border-slate-300 bg-white text-slate-700";
  if (status === "matches_claim_event_year") {
    return "border-green-300 bg-green-50 text-green-800";
  }
  if (status === "source_before_claim_event_year") {
    return "border-yellow-300 bg-yellow-50 text-yellow-800";
  }
  if (status === "source_after_claim_event_year") {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }
  if (status === "publication_time_unknown") {
    return "border-slate-300 bg-slate-50 text-slate-700";
  }
  return "border-slate-300 bg-white text-slate-700";
}

function sourceDotClass(status?: string | null) {
  if (!status) return "bg-slate-400";
  if (status === "matches_claim_event_year") return "bg-green-500";
  if (status === "source_before_claim_event_year") return "bg-yellow-500";
  if (status === "source_after_claim_event_year") return "bg-blue-500";
  if (status === "publication_time_unknown") return "bg-slate-400";
  return "bg-slate-400";
}

function groupSourcesByYear(sources: SourceItem[]) {
  const grouped = new Map<number, SourceItem[]>();

  sources.forEach((source) => {
    if (typeof source.detected_publication_year !== "number") return;

    const year = source.detected_publication_year;
    const current = grouped.get(year) ?? [];
    current.push(source);
    grouped.set(year, current);
  });

  return Array.from(grouped.entries())
    .map(([year, groupedSources]) => ({ year, sources: groupedSources }))
    .sort((a, b) => a.year - b.year);
}

export function TemporalTimeline({
  sources,
  summary,
}: {
  sources: SourceItem[];
  summary?: string | null;
}) {
  const claimYears = Array.from(
    new Set(sources.flatMap((source) => source.detected_event_years ?? []))
  ).sort((a, b) => a - b);

  const sourceYearGroups = groupSourcesByYear(sources);

  const sourceYears = sourceYearGroups.map((group) => group.year);
  const allYears = Array.from(new Set([...claimYears, ...sourceYears])).sort(
    (a, b) => a - b
  );

  const unknownTimeSources = sources.filter(
    (source) => typeof source.detected_publication_year !== "number"
  );

  if (allYears.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">Temporal Evidence Timeline</h3>
        <p className="mt-3 text-sm text-slate-600">
          {summary ?? "No temporal data available."}
        </p>
      </div>
    );
  }

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const range = Math.max(1, maxYear - minYear);

  function yearPosition(year: number) {
    return ((year - minYear) / range) * 100;
  }

  const timelineEvents: TimelineEvent[] = [
    ...claimYears.map((year) => ({
      id: `claim-${year}`,
      label: `Claim event ${year}`,
      year,
      lane: "claim" as const,
    })),
    ...sourceYearGroups.map((group) => ({
      id: `source-${group.year}`,
      label: `${group.sources.length} source(s)`,
      year: group.year,
      lane: "source" as const,
      source: group.sources[0],
    })),
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Temporal Evidence Timeline</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Separates claimed event timing from source publication timing to reveal
            temporal gaps, outdated evidence, or missing time confirmation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-950 px-3 py-1 text-white">
            Claim year(s): {claimYears.length ? claimYears.join(", ") : "None"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Timed sources: {sourceYears.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Unknown time: {unknownTimeSources.length}
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="relative h-[300px] min-w-[760px]">
          <div className="absolute left-0 right-0 top-16 h-0.5 bg-slate-300" />
          <div className="absolute left-0 right-0 top-44 h-0.5 bg-slate-300" />

          <div className="absolute left-0 top-8 w-32 text-xs font-medium uppercase tracking-wide text-slate-500">
            Claim event
          </div>
          <div className="absolute left-0 top-36 w-32 text-xs font-medium uppercase tracking-wide text-slate-500">
            Source evidence
          </div>

          {allYears.map((year) => {
            const left = yearPosition(year);

            return (
              <div
                key={year}
                className="absolute top-0 h-full -translate-x-1/2 border-l border-dashed border-slate-200"
                style={{ left: `${left}%` }}
              >
                <p className="mt-64 -translate-x-1/2 text-xs font-medium text-slate-500">
                  {year}
                </p>
              </div>
            );
          })}

          {timelineEvents.map((event) => {
            const left = yearPosition(event.year);
            const top = event.lane === "claim" ? 48 : 160;

            if (event.lane === "claim") {
              return (
                <div
                  key={event.id}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${left}%`, top }}
                >
                  <div className="mx-auto h-5 w-5 rounded-full border-4 border-white bg-slate-950 shadow" />
                  <div className="mt-3 w-44 -translate-x-[42%] rounded-2xl border border-slate-900 bg-slate-950 p-3 text-center text-white shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Claimed time
                    </p>
                    <p className="mt-1 text-sm font-semibold">{event.year}</p>
                  </div>
                </div>
              );
            }

            const groupedSources =
              sourceYearGroups.find((group) => group.year === event.year)?.sources ??
              [];

            return (
              <div
                key={event.id}
                className="absolute -translate-x-1/2"
                style={{ left: `${left}%`, top }}
              >
                <div
                  className={`mx-auto h-4 w-4 rounded-full border-2 border-white shadow ${sourceDotClass(
                    event.source?.temporal_status
                  )}`}
                />
                <div className="mt-3 w-56 -translate-x-[44%] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {event.year}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {groupedSources.length} source(s)
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {groupedSources.slice(0, 3).map((source) => (
                      <span
                        key={source.id}
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${sourceStatusClass(
                          source.temporal_status
                        )}`}
                      >
                        {source.id}
                      </span>
                    ))}
                    {groupedSources.length > 3 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        +{groupedSources.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unknownTimeSources.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Sources with unclear publication time
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unknownTimeSources.slice(0, 8).map((source) => (
              <span
                key={source.id}
                className="rounded-full bg-white px-3 py-1 text-xs text-slate-700"
              >
                {source.id}: {shortLabel(source.normalized_domain ?? source.title, 28)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-green-700">
            Matches claim year
          </p>
          <p className="mt-1 text-2xl font-semibold text-green-900">
            {
              sources.filter(
                (source) => source.temporal_status === "matches_claim_event_year"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-yellow-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-yellow-700">
            Before claim year
          </p>
          <p className="mt-1 text-2xl font-semibold text-yellow-900">
            {
              sources.filter(
                (source) =>
                  source.temporal_status === "source_before_claim_event_year"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
            After claim year
          </p>
          <p className="mt-1 text-2xl font-semibold text-blue-900">
            {
              sources.filter(
                (source) => source.temporal_status === "source_after_claim_event_year"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Unknown time
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {unknownTimeSources.length}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        <span className="font-semibold text-slate-900">Assessment: </span>
        {summary ?? "No temporal summary available."}
      </p>
    </div>
  );
}
