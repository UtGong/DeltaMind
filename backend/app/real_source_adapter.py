import re
from typing import List, Set

from app.models import SourceItem
from app.web_retriever import search_public_web
from app.page_fetcher import fetch_page_text
from app.evidence_extractor import extract_best_evidence_span


STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "will",
    "has", "have", "had", "was", "were", "are", "its", "their", "about",
    "new", "more", "than", "also", "been", "being", "they", "them"
}

ACTION_GROUPS = {
    "construction": {
        "build", "building", "built", "construct", "constructing",
        "construction", "develop", "developing", "development",
        "open", "opening", "launch", "launching", "new hotel",
        "new casino", "resort development"
    },
    "partnership": {
        "partner", "partnered", "partnership", "collaboration",
        "collaborate", "agreement", "joint venture", "strategic alliance"
    },
    "license": {
        "license", "licensed", "approval", "approved", "permit",
        "regulator", "regulatory", "authorization", "concession"
    },
    "acquisition": {
        "acquire", "acquired", "acquisition", "merge", "merger",
        "takeover", "purchase", "bought"
    },
}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_years(text: str) -> Set[str]:
    return set(re.findall(r"\b(?:19|20)\d{2}\b", text))


def tokenize_content_words(text: str) -> Set[str]:
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return {w for w in words if len(w) > 3 and w not in STOPWORDS}


def detect_action_groups(claim: str) -> Set[str]:
    claim_l = normalize_text(claim)
    matched = set()

    for group_name, terms in ACTION_GROUPS.items():
        for term in terms:
            if term in claim_l:
                matched.add(group_name)
                break

    return matched


def text_has_action_group(text: str, group_name: str) -> bool:
    text_l = normalize_text(text)
    return any(term in text_l for term in ACTION_GROUPS[group_name])


def keyword_overlap_score(claim: str, text: str) -> float:
    claim_terms = tokenize_content_words(claim)
    text_terms = tokenize_content_words(text)

    if not claim_terms:
        return 0.0

    overlap = claim_terms.intersection(text_terms)
    return len(overlap) / len(claim_terms)


def has_required_years(claim: str, evidence_text: str) -> bool:
    claim_years = extract_years(claim)

    if not claim_years:
        return True

    evidence_years = extract_years(evidence_text)
    return claim_years.issubset(evidence_years)


def has_required_actions(claim: str, evidence_text: str) -> bool:
    action_groups = detect_action_groups(claim)

    if not action_groups:
        return True

    return all(text_has_action_group(evidence_text, group) for group in action_groups)


def heuristic_stance(claim: str, evidence_text: str) -> str:
    evidence_l = normalize_text(evidence_text)

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
        "delayed",
        "denial",
        "not planning",
        "no plan",
        "has not announced",
    ]

    if any(term in evidence_l for term in contradiction_terms):
        return "contradicts"

    overlap = keyword_overlap_score(claim, evidence_text)
    year_match = has_required_years(claim, evidence_text)
    action_match = has_required_actions(claim, evidence_text)

    if not year_match:
        return "unclear"

    if not action_match:
        return "unclear"

    if overlap >= 0.55:
        return "supports"

    if overlap >= 0.30:
        return "partially_supports"

    return "unclear"


def build_evidence_summary(stance: str, evidence_text: str, fallback_snippet: str) -> str:
    evidence = evidence_text or fallback_snippet or "No usable evidence text available."

    if len(evidence) > 900:
        evidence = evidence[:900].rstrip() + "..."

    if stance == "supports":
        return f"This source appears to directly support the claim: {evidence}"

    if stance == "partially_supports":
        return f"This source partially overlaps with the claim, but may not confirm every detail: {evidence}"

    if stance == "contradicts":
        return f"This source appears to contradict or challenge the claim: {evidence}"

    return f"This source is topically related, but the extracted evidence does not directly verify the specific claim: {evidence}"


def estimate_freshness_score(text: str) -> int:
    years = extract_years(text)

    if not years:
        return 60

    latest_year = max(int(y) for y in years)

    if latest_year >= 2026:
        return 85
    if latest_year == 2025:
        return 75
    if latest_year == 2024:
        return 65
    if latest_year == 2023:
        return 55

    return 45


def real_sources_from_web(claim: str, domain: str, max_results: int = 8) -> List[SourceItem]:
    query = claim

    if domain == "gaming_industry":
        query = f"{claim} gaming industry casino Macau"

    raw_results = search_public_web(query=query, max_results=max_results)

    sources: List[SourceItem] = []

    for idx, item in enumerate(raw_results, start=1):
        page_text = fetch_page_text(item["url"])
        evidence_span = ""

        if page_text:
            evidence_span = extract_best_evidence_span(
                claim=claim,
                page_text=page_text,
                max_sentences=3,
            )

        # Use extracted page evidence if available; otherwise fall back to search snippet.
        stance_basis = evidence_span or item["snippet"] or f"{item['title']} {item['snippet']}"
        stance = heuristic_stance(claim=claim, evidence_text=stance_basis)

        independence_score = 1.0
        copied_from = None
        provenance_origin = "Fetched page content" if page_text else "Search result snippet only"

        if any(existing.url == item["url"] for existing in sources):
            independence_score = 0.2
            copied_from = sources[0].id if sources else None
            provenance_origin = "Duplicate search result"

        freshness_score = estimate_freshness_score(stance_basis)

        evidence_type = "extracted_page_evidence" if evidence_span else "search_snippet"

        sources.append(
            SourceItem(
                id=f"r{idx}",
                title=item["title"],
                url=item["url"],
                source_type=item["source_type"],
                credibility_score=item["credibility_score"],
                freshness_score=freshness_score,
                stance=stance,
                evidence_summary=build_evidence_summary(
                    stance=stance,
                    evidence_text=evidence_span,
                    fallback_snippet=item["snippet"],
                ),
                source_tier=item["source_tier"],
                source_role=item["source_role"],
                authority_score=item["authority_score"],
                independence_score=independence_score,
                provenance_origin=provenance_origin,
                published_date=None,
                evidence_type=evidence_type,
                copied_from=copied_from,
            )
        )

    return sources
