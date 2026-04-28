from typing import List, Tuple
from app.real_source_adapter import real_sources_from_web

from app.models import (
    AtomicClaim,
    DeltaSignal,
    EvidenceMapItem,
    ScoringBreakdown,
    SourceItem,
    VerifyResponse,
)


def get_confidence_label(score: int) -> str:
    if score >= 75:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def get_trust_label(score: int) -> str:
    if score >= 85:
        return "Highly reliable"
    if score >= 70:
        return "Likely reliable"
    if score >= 55:
        return "Partially verified"
    if score >= 40:
        return "Uncertain"
    if score >= 20:
        return "Weakly supported"
    return "Contradicted / unreliable"


def source_effective_weight(source: SourceItem) -> float:
    authority = source.authority_score / 100
    credibility = source.credibility_score / 100
    freshness = source.freshness_score / 100
    independence = source.independence_score
    return authority * credibility * freshness * independence


def stance_value(source: SourceItem) -> float:
    if source.stance == "supports":
        return 1.0
    if source.stance == "partially_supports":
        return 0.55
    if source.stance == "contradicts":
        return -1.0
    return 0.0


def select_mock_scenario(claim: str, domain: str) -> str:
    claim_l = claim.lower()

    if "license" in claim_l or "regulator" in claim_l or "approval" in claim_l:
        return "license_claim"

    if "partnership" in claim_l or "partnered" in claim_l or "collaboration" in claim_l:
        return "partnership_claim"

    if domain == "gaming_industry":
        return "gaming_general_claim"

    return "general_web_claim"


