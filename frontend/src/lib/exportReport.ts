import type { VerifyResponse } from "@/types/verification";

export function exportMarkdownReport(result: VerifyResponse) {
  const lines = [
    `# DeltaMind Verification Report`,
    ``,
    `## Claim`,
    result.input_claim,
    ``,
    `## Verdict`,
    `- Trust Index: ${result.trust_index ?? result.confidence_score}`,
    `- Label: ${result.trust_label ?? result.verdict}`,
    `- Confidence: ${result.confidence_label}`,
    ``,
    `## Explanation`,
    result.explanation,
    ``,
    `## Belief Mass`,
    result.belief_mass
      ? `- Belief: ${result.belief_mass.belief}\n- Disbelief: ${result.belief_mass.disbelief}\n- Uncertainty: ${result.belief_mass.uncertainty}\n- Explanation: ${result.belief_mass.explanation}`
      : `Not available`,
    ``,
    `## Temporal Summary`,
    result.temporal_summary ?? "Not available",
    ``,
    `## Provenance Summary`,
    result.provenance_summary ?? "Not available",
    ``,
    `## Atomic Claims`,
    ...(result.atomic_claims ?? []).map(
      (item) =>
        `- [${item.status}] ${item.text}\n  - Confidence: ${item.confidence_score}\n  - ${item.explanation}`
    ),
    ``,
    `## Sources`,
    ...result.sources.map(
      (source) =>
        `- ${source.title}\n  - URL: ${source.url}\n  - Stance: ${source.stance}\n  - Role: ${source.source_role}\n  - Reliability prior: ${source.reliability_prior ?? "N/A"}\n  - Independence: ${source.independence_score ?? "N/A"}`
    ),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/markdown;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "deltamind-verification-report.md";
  link.click();
  URL.revokeObjectURL(url);
}
