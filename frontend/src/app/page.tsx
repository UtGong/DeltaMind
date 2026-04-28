"use client";

import { useState } from "react";

type SourceItem = {
  id: string;
  title: string;
  url: string;
  source_type: string;
  credibility_score: number;
  freshness_score: number;
  stance: "supports" | "partially_supports" | "contradicts" | "unclear";
  evidence_summary: string;

  source_tier?: number;
  source_role?: string;
  authority_score?: number;
  independence_score?: number;
  provenance_origin?: string;
  published_date?: string | null;
  evidence_type?: string;
  copied_from?: string | null;
};

type DeltaSignal = {
  type: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
};

type AtomicClaim = {
  id: string;
  text: string;
  role: "core" | "supporting_detail" | "contextual_detail";
  status:
    | "verified"
    | "partially_verified"
    | "uncorroborated"
    | "contradicted"
    | "uncertain";
  confidence_score: number;
  explanation: string;
  supporting_source_ids: string[];
  conflicting_source_ids: string[];
  missing_evidence?: string | null;
};

type EvidenceMapItem = {
  status:
    | "verified"
    | "partially_verified"
    | "uncorroborated"
    | "contradicted"
    | "uncertain";
  label: string;
  description: string;
  related_atomic_claim_ids: string[];
};

type ScoringBreakdown = {
  authority_score: number;
  evidence_directness_score: number;
  independent_corroboration_score: number;
  provenance_clarity_score: number;
  recency_score: number;
  atomic_claim_coverage_score: number;
  contradiction_penalty: number;
  echo_chamber_penalty: number;
  missing_evidence_penalty: number;
  final_score: number;
};

type VerifyResponse = {
  input_claim: string;
  normalized_claim: string;
  domain: string;

  confidence_score: number;
  confidence_label: "High" | "Medium" | "Low";
  verdict: string;
  sources: SourceItem[];
  delta_signals: DeltaSignal[];
  explanation: string;

  trust_index?: number;
  trust_label?: string;
  ledger_summary?: string;
  atomic_claims?: AtomicClaim[];
  evidence_map?: EvidenceMapItem[];
  scoring_breakdown?: ScoringBreakdown;
  system_notes?: string[];
};

