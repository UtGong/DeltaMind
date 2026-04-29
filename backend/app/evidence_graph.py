from typing import List

from app.models import (
    AtomicClaim,
    EvidenceGraph,
    EvidenceGraphEdge,
    EvidenceGraphNode,
    SourceItem,
)


def build_evidence_graph(
    input_claim: str,
    atomic_claims: List[AtomicClaim],
    sources: List[SourceItem],
) -> EvidenceGraph:
    graph = EvidenceGraph()

    graph.nodes.append(
        EvidenceGraphNode(
            id="claim_root",
            type="claim",
            label=input_claim,
            metadata={},
        )
    )

    for claim in atomic_claims:
        graph.nodes.append(
            EvidenceGraphNode(
                id=claim.id,
                type="atomic_claim",
                label=claim.text,
                metadata={
                    "role": claim.role,
                    "status": claim.status,
                    "confidence_score": claim.confidence_score,
                },
            )
        )

        graph.edges.append(
            EvidenceGraphEdge(
                source="claim_root",
                target=claim.id,
                relation="decomposes_into",
                weight=1.0,
            )
        )

    for source in sources:
        graph.nodes.append(
            EvidenceGraphNode(
                id=source.id,
                type="source",
                label=source.title,
                metadata={
                    "url": source.url,
                    "domain": source.normalized_domain,
                    "source_type": source.source_type,
                    "source_tier": source.source_tier,
                    "stance": source.stance,
                    "authority_score": source.authority_score,
                    "credibility_score": source.credibility_score,
                    "independence_score": source.independence_score,
                    "reliability_prior": source.reliability_prior,
                    "temporal_status": source.temporal_status,
                    "similarity_group": source.similarity_group,
                },
            )
        )

        graph.nodes.append(
            EvidenceGraphNode(
                id=f"evidence_{source.id}",
                type="evidence",
                label=source.evidence_summary[:160],
                metadata={
                    "evidence_type": source.evidence_type,
                    "raw_evidence_text": source.raw_evidence_text,
                },
            )
        )

        graph.edges.append(
            EvidenceGraphEdge(
                source=source.id,
                target=f"evidence_{source.id}",
                relation="provides_evidence",
                weight=source_relevance_weight(source),
            )
        )

        if source.copied_from:
            graph.edges.append(
                EvidenceGraphEdge(
                    source=source.id,
                    target=source.copied_from,
                    relation="possibly_derived_from",
                    weight=1 - source.independence_score,
                    metadata={"reason": source.independence_reason or ""},
                )
            )

        for claim in atomic_claims:
            if source.id in claim.supporting_source_ids:
                graph.edges.append(
                    EvidenceGraphEdge(
                        source=f"evidence_{source.id}",
                        target=claim.id,
                        relation="supports",
                        weight=source_relevance_weight(source),
                    )
                )

            if source.id in claim.conflicting_source_ids:
                graph.edges.append(
                    EvidenceGraphEdge(
                        source=f"evidence_{source.id}",
                        target=claim.id,
                        relation="contradicts",
                        weight=source_relevance_weight(source),
                    )
                )

    return graph


def source_relevance_weight(source: SourceItem) -> float:
    prior = source.reliability_prior if source.reliability_prior is not None else 0.45
    return round(
        max(
            0.0,
            min(
                1.0,
                prior * 0.4
                + (source.authority_score / 100) * 0.2
                + (source.credibility_score / 100) * 0.2
                + source.independence_score * 0.2,
            ),
        ),
        3,
    )
