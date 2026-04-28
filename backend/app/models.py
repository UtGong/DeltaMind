from pydantic import BaseModel
from typing import List, Literal, Optional


class VerifyRequest(BaseModel):
    claim: str
    domain: Optional[str] = "general_web"


class SourceItem(BaseModel):
    title: str
    url: str
    source_type: str
    credibility_score: int
    freshness_score: int
    stance: Literal["supports", "partially_supports", "contradicts", "unclear"]
    evidence_summary: str


class DeltaSignal(BaseModel):
    type: str
    description: str
    impact: Literal["positive", "negative", "neutral"]


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