def build_sources_for_scenario(scenario: str) -> List[SourceItem]:
    if scenario == "license_claim":
        return [
            SourceItem(
                id="s1",
                title="Macau regulatory announcement",
                url="https://example.com/macau-regulator-license",
                source_type="regulatory_source",
                credibility_score=96,
                freshness_score=92,
                stance="supports",
                evidence_summary="The regulatory source directly confirms that the license was approved.",
                source_tier=0,
                source_role="Regulatory / legal authority",
                authority_score=98,
                independence_score=1.0,
                provenance_origin="Primary regulatory record",
                published_date="2026-04-20",
                evidence_type="official_document",
            ),
            SourceItem(
                id="s2",
                title="Company press release",
                url="https://example.com/company-license-release",
                source_type="official_company_source",
                credibility_score=88,
                freshness_score=90,
                stance="supports",
                evidence_summary="The company states that it received the license.",
                source_tier=1,
                source_role="Official company source",
                authority_score=86,
                independence_score=0.85,
                provenance_origin="Company announcement",
                published_date="2026-04-20",
                evidence_type="direct_statement",
            ),
            SourceItem(
                id="s3",
                title="Gaming industry report",
                url="https://example.com/gaming-industry-license-report",
                source_type="industry_press",
                credibility_score=76,
                freshness_score=88,
                stance="partially_supports",
                evidence_summary="The industry report discusses the license but relies heavily on the company statement.",
                source_tier=3,
                source_role="Specialized gaming industry press",
                authority_score=70,
                independence_score=0.45,
                provenance_origin="Derived from company announcement",
                published_date="2026-04-21",
                evidence_type="reported_fact",
                copied_from="s2",
            ),
            SourceItem(
                id="s4",
                title="Older market rumor blog",
                url="https://example.com/older-license-rumor",
                source_type="blog",
                credibility_score=42,
                freshness_score=30,
                stance="contradicts",
                evidence_summary="The older source says the license was still pending, but it predates the regulatory update.",
                source_tier=4,
                source_role="Aggregator / blog / forum",
                authority_score=35,
                independence_score=0.4,
                provenance_origin="Unclear",
                published_date="2026-02-01",
                evidence_type="unclear_mention",
            ),
        ]

    if scenario == "partnership_claim":
        return [
            SourceItem(
                id="s1",
                title="Official company announcement",
                url="https://example.com/company-partnership",
                source_type="official_company_source",
                credibility_score=90,
                freshness_score=88,
                stance="supports",
                evidence_summary="The official source confirms the partnership between the two companies.",
                source_tier=1,
                source_role="Official company source",
                authority_score=86,
                independence_score=1.0,
                provenance_origin="Primary company announcement",
                published_date="2026-04-18",
                evidence_type="direct_statement",
            ),
            SourceItem(
                id="s2",
                title="Independent business news report",
                url="https://example.com/business-news-partnership",
                source_type="independent_news",
                credibility_score=84,
                freshness_score=85,
                stance="supports",
                evidence_summary="The business news source independently reports the partnership.",
                source_tier=2,
                source_role="Independent high-quality news",
                authority_score=82,
                independence_score=0.9,
                provenance_origin="Independent reporting",
                published_date="2026-04-19",
                evidence_type="reported_fact",
            ),
            SourceItem(
                id="s3",
                title="Gaming industry analysis",
                url="https://example.com/gaming-analysis-product",
                source_type="industry_press",
                credibility_score=74,
                freshness_score=80,
                stance="partially_supports",
                evidence_summary="The source supports the partnership but only partially confirms the product details.",
                source_tier=3,
                source_role="Specialized gaming industry press",
                authority_score=70,
                independence_score=0.65,
                provenance_origin="Industry analysis",
                published_date="2026-04-19",
                evidence_type="background_context",
            ),
            SourceItem(
                id="s4",
                title="Aggregator repost",
                url="https://example.com/aggregator-repost",
                source_type="aggregator",
                credibility_score=50,
                freshness_score=82,
                stance="supports",
                evidence_summary="The aggregator repeats the same claim but appears to derive from the official announcement.",
                source_tier=4,
                source_role="Aggregator / repost",
                authority_score=38,
                independence_score=0.2,
                provenance_origin="Derived from official announcement",
                published_date="2026-04-20",
                evidence_type="repost",
                copied_from="s1",
            ),
            SourceItem(
                id="s5",
                title="Older local report",
                url="https://example.com/older-local-report",
                source_type="local_news",
                credibility_score=62,
                freshness_score=45,
                stance="contradicts",
                evidence_summary="The older source reports a different launch location, creating a detail-level conflict.",
                source_tier=3,
                source_role="Local news",
                authority_score=60,
                independence_score=0.75,
                provenance_origin="Local reporting",
                published_date="2026-03-05",
                evidence_type="reported_fact",
            ),
        ]

    return [
        SourceItem(
            id="s1",
            title="General web source A",
            url="https://example.com/general-source-a",
            source_type="independent_news",
            credibility_score=76,
            freshness_score=80,
            stance="partially_supports",
            evidence_summary="This source partially supports the claim but does not confirm all details.",
            source_tier=2,
            source_role="Independent news",
            authority_score=76,
            independence_score=0.8,
            provenance_origin="Independent reporting",
            published_date="2026-04-10",
            evidence_type="reported_fact",
        ),
        SourceItem(
            id="s2",
            title="General web source B",
            url="https://example.com/general-source-b",
            source_type="blog",
            credibility_score=48,
            freshness_score=78,
            stance="unclear",
            evidence_summary="This source mentions related entities but does not directly verify the claim.",
            source_tier=4,
            source_role="Blog / commentary",
            authority_score=40,
            independence_score=0.6,
            provenance_origin="Unclear",
            published_date="2026-04-11",
            evidence_type="unclear_mention",
        ),
        SourceItem(
            id="s3",
            title="General web source C",
            url="https://example.com/general-source-c",
            source_type="aggregator",
            credibility_score=45,
            freshness_score=76,
            stance="supports",
            evidence_summary="This source repeats the claim but appears to depend on another source.",
            source_tier=4,
            source_role="Aggregator",
            authority_score=35,
            independence_score=0.25,
            provenance_origin="Derived from source A",
            published_date="2026-04-11",
            evidence_type="repost",
            copied_from="s1",
        ),
    ]


