"use client";

import { useState } from "react";

import { exportMarkdownReport } from "@/lib/exportReport";
import {
  atomicClaimSortScore,
  evidenceMapSortScore,
  sourceSortScore,
} from "@/lib/verificationUtils";
import type { VerifyResponse } from "@/types/verification";

import { AtomicClaimChecklist } from "@/components/verification/AtomicClaimChecklist";
import { BeliefMassBar } from "@/components/verification/BeliefMassBar";
import { ClaimInputPanel } from "@/components/verification/ClaimInputPanel";
import { DeltaSignalsPanel } from "@/components/verification/DeltaSignalsPanel";
import { EvidenceGraphSummary } from "@/components/verification/EvidenceGraphSummary";
import { EvidenceMapPanel } from "@/components/verification/EvidenceMapPanel";
import { OverallResultCard } from "@/components/verification/OverallResultCard";
import { ProvenanceSummaryCard } from "@/components/verification/ProvenanceSummaryCard";
import { RetrievedSourcesPanel } from "@/components/verification/RetrievedSourcesPanel";
import { ScoringBreakdownPanel } from "@/components/verification/ScoringBreakdownPanel";
import { SectionLabel } from "@/components/verification/SectionLabel";
import { SourceEvidenceMatrix } from "@/components/verification/SourceEvidenceMatrix";
import { SystemNotesPanel } from "@/components/verification/SystemNotesPanel";
import { TemporalTimeline } from "@/components/verification/TemporalTimeline";

const exampleClaims = [
  "MGM Macau is building a new hotel and casino in 2028",
  "MGM Macau operates casino resort properties in Macau",
  "MGM China is considering expanding its Macau resort with additional hotel rooms and wellness services",
  "Company X partnered with Company Y to launch Product Z in Macau next Tuesday.",
  "Company X received a new gaming license approval in Macau.",
];

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

  const sortedEvidenceMap = result?.evidence_map
    ? [...result.evidence_map].sort(
        (a, b) => evidenceMapSortScore(a) - evidenceMapSortScore(b)
      )
    : [];

  const sortedAtomicClaims = result?.atomic_claims
    ? [...result.atomic_claims].sort(
        (a, b) => atomicClaimSortScore(a) - atomicClaimSortScore(b)
      )
    : [];

  const sortedSources = result?.sources
    ? [...result.sources].sort((a, b) => sourceSortScore(a) - sourceSortScore(b))
    : [];

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
            DeltaMind validates public web and gaming-industry claims through atomic
            claim decomposition, source authority priors, provenance-aware evidence
            graphs, temporal reasoning, and Dempster-Shafer belief aggregation.
          </p>
        </div>

        <ClaimInputPanel
          claim={claim}
          domain={domain}
          loading={loading}
          exampleClaims={exampleClaims}
          onClaimChange={setClaim}
          onDomainChange={setDomain}
          onVerify={handleVerify}
        />

        {result && (
          <section className="mt-8 grid gap-6">
            <SectionLabel>Overall</SectionLabel>

            <OverallResultCard
              result={result}
              score={score}
              label={label}
              onExport={() => exportMarkdownReport(result)}
            />

            <BeliefMassBar beliefMass={result.belief_mass} />

            <div className="grid gap-4 md:grid-cols-2">
              <TemporalTimeline
                sources={result.sources}
                summary={result.temporal_summary}
              />
              <ProvenanceSummaryCard summary={result.provenance_summary} sources={result.sources} />
            </div>

            <SectionLabel>Detail</SectionLabel>

            <EvidenceMapPanel items={sortedEvidenceMap} />
            <AtomicClaimChecklist claims={sortedAtomicClaims} />
            <DeltaSignalsPanel signals={result.delta_signals} />

            <SectionLabel>More Detail</SectionLabel>

            <EvidenceGraphSummary graph={result.evidence_graph} />
            <ScoringBreakdownPanel scoring={result.scoring_breakdown} />
            <SourceEvidenceMatrix sources={sortedSources} />
            <RetrievedSourcesPanel sources={sortedSources} />
            <SystemNotesPanel notes={result.system_notes} />
          </section>
        )}
      </section>
    </main>
  );
}
