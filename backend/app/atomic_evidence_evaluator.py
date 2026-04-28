from typing import Dict, List, Literal

from app.models import AtomicClaim, SourceItem
from app.ai_stance_classifier import classify_stance_with_ai


AtomicStance = Literal["supports", "partially_supports", "contradicts", "unclear"]


def source_weight(source: SourceItem) -> float:
    """
    Simplified provenance-aware source weight.
    This mirrors the broader scoring model but is local to atomic-claim evaluation.
    """
    authority = source.authority_score / 100
    credibility = source.credibility_score / 100
    freshness = source.freshness_score / 100
    independence = source.independence_score

    return authority * credibility * freshness * independence


def rank_sources_for_atomic_evaluation(sources: List[SourceItem], max_sources: int = 5) -> List[SourceItem]:
    """
    Limit Gemini calls by evaluating the strongest sources first.
    """
    return sorted(
        sources,
        key=lambda s: (
            -s.authority_score,
            -s.credibility_score,
            -s.independence_score,
            s.source_tier,
        ),
    )[:max_sources]


def fallback_atomic_stance(atomic_claim: str, evidence_text: str) -> AtomicStance:
    """
    Conservative fallback if Gemini fails.
    It intentionally prefers unclear over supports.
    """
    claim_terms = {
        w.lower().strip(".,:;!?()[]{}")
        for w in atomic_claim.split()
        if len(w.strip(".,:;!?()[]{}")) > 3
    }

    evidence_terms = {
        w.lower().strip(".,:;!?()[]{}")
        for w in evidence_text.split()
        if len(w.strip(".,:;!?()[]{}")) > 3
    }

    if not claim_terms:
        return "unclear"

    overlap = len(claim_terms.intersection(evidence_terms)) / len(claim_terms)

    contradiction_terms = [
        "denies",
        "denied",
        "false",
        "not true",
        "no evidence",
        "rejects",
        "rejected",
        "rumor",
        "misleading",
        "cancelled",
        "canceled",
        "not planning",
        "no plan",
        "has not announced",
    ]

    evidence_l = evidence_text.lower()

    if any(term in evidence_l for term in contradiction_terms):
        return "contradicts"

    if overlap >= 0.65:
        return "partially_supports"

    return "unclear"


def classify_atomic_claim_against_source(
    atomic_claim: str,
    source: SourceItem,
) -> Dict:
    evidence_text = (
        source.raw_evidence_text
        or source.evidence_summary
        or ""
    )

    ai_result = classify_stance_with_ai(
        claim=atomic_claim,
        evidence_text=evidence_text,
        source_title=source.title,
    )

    if ai_result:
        return {
            "source_id": source.id,
            "stance": ai_result.stance,
            "confidence": ai_result.confidence,
            "reasoning": ai_result.reasoning,
            "weight": source_weight(source),
            "used_ai": True,
        }

    stance = fallback_atomic_stance(atomic_claim, evidence_text)

    return {
        "source_id": source.id,
        "stance": stance,
        "confidence": 45,
        "reasoning": "Fallback heuristic used for atomic-claim stance classification.",
        "weight": source_weight(source),
        "used_ai": False,
    }


def aggregate_atomic_evidence(
    atomic_claim: AtomicClaim,
    evaluations: List[Dict],
) -> AtomicClaim:
    support_ids: List[str] = []
    conflict_ids: List[str] = []

    support_mass = 0.0
    refute_mass = 0.0
    unclear_mass = 0.0

    support_count = 0
    partial_count = 0
    refute_count = 0
    unclear_count = 0

    reasoning_fragments: List[str] = []

    for ev in evaluations:
        stance = ev["stance"]
        confidence_factor = max(0.2, ev["confidence"] / 100)
        weighted_value = ev["weight"] * confidence_factor

        if stance == "supports":
            support_mass += weighted_value
            support_count += 1
            support_ids.append(ev["source_id"])
        elif stance == "partially_supports":
            support_mass += weighted_value * 0.55
            partial_count += 1
            support_ids.append(ev["source_id"])
        elif stance == "contradicts":
            refute_mass += weighted_value * 1.2
            refute_count += 1
            conflict_ids.append(ev["source_id"])
        else:
            unclear_mass += weighted_value * 0.5
            unclear_count += 1

        if len(reasoning_fragments) < 2 and ev.get("reasoning"):
            reasoning_fragments.append(f"{ev['source_id']}: {ev['reasoning']}")

    if refute_count > 0 and support_count == 0 and partial_count == 0:
        status = "contradicted"
        confidence_score = max(15, min(45, int(35 - support_mass * 10 + refute_mass * 20)))
        explanation = (
            f"This atomic claim is contradicted by {refute_count} source(s), "
            "with no direct supporting source found."
        )

    elif support_count >= 2 and support_mass > refute_mass * 1.5:
        status = "verified"
        confidence_score = min(92, int(72 + support_mass * 18 - refute_mass * 10))
        explanation = (
            f"This atomic claim is supported by {support_count} source(s), "
            "including independently weighted evidence."
        )

    elif support_count >= 1 or partial_count >= 2:
        status = "partially_verified"
        confidence_score = min(78, int(55 + support_mass * 20 - refute_mass * 10))
        explanation = (
            f"This atomic claim has some support, but evidence is not strong enough "
            f"for full verification. Direct supports: {support_count}; partial supports: {partial_count}."
        )

    elif unclear_count >= max(1, len(evaluations) * 0.6):
        status = "uncorroborated"
        confidence_score = 35
        explanation = (
            "Most evaluated sources are only topically related or insufficient. "
            "No strong direct evidence was found for this atomic claim."
        )

    else:
        status = "uncertain"
        confidence_score = 45
        explanation = (
            "The available evidence is mixed or insufficient for this atomic claim."
        )

    if reasoning_fragments:
        explanation += " Key reasoning: " + " | ".join(reasoning_fragments)

    missing_evidence = None
    if status in ["uncorroborated", "uncertain"]:
        missing_evidence = "No strong direct evidence was found for this atomic claim."

    return AtomicClaim(
        id=atomic_claim.id,
        text=atomic_claim.text,
        role=atomic_claim.role,
        status=status,
        confidence_score=max(0, min(100, confidence_score)),
        explanation=explanation,
        supporting_source_ids=support_ids,
        conflicting_source_ids=conflict_ids,
        missing_evidence=missing_evidence,
    )


def evaluate_atomic_claims_against_sources(
    atomic_claims: List[AtomicClaim],
    sources: List[SourceItem],
    max_sources_per_claim: int = 5,
) -> List[AtomicClaim]:
    """
    Evaluates each atomic claim against the strongest retrieved sources.
    This is the first version of per-atomic-claim evidence triangulation.
    """
    ranked_sources = rank_sources_for_atomic_evaluation(
        sources=sources,
        max_sources=max_sources_per_claim,
    )

    evaluated_claims: List[AtomicClaim] = []

    for atomic_claim in atomic_claims:
        evaluations = [
            classify_atomic_claim_against_source(
                atomic_claim=atomic_claim.text,
                source=source,
            )
            for source in ranked_sources
        ]

        evaluated_claims.append(
            aggregate_atomic_evidence(
                atomic_claim=atomic_claim,
                evaluations=evaluations,
            )
        )

    return evaluated_claims
