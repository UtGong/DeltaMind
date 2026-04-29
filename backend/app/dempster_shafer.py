from typing import List

from app.models import AtomicClaim, BeliefMass, SourceItem


def source_reliability(source: SourceItem) -> float:
    prior = source.reliability_prior if source.reliability_prior is not None else 0.45
    authority = source.authority_score / 100
    credibility = source.credibility_score / 100
    independence = source.independence_score
    temporal = source.temporal_decay_score if source.temporal_decay_score is not None else source.freshness_score / 100

    return max(0.0, min(1.0, prior * 0.35 + authority * 0.2 + credibility * 0.2 + independence * 0.15 + temporal * 0.1))


def stance_to_mass(source: SourceItem) -> tuple[float, float, float]:
    r = source_reliability(source)

    if source.stance == "supports":
        return (0.75 * r, 0.05 * r, 1 - (0.80 * r))

    if source.stance == "partially_supports":
        return (0.45 * r, 0.05 * r, 1 - (0.50 * r))

    if source.stance == "contradicts":
        return (0.05 * r, 0.80 * r, 1 - (0.85 * r))

    return (0.05 * r, 0.05 * r, 1 - (0.10 * r))


def combine_two(m1: tuple[float, float, float], m2: tuple[float, float, float]) -> tuple[float, float, float]:
    b1, d1, u1 = m1
    b2, d2, u2 = m2

    conflict = b1 * d2 + d1 * b2
    denom = max(1e-6, 1 - conflict)

    belief = (b1 * b2 + b1 * u2 + u1 * b2) / denom
    disbelief = (d1 * d2 + d1 * u2 + u1 * d2) / denom
    uncertainty = (u1 * u2) / denom

    total = belief + disbelief + uncertainty
    if total <= 0:
        return (0.0, 0.0, 1.0)

    return (belief / total, disbelief / total, uncertainty / total)


def compute_belief_mass_from_sources(sources: List[SourceItem]) -> BeliefMass:
    if not sources:
        return BeliefMass(
            belief=0.0,
            disbelief=0.0,
            uncertainty=1.0,
            trust_index=0,
            explanation="No sources were available, so uncertainty is maximal.",
        )

    combined = (0.0, 0.0, 1.0)

    for source in sources:
        source_mass = stance_to_mass(source)
        combined = combine_two(combined, source_mass)

    belief, disbelief, uncertainty = combined

    # Trust index rewards belief, penalizes disbelief, and keeps uncertainty visible.
    trust = int(max(0, min(100, round((belief * 100) - (disbelief * 55) - (uncertainty * 15)))))

    explanation = (
        f"Dempster-Shafer aggregation produced belief={belief:.2f}, "
        f"disbelief={disbelief:.2f}, uncertainty={uncertainty:.2f}. "
        f"The trust index reflects support, contradiction, and residual uncertainty."
    )

    return BeliefMass(
        belief=round(belief, 3),
        disbelief=round(disbelief, 3),
        uncertainty=round(uncertainty, 3),
        trust_index=trust,
        explanation=explanation,
    )


def adjust_belief_with_atomic_claims(
    belief_mass: BeliefMass,
    atomic_claims: List[AtomicClaim],
) -> BeliefMass:
    if not atomic_claims:
        return belief_mass

    verified = sum(1 for c in atomic_claims if c.status == "verified")
    partial = sum(1 for c in atomic_claims if c.status == "partially_verified")
    weak = sum(1 for c in atomic_claims if c.status in ["uncorroborated", "uncertain"])
    contradicted = sum(1 for c in atomic_claims if c.status == "contradicted")

    total = max(1, len(atomic_claims))
    coverage = (verified + 0.55 * partial - 0.65 * contradicted - 0.35 * weak) / total

    adjusted = int(max(0, min(100, round(belief_mass.trust_index * 0.7 + max(0, coverage) * 100 * 0.3))))

    return BeliefMass(
        belief=belief_mass.belief,
        disbelief=belief_mass.disbelief,
        uncertainty=belief_mass.uncertainty,
        trust_index=adjusted,
        explanation=belief_mass.explanation
        + f" Atomic-claim coverage adjustment produced final trust index={adjusted}.",
    )
