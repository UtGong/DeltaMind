export type SourceItem = {
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

  stance_confidence?: number | null;
  stance_reasoning?: string | null;
  raw_evidence_text?: string | null;

  similarity_group?: string | null;
  independence_reason?: string | null;

  normalized_domain?: string | null;
  reliability_prior?: number | null;
  bias_risk?: string | null;
  authority_reason?: string | null;

  detected_publication_year?: number | null;
  detected_event_years?: number[];
  temporal_status?: string | null;
  temporal_decay_score?: number | null;

  detected_origin?: string | null;
  citation_links?: string[];
};

export type DeltaSignal = {
  type: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
};

export type AtomicClaim = {
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

export type EvidenceMapItem = {
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

export type ScoringBreakdown = {
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

export type BeliefMass = {
  belief: number;
  disbelief: number;
  uncertainty: number;
  trust_index: number;
  explanation: string;
};

export type EvidenceGraphNode = {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, unknown>;
};

export type EvidenceGraphEdge = {
  source: string;
  target: string;
  relation: string;
  weight?: number | null;
  metadata: Record<string, unknown>;
};

export type EvidenceGraph = {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
};

export type VerifyResponse = {
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

  belief_mass?: BeliefMass | null;
  evidence_graph?: EvidenceGraph | null;
  temporal_summary?: string | null;
  provenance_summary?: string | null;

  system_notes?: string[];
};
