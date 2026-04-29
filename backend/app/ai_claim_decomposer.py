import json
import os
import re
import time
from typing import Literal, List, Optional

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

from app.ai_cache import get_cached, set_cached


load_dotenv()


class DecomposedClaim(BaseModel):
    text: str
    role: Literal["core", "supporting_detail", "contextual_detail"]


class ClaimDecompositionResult(BaseModel):
    atomic_claims: List[DecomposedClaim] = Field(
        description="A list of 2 to 6 checkable atomic claims."
    )


def ai_claim_decomposition_enabled() -> bool:
    return (
        os.getenv("USE_AI_STANCE", "false").lower() == "true"
        and bool(os.getenv("GEMINI_API_KEY"))
    )


def get_model_candidates() -> List[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    fallbacks = os.getenv("GEMINI_FALLBACK_MODELS", "gemini-2.0-flash").split(",")

    models = [primary] + [m.strip() for m in fallbacks if m.strip()]
    deduped = []

    for model in models:
        if model not in deduped:
            deduped.append(model)

    return deduped


def heuristic_decompose_claim(claim: str) -> ClaimDecompositionResult:
    claim = claim.strip()
    atomic_claims = [DecomposedClaim(text=claim, role="core")]

    years = re.findall(r"\b(?:19|20)\d{2}\b", claim)
    if years:
        atomic_claims.append(
            DecomposedClaim(
                text=f"The claim is associated with the year {years[0]}.",
                role="supporting_detail",
            )
        )

    return ClaimDecompositionResult(atomic_claims=atomic_claims[:6])


def decompose_claim_with_ai(claim: str) -> Optional[ClaimDecompositionResult]:
    cache_payload = claim.strip()
    cached = get_cached("claim_decomposition", cache_payload)

    if cached:
        try:
            return ClaimDecompositionResult.model_validate(cached)
        except Exception:
            pass

    if not ai_claim_decomposition_enabled():
        return heuristic_decompose_claim(claim)

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
You are a claim decomposition assistant for a news verification system.

Break the input claim into small, checkable atomic claims.

Rules:
- Identify one core claim.
- Identify supporting details such as product, place, date, organization, approval, partnership, construction, launch, acquisition, or license detail.
- Each atomic claim must be independently checkable.
- Avoid vague phrasing.
- Return 2 to 6 atomic claims.

Input claim:
{claim}
"""

    for model in get_model_candidates():
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ClaimDecompositionResult.model_json_schema(),
                },
            )

            if not response.text:
                continue

            parsed = json.loads(response.text)
            result = ClaimDecompositionResult.model_validate(parsed)
            set_cached("claim_decomposition", cache_payload, result.model_dump())
            return result

        except Exception as exc:
            print(f"[Gemini claim decomposition fallback] model={model}, {type(exc).__name__}: {exc}")
            time.sleep(0.5)

    fallback = heuristic_decompose_claim(claim)
    set_cached("claim_decomposition", cache_payload, fallback.model_dump())
    return fallback
