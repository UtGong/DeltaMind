from pydantic import BaseModel, Field
from typing import List, Literal, Optional


SourceStance = Literal[
    "supports",
    "partially_supports",
    "contradicts",
    "unclear"
]

ClaimStatus = Literal[
    "verified",
    "partially_verified",
    "uncorroborated",
    "contradicted",
    "uncertain"
]

ImpactType = Literal["positive", "negative", "neutral"]


class VerifyRequest(BaseModel):
    claim: str
    domain: Optional[str] = "general_web"


class SourceItem(BaseModel):
    id: str
    title: str
    url: str
    source_type: str

    credibility_score: int
    freshness_score: int
    stance: SourceStance
    evidence_summary: str

    source_tier: int
    source_role: str
    authority_score: int
    independence_score: float
    provenance_origin: str
    published_date: Optional[str] = None
    evidence_type: str
    copied_from: Optional[str] = None
    stance_confidence: Optional[int] = None
    stance_reasoning: Optional[str] = None
    raw_evidence_text: Optional[str] = None

    # Source independence / echo-chamber analysis
    similarity_group: Optional[str] = None
    independence_reason: Optional[str] = None

    # Source authority / reliability prior
    normalized_domain: Optional[str] = None
    reliability_prior: Optional[float] = None
    bias_risk: Optional[str] = None
    authority_reason: Optional[str] = None

    # Temporal reasoning
    detected_publication_year: Optional[int] = None
    detected_event_years: List[int] = Field(default_factory=list)
    temporal_status: Optional[str] = None
    temporal_decay_score: Optional[float] = None

    # Strong provenance / citation tracing
    detected_origin: Optional[str] = None
    citation_links: List[str] = Field(default_factory=list)


class DeltaSignal(BaseModel):
    type: str
    description: str
    impact: ImpactType


class AtomicClaim(BaseModel):
    id: str
    text: str
    role: Literal["core", "supporting_detail", "contextual_detail"]
    status: ClaimStatus
    confidence_score: int
    explanation: str
    supporting_source_ids: List[str] = Field(default_factory=list)
    conflicting_source_ids: List[str] = Field(default_factory=list)
    missing_evidence: Optional[str] = None


class EvidenceMapItem(BaseModel):
    status: ClaimStatus
    label: str
    description: str
    related_atomic_claim_ids: List[str] = Field(default_factory=list)


class ScoringBreakdown(BaseModel):
    authority_score: float
    evidence_directness_score: float
    independent_corroboration_score: float
    provenance_clarity_score: float
    recency_score: float
    atomic_claim_coverage_score: float
    contradiction_penalty: float
    echo_chamber_penalty: float
    missing_evidence_penalty: float
    final_score: int


class BeliefMass(BaseModel):
    belief: float
    disbelief: float
    uncertainty: float
    trust_index: int
    explanation: str


class EvidenceGraphNode(BaseModel):
    id: str
    type: str
    label: str
    metadata: dict = Field(default_factory=dict)


class EvidenceGraphEdge(BaseModel):
    source: str
    target: str
    relation: str
    weight: Optional[float] = None
    metadata: dict = Field(default_factory=dict)


class EvidenceGraph(BaseModel):
    nodes: List[EvidenceGraphNode] = Field(default_factory=list)
    edges: List[EvidenceGraphEdge] = Field(default_factory=list)


class VerifyResponse(BaseModel):
    input_claim: str
    normalized_claim: str
    domain: str

    confidence_score: int
    confidence_label: Literal["High", "Medium", "Low"]
    verdict: str
    sources: List[SourceItem]
    delta_signals: List[DeltaSignal]
    explanation: str

    trust_index: int
    trust_label: str
    ledger_summary: str
    atomic_claims: List[AtomicClaim]
    evidence_map: List[EvidenceMapItem]
    scoring_breakdown: ScoringBreakdown

    # Research-grade technical framework outputs
    belief_mass: Optional[BeliefMass] = None
    evidence_graph: Optional[EvidenceGraph] = None
    temporal_summary: Optional[str] = None
    provenance_summary: Optional[str] = None

    system_notes: List[str] = Field(default_factory=list)