const exampleClaims = [
  "MGM Macau is building a new hotel and casino in 2028",
  "Company X partnered with Company Y to launch Product Z in Macau next Tuesday.",
  "Company X received a new gaming license approval in Macau.",
  "A gaming operator announced a new AI-powered casino analytics platform.",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function stanceLabel(stance: SourceItem["stance"]) {
  if (stance === "supports") return "Supports";
  if (stance === "partially_supports") return "Partially supports";
  if (stance === "contradicts") return "Contradicts";
  return "Unclear";
}

function stanceClass(stance: SourceItem["stance"]) {
  if (stance === "supports") return "bg-green-100 text-green-800";
  if (stance === "partially_supports") return "bg-yellow-100 text-yellow-800";
  if (stance === "contradicts") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-800";
}

function impactClass(impact: DeltaSignal["impact"]) {
  if (impact === "positive") return "border-green-200 bg-green-50 text-green-800";
  if (impact === "negative") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function claimStatusClass(status: AtomicClaim["status"] | EvidenceMapItem["status"]) {
  if (status === "verified") return "border-green-200 bg-green-50 text-green-800";
  if (status === "partially_verified") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (status === "uncorroborated") return "border-orange-200 bg-orange-50 text-orange-800";
  if (status === "contradicted") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function scoreBarClass(key: string) {
  if (key.includes("penalty")) return "bg-red-500";
  return "bg-slate-900";
}

function clampScore(value: number, max = 20) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export default function Home() {
  const [claim, setClaim] = useState(exampleClaims[0]);
  const [domain, setDomain] = useState("real_gaming");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claim, domain }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify claim.");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Backend request failed. Please check whether FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }

  const score = result?.trust_index ?? result?.confidence_score ?? 0;
  const label = result?.trust_label ?? result?.verdict ?? "";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
            DeltaMind Prototype
          </p>
          <h1 className="max-w-5xl text-4xl font-semibold tracking-tight md:text-6xl">
            Evidence Triangulation Ledger
          </h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">
            DeltaMind validates public web and gaming-industry claims by comparing
            source authority, evidence stance, provenance, independence, freshness,
            and contradiction signals.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-slate-700">
            Claim or topic
          </label>

          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-4 text-base outline-none focus:border-slate-400"
          />

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Mode
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="ml-0 mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2 md:ml-3 md:inline-block"
              >
                <option value="general_web">Mock: General Web</option>
                <option value="gaming_industry">Mock: Gaming Industry</option>
                <option value="real_web">Real Web Search</option>
                <option value="real_gaming">Real Gaming Web Search</option>
              </select>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || claim.trim().length === 0}
              className="rounded-2xl bg-slate-950 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Verifying..." : "Verify Claim"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {exampleClaims.map((item) => (
              <button
                key={item}
                onClick={() => setClaim(item)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <section className="mt-8 grid gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Verification Result
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {label}
                  </h2>
                  <p className="mt-3 max-w-4xl text-slate-600">
                    {result.explanation}
                  </p>

                  {result.ledger_summary && (
                    <p className="mt-4 max-w-4xl rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-900">
                        Ledger summary:{" "}
                      </span>
                      {result.ledger_summary}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl bg-slate-950 p-6 text-center text-white">
                  <p className="text-sm text-slate-300">Trust Index</p>
                  <p className="mt-2 text-6xl font-semibold">{score}</p>
                  <p className="mt-1 text-sm text-slate-300">{label}</p>
                </div>
              </div>
            </div>

            {result.evidence_map && result.evidence_map.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold">Evidence Map</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Claim-level verification status across the evidence ledger.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {result.evidence_map.map((item, index) => (
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
            )}

            {result.atomic_claims && result.atomic_claims.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold">Atomic Claims</h3>
                <p className="mt-2 text-sm text-slate-500">
                  The system decomposes the original claim into smaller checkable parts.
                </p>

                <div className="mt-5 grid gap-4">
                  {result.atomic_claims.map((atomic) => (
                    <div
                      key={atomic.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {formatLabel(atomic.role)}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${claimStatusClass(
                                atomic.status
                              )}`}
                            >
                              {formatLabel(atomic.status)}
                            </span>
                          </div>

                          <h4 className="mt-3 text-lg font-semibold">
                            {atomic.text}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {atomic.explanation}
                          </p>

                          {atomic.missing_evidence && (
                            <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-800">
                              <span className="font-semibold">Missing evidence: </span>
                              {atomic.missing_evidence}
                            </p>
                          )}
                        </div>

                        <div className="min-w-32 rounded-2xl bg-slate-50 p-4 text-center">
                          <p className="text-xs text-slate-500">Confidence</p>
                          <p className="text-3xl font-semibold">
                            {atomic.confidence_score}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        {atomic.supporting_source_ids.length > 0 && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                            Supports: {atomic.supporting_source_ids.join(", ")}
                          </span>
                        )}
                        {atomic.conflicting_source_ids.length > 0 && (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                            Conflicts: {atomic.conflicting_source_ids.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold">Source Delta Signals</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Signals generated from source authority, contradiction, provenance,
                  temporal decay, and echo-chamber risk.
                </p>

                <div className="mt-4 space-y-3">
                  {result.delta_signals.map((signal) => (
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

              {result.scoring_breakdown && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold">Scoring Breakdown</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Rule-based evidence aggregation for the current prototype.
                  </p>

                  <div className="mt-5 space-y-4">
                    {Object.entries(result.scoring_breakdown)
                      .filter(([key]) => key !== "final_score")
                      .map(([key, value]) => {
                        const max = key.includes("penalty") ? 15 : key.includes("recency") ? 10 : 20;
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
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Retrieved Sources</h3>
              <p className="mt-2 text-sm text-slate-500">
                Sources are evaluated by stance, credibility, freshness, authority,
                provenance, and independence.
              </p>

              <div className="mt-5 grid gap-4">
                {result.sources.map((source) => (
                  <div
                    key={source.url}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
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
                          <p>
                            <span className="font-medium text-slate-900">
                              Source tier:
                            </span>{" "}
                            {source.source_tier ?? "N/A"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">
                              Evidence type:
                            </span>{" "}
                            {source.evidence_type
                              ? formatLabel(source.evidence_type)
                              : "N/A"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">
                              Provenance:
                            </span>{" "}
                            {source.provenance_origin ?? "N/A"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">
                              Copied from:
                            </span>{" "}
                            {source.copied_from ?? "None detected"}
                          </p>
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
                          <p className="text-2xl font-semibold">
                            {source.credibility_score}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Authority</p>
                          <p className="text-2xl font-semibold">
                            {source.authority_score ?? "N/A"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Freshness</p>
                          <p className="text-2xl font-semibold">
                            {source.freshness_score}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Independence</p>
                          <p className="text-2xl font-semibold">
                            {source.independence_score ?? "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.system_notes && result.system_notes.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold">System Notes</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  {result.system_notes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