def build_atomic_claims(scenario: str) -> List[AtomicClaim]:
    if scenario == "license_claim":
        return [
            AtomicClaim(
                id="c1",
                text="The company received a gaming license.",
                role="core",
                status="verified",
                confidence_score=90,
                explanation="Confirmed by a regulatory source and supported by the company announcement.",
                supporting_source_ids=["s1", "s2"],
                conflicting_source_ids=["s4"],
            ),
            AtomicClaim(
                id="c2",
                text="The license is associated with Macau.",
                role="supporting_detail",
                status="verified",
                confidence_score=88,
                explanation="The regulatory source directly connects the approval to Macau.",
                supporting_source_ids=["s1"],
            ),
            AtomicClaim(
                id="c3",
                text="The approval is recent.",
                role="contextual_detail",
                status="partially_verified",
                confidence_score=74,
                explanation="Recent sources support the timing, while one older source is outdated.",
                supporting_source_ids=["s1", "s2", "s3"],
                conflicting_source_ids=["s4"],
            ),
        ]

    if scenario == "partnership_claim":
        return [
            AtomicClaim(
                id="c1",
                text="Company X partnered with Company Y.",
                role="core",
                status="verified",
                confidence_score=86,
                explanation="The core partnership is confirmed by an official source and an independent business news report.",
                supporting_source_ids=["s1", "s2"],
            ),
            AtomicClaim(
                id="c2",
                text="The partnership involves a specific gaming product or platform.",
                role="supporting_detail",
                status="partially_verified",
                confidence_score=66,
                explanation="The product detail is mentioned by industry analysis, but not fully confirmed across all high-authority sources.",
                supporting_source_ids=["s3"],
            ),
            AtomicClaim(
                id="c3",
                text="The launch location is Macau.",
                role="supporting_detail",
                status="uncorroborated",
                confidence_score=45,
                explanation="The Macau detail is weakly supported and not confirmed by the strongest sources.",
                supporting_source_ids=[],
                conflicting_source_ids=["s5"],
                missing_evidence="No regulatory or official local source confirms this detail.",
            ),
            AtomicClaim(
                id="c4",
                text="The launch date is next Tuesday.",
                role="contextual_detail",
                status="uncertain",
                confidence_score=40,
                explanation="No high-authority source clearly confirms the exact date.",
                supporting_source_ids=[],
                missing_evidence="The exact date is not confirmed by primary or independent sources.",
            ),
        ]

    return [
        AtomicClaim(
            id="c1",
            text="The main claim is reported online.",
            role="core",
            status="partially_verified",
            confidence_score=58,
            explanation="Some sources mention the claim, but support is incomplete and provenance is unclear.",
            supporting_source_ids=["s1", "s3"],
        ),
        AtomicClaim(
            id="c2",
            text="The claim is independently corroborated.",
            role="supporting_detail",
            status="uncertain",
            confidence_score=42,
            explanation="Several sources appear related, but independence is weak.",
            supporting_source_ids=["s1"],
            missing_evidence="No strong primary source was found.",
        ),
    ]


def compute_scoring_breakdown(
    sources: List[SourceItem],
    atomic_claims: List[AtomicClaim],
) -> ScoringBreakdown:
    weighted_support = 0.0
    weighted_refute = 0.0
    uncertainty = 0.0

    for source in sources:
        weight = source_effective_weight(source)
        stance = stance_value(source)

        if stance > 0:
            weighted_support += weight * stance
        elif stance < 0:
            weighted_refute += abs(weight * stance)
        else:
            uncertainty += weight * 0.5

    verified_claims = sum(1 for c in atomic_claims if c.status == "verified")
    partial_claims = sum(1 for c in atomic_claims if c.status == "partially_verified")
    contradicted_claims = sum(1 for c in atomic_claims if c.status == "contradicted")
    weak_claims = sum(1 for c in atomic_claims if c.status in ["uncorroborated", "uncertain"])

    total_claims = max(len(atomic_claims), 1)

    authority_score = min(20, weighted_support * 20)
    evidence_directness_score = min(
        15,
        sum(1 for s in sources if s.evidence_type in ["official_document", "direct_statement"]) * 6,
    )
    independent_corroboration_score = min(
        15,
        sum(1 for s in sources if s.independence_score >= 0.75 and s.stance in ["supports", "partially_supports"]) * 5,
    )
    provenance_clarity_score = min(
        15,
        sum(1 for s in sources if s.provenance_origin.lower() not in ["unclear", "unknown"]) * 3,
    )
    recency_score = min(
        10,
        sum(s.freshness_score for s in sources) / max(len(sources), 1) / 10,
    )
    atomic_claim_coverage_score = (
        ((verified_claims * 1.0) + (partial_claims * 0.6)) / total_claims
    ) * 15

    contradiction_penalty = min(15, weighted_refute * 20 + contradicted_claims * 5)
    echo_chamber_penalty = min(
        15,
        sum(1 for s in sources if s.copied_from is not None or s.independence_score <= 0.3) * 4,
    )
    missing_evidence_penalty = min(15, weak_claims * 4)

    raw_score = (
        authority_score
        + evidence_directness_score
        + independent_corroboration_score
        + provenance_clarity_score
        + recency_score
        + atomic_claim_coverage_score
        - contradiction_penalty
        - echo_chamber_penalty
        - missing_evidence_penalty
    )

    final_score = max(0, min(100, round(raw_score)))

    return ScoringBreakdown(
        authority_score=round(authority_score, 2),
        evidence_directness_score=round(evidence_directness_score, 2),
        independent_corroboration_score=round(independent_corroboration_score, 2),
        provenance_clarity_score=round(provenance_clarity_score, 2),
        recency_score=round(recency_score, 2),
        atomic_claim_coverage_score=round(atomic_claim_coverage_score, 2),
        contradiction_penalty=round(contradiction_penalty, 2),
        echo_chamber_penalty=round(echo_chamber_penalty, 2),
        missing_evidence_penalty=round(missing_evidence_penalty, 2),
        final_score=final_score,
    )


