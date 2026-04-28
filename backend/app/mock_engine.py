from app.models import VerifyResponse, SourceItem, DeltaSignal


def get_confidence_label(score: int) -> str:
    if score >= 75:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def verify_claim_mock(claim: str, domain: str = "general_web") -> VerifyResponse:
    sources = [
        SourceItem(
            title="Official company announcement",
            url="https://example.com/company-announcement",
            source_type="official_source",
            credibility_score=92,
            freshness_score=88,
            stance="supports",
            evidence_summary="The source directly supports the claim and provides a recent announcement."
        ),
        SourceItem(
            title="Industry news report",
            url="https://example.com/industry-news",
            source_type="news_media",
            credibility_score=78,
            freshness_score=82,
            stance="partially_supports",
            evidence_summary="The source reports a similar event, but uses less specific language."
        ),
        SourceItem(
            title="Gaming market blog",
            url="https://example.com/gaming-blog",
            source_type="industry_blog",
            credibility_score=61,
            freshness_score=70,
            stance="unclear",
            evidence_summary="The source mentions related market activity but does not clearly confirm the claim."
        ),
        SourceItem(
            title="Older third-party article",
            url="https://example.com/older-article",
            source_type="third_party",
            credibility_score=52,
            freshness_score=35,
            stance="contradicts",
            evidence_summary="The source contains older information that appears inconsistent with the newer sources."
        ),
    ]

    delta_signals = [
        DeltaSignal(
            type="cross_source_agreement",
            description="Two sources support or partially support the claim.",
            impact="positive"
        ),
        DeltaSignal(
            type="source_credibility_gap",
            description="The strongest support comes from a high-credibility official source, while weaker sources are less certain.",
            impact="positive"
        ),
        DeltaSignal(
            type="freshness_difference",
            description="One conflicting source appears outdated compared with newer supporting sources.",
            impact="neutral"
        ),
        DeltaSignal(
            type="contradiction_signal",
            description="One source provides conflicting older information, so the claim should not be treated as fully verified.",
            impact="negative"
        ),
    ]

    confidence_score = 76

    return VerifyResponse(
        input_claim=claim,
        normalized_claim=claim.strip(),
        domain=domain,
        confidence_score=confidence_score,
        confidence_label=get_confidence_label(confidence_score),
        verdict="Likely reliable, but not fully verified.",
        sources=sources,
        delta_signals=delta_signals,
        explanation=(
            "The claim is supported by a high-credibility official source and partially supported by "
            "an industry news source. However, one older third-party source appears inconsistent, and "
            "one lower-credibility source is unclear. Overall, the source-delta pattern suggests medium-high confidence."
        )
    )
