import re
from typing import List, Set


STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "will",
    "has", "have", "had", "was", "were", "are", "its", "their", "about",
    "new", "more", "than", "also", "been", "being", "they", "them", "then",
    "when", "where", "what", "which", "would", "could", "should"
}


def split_sentences(text: str) -> List[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def content_terms(text: str) -> Set[str]:
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return {w for w in words if len(w) > 3 and w not in STOPWORDS}


def sentence_relevance_score(claim: str, sentence: str) -> float:
    claim_terms = content_terms(claim)
    sentence_terms = content_terms(sentence)

    if not claim_terms:
        return 0.0

    overlap = claim_terms.intersection(sentence_terms)
    return len(overlap) / len(claim_terms)


def extract_best_evidence_span(
    claim: str,
    page_text: str,
    max_sentences: int = 3,
) -> str:
    """
    Extract the most claim-relevant sentences from a page.
    This is a lightweight prototype method before semantic retrieval / AI extraction.
    """

    if not page_text:
        return ""

    sentences = split_sentences(page_text)

    scored = [
        (sentence_relevance_score(claim, sentence), sentence)
        for sentence in sentences
    ]

    scored = sorted(scored, key=lambda x: x[0], reverse=True)

    top_sentences = [
        sentence
        for score, sentence in scored[:max_sentences]
        if score > 0
    ]

    if not top_sentences:
        return ""

    return " ".join(top_sentences)