def build_delta_signals(sources: List[SourceItem]) -> List[DeltaSignal]:
    signals = []

    if any(s.source_tier == 0 and s.stance == "supports" for s in sources):
        signals.append(
            DeltaSignal(
                type="regulatory_authority",
                description="A regulatory or legal authority directly supports the core claim.",
                impact="positive",
            )
        )

    if any(s.source_tier <= 1 and s.stance == "supports" for s in sources):
        signals.append(
            DeltaSignal(
                type="primary_source_support",
                description="At least one primary or official source supports the claim.",
                impact="positive",
            )
        )

    copied_count = sum(1 for s in sources if s.copied_from is not None or s.independence_score <= 0.3)
    if copied_count > 0:
        signals.append(
            DeltaSignal(
                type="echo_chamber_risk",
                description=f"{copied_count} source(s) appear to repeat or derive from another source, so they should not be counted as fully independent evidence.",
                impact="negative",
            )
        )

    if any(s.stance == "contradicts" for s in sources):
        signals.append(
            DeltaSignal(
                type="contradiction_signal",
                description="At least one source contradicts part of the claim. The system checks whether the contradiction is outdated or detail-level.",
                impact="negative",
            )
        )

    if any(s.freshness_score < 50 and s.stance == "contradicts" for s in sources):
        signals.append(
            DeltaSignal(
                type="temporal_decay",
                description="One contradictory source appears outdated compared with newer supporting evidence.",
                impact="neutral",
            )
        )

    signals.append(
        DeltaSignal(
            type="claim_level_ledger",
            description="The system evaluates the claim through atomic claims rather than treating the full sentence as one undivided statement.",
            impact="positive",
        )
    )

    return signals


def build_evidence_map(atomic_claims: List[AtomicClaim]) -> List[EvidenceMapItem]:
    label_map = {
        "verified": "Verified",
        "partially_verified": "Partially verified",
        "uncorroborated": "Uncorroborated",
        "contradicted": "Contradicted",
        "uncertain": "Uncertain",
    }

    return [
        EvidenceMapItem(
            status=claim.status,
            label=label_map[claim.status],
            description=f"{claim.text} — {claim.explanation}",
            related_atomic_claim_ids=[claim.id],
        )
        for claim in atomic_claims
    ]


def build_explanation(
    trust_label: str,
    score: int,
    sources: List[SourceItem],
    atomic_claims: List[AtomicClaim],
) -> Tuple[str, str]:
    primary_support = [s for s in sources if s.source_tier <= 1 and s.stance == "supports"]
    copied_sources = [s for s in sources if s.copied_from is not None or s.independence_score <= 0.3]
    conflicts = [s for s in sources if s.stance == "contradicts"]
    weak_claims = [c for c in atomic_claims if c.status in ["uncorroborated", "uncertain", "contradicted"]]

    explanation = (
        f"DeltaMind assigns this claim a Trust Index of {score}/100 ({trust_label}). "
        f"The system found {len(primary_support)} high-authority supporting source(s), "
        f"{len(conflicts)} conflicting source(s), and {len(copied_sources)} source(s) with echo-chamber or dependency risk. "
        f"{len(weak_claims)} atomic claim(s) remain uncertain, uncorroborated, or contradicted."
    )

    ledger_summary = (
        "The verification ledger decomposes the input into atomic claims, maps each claim to source-level evidence, "
        "tracks source authority and provenance, detects repeated or dependent reporting, and calculates a trust index "
        "from support, contradiction, uncertainty, recency, and source independence."
    )

    return explanation, ledger_summary


