import re
from datetime import datetime
from typing import List, Optional

from app.models import SourceItem


CURRENT_YEAR = datetime.now().year


def extract_years(text: str) -> List[int]:
    years = re.findall(r"\b(?:19|20)\d{2}\b", text or "")
    return sorted(set(int(y) for y in years))


def detect_claim_event_years(claim: str) -> List[int]:
    return extract_years(claim)


def estimate_publication_year(source: SourceItem) -> Optional[int]:
    text = " ".join(
        [
            source.published_date or "",
            source.title or "",
            source.raw_evidence_text or "",
            source.evidence_summary or "",
        ]
    )

    years = extract_years(text)
    if not years:
        return None

    # Prefer recent-looking article years, not old historical years.
    plausible = [y for y in years if 2000 <= y <= CURRENT_YEAR + 2]
    if not plausible:
        return None

    return max(plausible)


def compute_temporal_decay(source_year: Optional[int], claim_event_years: List[int]) -> float:
    if source_year is None:
        return 0.65

    age = max(0, CURRENT_YEAR - source_year)

    # Base source freshness decay.
    if age <= 1:
        base = 1.0
    elif age <= 2:
        base = 0.85
    elif age <= 4:
        base = 0.65
    else:
        base = 0.45

    # If the claim contains an event year and the source does not match or approach it,
    # lower temporal confidence.
    if claim_event_years:
        if source_year in claim_event_years:
            return min(1.0, base + 0.1)

        # Source before a future event can still be relevant if reporting planned event.
        if any(source_year <= event_year for event_year in claim_event_years):
            return base * 0.85

        return base * 0.7

    return base


def temporal_status(source_year: Optional[int], claim_event_years: List[int]) -> str:
    if source_year is None:
        return "publication_time_unknown"

    if not claim_event_years:
        if CURRENT_YEAR - source_year <= 1:
            return "recent_source"
        return "older_source"

    if source_year in claim_event_years:
        return "matches_claim_event_year"

    if any(source_year < y for y in claim_event_years):
        return "source_before_claim_event_year"

    if any(source_year > y for y in claim_event_years):
        return "source_after_claim_event_year"

    return "temporal_relation_unclear"


def apply_temporal_reasoning(sources: List[SourceItem], claim: str) -> List[SourceItem]:
    claim_years = detect_claim_event_years(claim)

    for source in sources:
        source_year = estimate_publication_year(source)
        decay = compute_temporal_decay(source_year, claim_years)

        source.detected_publication_year = source_year
        source.detected_event_years = claim_years
        source.temporal_decay_score = round(decay, 3)
        source.temporal_status = temporal_status(source_year, claim_years)

        # Keep old freshness field aligned with temporal score.
        source.freshness_score = max(0, min(100, int(decay * 100)))

    return sources


def build_temporal_summary(sources: List[SourceItem], claim: str) -> str:
    claim_years = detect_claim_event_years(claim)
    unknown = sum(1 for s in sources if s.detected_publication_year is None)
    recent = sum(1 for s in sources if s.temporal_status == "recent_source")
    matching = sum(1 for s in sources if s.temporal_status == "matches_claim_event_year")
    before = sum(1 for s in sources if s.temporal_status == "source_before_claim_event_year")

    if claim_years:
        return (
            f"Claim event year(s): {claim_years}. "
            f"{matching} source(s) mention the same event year, "
            f"{before} source(s) appear before the claim event year, "
            f"and {unknown} source(s) have unclear publication timing."
        )

    return (
        f"No explicit event year was found in the claim. "
        f"{recent} source(s) appear recent and {unknown} source(s) have unclear publication timing."
    )
