import re
from typing import Dict, List, Optional, Set

from app.models import SourceItem


STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "will",
    "has", "have", "had", "was", "were", "are", "its", "their", "about",
    "new", "more", "than", "also", "been", "being", "they", "them",
    "source", "sources", "report", "reported", "according", "company",
}


KNOWN_ORIGIN_PATTERNS = [
    ("Bloomberg", r"\b(?:reported by|according to|citing|source[s]? familiar with).*?bloomberg\b|\bbloomberg\b"),
    ("GlobalData", r"\bglobaldata\b"),
    ("Reuters", r"\breuters\b"),
    ("Associated Press", r"\bassociated press\b|\bap news\b"),
    ("Company announcement", r"\bpress release\b|\bcompany announcement\b|\bofficial announcement\b"),
]


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def content_terms(text: str) -> Set[str]:
    words = normalize_text(text).split()
    return {w for w in words if len(w) > 3 and w not in STOPWORDS}


def jaccard_similarity(a: str, b: str) -> float:
    terms_a = content_terms(a)
    terms_b = content_terms(b)

    if not terms_a or not terms_b:
        return 0.0

    return len(terms_a & terms_b) / len(terms_a | terms_b)


def source_text(source: SourceItem) -> str:
    return " ".join(
        [
            source.title or "",
            source.raw_evidence_text or "",
            source.evidence_summary or "",
        ]
    )


def detect_named_origin(source: SourceItem) -> Optional[str]:
    text = normalize_text(source_text(source))

    for origin_name, pattern in KNOWN_ORIGIN_PATTERNS:
        if re.search(pattern, text):
            return origin_name

    return None


def apply_source_independence_analysis(
    sources: List[SourceItem],
    similarity_threshold: float = 0.42,
) -> List[SourceItem]:
    """
    Detects simple echo-chamber / source dependency patterns.

    Current prototype signals:
    1. Named shared origin, e.g., several sources citing Bloomberg.
    2. High evidence-text similarity across sources.
    3. Duplicate or near-duplicate titles.

    This does not prove plagiarism or copying. It estimates dependency risk.
    """

    if not sources:
        return sources

    # First pass: named origin detection.
    origin_groups: Dict[str, List[SourceItem]] = {}

    for source in sources:
        origin = detect_named_origin(source)

        if origin:
            origin_groups.setdefault(origin, []).append(source)

    group_id = 1

    for origin, grouped_sources in origin_groups.items():
        if len(grouped_sources) < 2:
            continue

        anchor = grouped_sources[0]
        anchor.similarity_group = f"origin-{group_id}"
        anchor.independence_reason = f"Potential origin source for shared reference: {origin}"

        for source in grouped_sources[1:]:
            source.similarity_group = f"origin-{group_id}"
            source.independence_score = min(source.independence_score, 0.45)
            source.copied_from = anchor.id
            source.provenance_origin = f"Potentially derived from shared origin: {origin}"
            source.independence_reason = (
                f"This source appears to share the same named origin/reference ({origin}) "
                f"as {anchor.id}; counted as partially dependent evidence."
            )

        group_id += 1

    # Second pass: semantic similarity clustering.
    for i, source_i in enumerate(sources):
        text_i = source_text(source_i)

        for j in range(i + 1, len(sources)):
            source_j = sources[j]
            text_j = source_text(source_j)

            sim = jaccard_similarity(text_i, text_j)
            same_title = normalize_text(source_i.title) == normalize_text(source_j.title)

            if sim >= similarity_threshold or same_title:
                if not source_i.similarity_group:
                    source_i.similarity_group = f"similarity-{group_id}"
                    source_i.independence_reason = (
                        source_i.independence_reason
                        or "Potential anchor source for a similar-evidence cluster."
                    )

                source_j.similarity_group = source_i.similarity_group
                source_j.independence_score = min(source_j.independence_score, 0.55)
                source_j.copied_from = source_j.copied_from or source_i.id
                source_j.provenance_origin = (
                    source_j.provenance_origin
                    if source_j.provenance_origin.startswith("Potentially derived")
                    else f"Potentially dependent on similar evidence from {source_i.id}"
                )
                source_j.independence_reason = (
                    f"Evidence text is similar to {source_i.id} "
                    f"(Jaccard similarity={sim:.2f}); counted as partially dependent."
                )

        group_id += 1

    # Default independence explanations.
    for source in sources:
        if not source.independence_reason:
            source.independence_reason = "No dependency signal detected in the current prototype."

    return sources
