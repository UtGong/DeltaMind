"use client";

import { useState } from "react";

type SourceItem = {
  title: string;
  url: string;
  source_type: string;
  credibility_score: number;
  freshness_score: number;
  stance: "supports" | "partially_supports" | "contradicts" | "unclear";
  evidence_summary: string;
};

type DeltaSignal = {
  type: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
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
};

const exampleClaims = [
  "Company X announced a new AI-powered gaming platform.",
  "A gaming operator received a new license in Macau.",
  "Company A entered a partnership with Company B for online gaming analytics.",
];

function stanceLabel(stance: SourceItem["stance"]) {
  if (stance === "supports") return "Supports";
  if (stance === "partially_supports") return "Partially supports";
  if (stance === "contradicts") return "Contradicts";
  return "Unclear";
}

function impactClass(impact: DeltaSignal["impact"]) {
  if (impact === "positive") return "border-green-200 bg-green-50 text-green-800";
  if (impact === "negative") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function stanceClass(stance: SourceItem["stance"]) {
  if (stance === "supports") return "bg-green-100 text-green-800";
  if (stance === "partially_supports") return "bg-yellow-100 text-yellow-800";
  if (stance === "contradicts") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-800";
}

export default function Home() {
  const [claim, setClaim] = useState(exampleClaims[0]);
  const [domain, setDomain] = useState("gaming_industry");
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
            DeltaMind Prototype
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            AI Trust & Verification Engine
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            A mocked demo that models the delta between public information sources
            and converts agreement, contradiction, credibility, and freshness into
            explainable confidence signals.
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
                Domain
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
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Verification Result
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {result.verdict}
                  </h2>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    {result.explanation}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-950 p-6 text-center text-white">
                  <p className="text-sm text-slate-300">Confidence</p>
                  <p className="mt-2 text-5xl font-semibold">
                    {result.confidence_score}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {result.confidence_label}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold">Source Delta Signals</h3>
                <div className="mt-4 space-y-3">
                  {result.delta_signals.map((signal) => (
                    <div
                      key={signal.type}
                      className={`rounded-2xl border p-4 ${impactClass(signal.impact)}`}
                    >
                      <p className="font-medium">
                        {signal.type.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm">{signal.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold">Normalized Claim</h3>
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-slate-700">
                  {result.normalized_claim}
                </p>

                <h3 className="mt-6 text-xl font-semibold">Domain</h3>
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-slate-700">
                  {result.domain.replaceAll("_", " ")}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Retrieved Sources</h3>

              <div className="mt-5 grid gap-4">
                {result.sources.map((source) => (
                  <div
                    key={source.url}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold">{source.title}</h4>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${stanceClass(source.stance)}`}
                          >
                            {stanceLabel(source.stance)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {source.source_type.replaceAll("_", " ")}
                        </p>

                        <p className="mt-3 text-slate-700">
                          {source.evidence_summary}
                        </p>
                      </div>

                      <div className="grid min-w-44 grid-cols-2 gap-2 text-center">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Credibility</p>
                          <p className="text-xl font-semibold">
                            {source.credibility_score}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Freshness</p>
                          <p className="text-xl font-semibold">
                            {source.freshness_score}
                          </p>
                        </div>
                      </div>
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
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