def verify_claim_with_ledger(claim: str, domain: str = "general_web") -> VerifyResponse:
    scenario = select_mock_scenario(claim, domain)

    if domain in ["real_web", "real_gaming"]:
        real_domain = "gaming_industry" if domain == "real_gaming" else "general_web"
        sources = real_sources_from_web(claim=claim, domain=real_domain, max_results=8)
    else:
        sources = build_sources_for_scenario(scenario)
    use_real_mode = domain in ["real_web", "real_gaming"]

    atomic_claims = build_atomic_claims_from_ai_or_fallback(
        claim=claim,
        sources=sources,
        fallback_scenario=scenario,
        use_ai=use_real_mode,
    )
    scoring = compute_scoring_breakdown(sources, atomic_claims)

    score = scoring.final_score
    trust_label = get_trust_label(score)
    confidence_label = get_confidence_label(score)

    delta_signals = build_delta_signals(sources)
    evidence_map = build_evidence_map(atomic_claims)
    explanation, ledger_summary = build_explanation(
        trust_label=trust_label,
        score=score,
        sources=sources,
        atomic_claims=atomic_claims,
    )

    return VerifyResponse(
        input_claim=claim,
        normalized_claim=claim.strip(),
        domain=domain,
        confidence_score=score,
        confidence_label=confidence_label,
        verdict=trust_label,
        sources=sources,
        delta_signals=delta_signals,
        explanation=explanation,
        trust_index=score,
        trust_label=trust_label,
        ledger_summary=ledger_summary,
        atomic_claims=atomic_claims,
        evidence_map=evidence_map,
        scoring_breakdown=scoring,
        system_notes=[
            "This is a mocked prototype. Source retrieval and stance classification are simulated.",
            "The current scoring model is rule-based and designed for explainability.",
            "Future versions can replace mock sources with web retrieval and AI-based extraction/classification.",
        ],
    )


def build_atomic_claims_from_ai_or_fallback(
    claim: str,
    sources: List[SourceItem],
    fallback_scenario: str,
    use_ai: bool,
) -> List[AtomicClaim]:
    """
    Builds atomic claims for real-web modes using Gemini decomposition.
    Then assigns a simple status based on source-level stance evidence.

    This is still an early version:
    - decomposition is AI-based;
    - status assignment is rule-based from source stance;
    - later we can classify stance per atomic claim.
    """

    if not use_ai:
        return build_atomic_claims(fallback_scenario)

    try:
        from app.ai_claim_decomposer import decompose_claim_with_ai
        result = decompose_claim_with_ai(claim)
    except Exception as exc:
        print(f"[Atomic claim fallback] {exc}")
        result = None

    if not result or not result.atomic_claims:
        return build_atomic_claims(fallback_scenario)

    supporting_sources = [
        s.id for s in sources if s.stance in ["supports", "partially_supports"]
    ]
    conflicting_sources = [
        s.id for s in sources if s.stance == "contradicts"
    ]

    direct_support_count = sum(1 for s in sources if s.stance == "supports")
    partial_support_count = sum(1 for s in sources if s.stance == "partially_supports")
    contradiction_count = sum(1 for s in sources if s.stance == "contradicts")
    unclear_count = sum(1 for s in sources if s.stance == "unclear")

    atomic_claims: List[AtomicClaim] = []

    for idx, atomic in enumerate(result.atomic_claims, start=1):
        if direct_support_count >= 2 and contradiction_count == 0:
            status = "verified"
            confidence = 82
            explanation = (
                "Multiple sources support the broader claim, and no direct contradiction was detected. "
                "This atomic claim is treated as likely verified in the current prototype."
            )
        elif direct_support_count >= 1 and contradiction_count == 0:
            status = "partially_verified"
            confidence = 68
            explanation = (
                "At least one source supports the broader claim, but independent confirmation is limited."
            )
        elif partial_support_count >= 1 and contradiction_count == 0:
            status = "partially_verified"
            confidence = 58
            explanation = (
                "Some sources partially overlap with the broader claim, but direct evidence is limited."
            )
        elif contradiction_count > 0 and direct_support_count == 0:
            status = "contradicted"
            confidence = 28
            explanation = (
                "At least one source contradicts the broader claim, and no direct supporting source was detected."
            )
        elif unclear_count >= len(sources) * 0.6:
            status = "uncorroborated"
            confidence = 35
            explanation = (
                "Most retrieved sources are only topically related and do not directly verify this atomic claim."
            )
        else:
            status = "uncertain"
            confidence = 45
            explanation = (
                "The current evidence is mixed or insufficient for this atomic claim."
            )

        missing_evidence = None
        if status in ["uncorroborated", "uncertain"]:
            missing_evidence = "No strong direct evidence was found for this atomic claim."

        atomic_claims.append(
            AtomicClaim(
                id=f"c{idx}",
                text=atomic.text,
                role=atomic.role,
                status=status,
                confidence_score=confidence,
                explanation=explanation,
                supporting_source_ids=supporting_sources,
                conflicting_source_ids=conflicting_sources,
                missing_evidence=missing_evidence,
            )
        )

    return atomic_claims
