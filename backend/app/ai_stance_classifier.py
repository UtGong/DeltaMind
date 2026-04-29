import json
import os
import time
from typing import Literal, Optional, List

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

from app.ai_cache import get_cached, set_cached


load_dotenv()


class AIStanceResult(BaseModel):
    stance: Literal["supports", "partially_supports", "contradicts", "unclear"]
    confidence: int = Field(description="Integer from 0 to 100.")
    reasoning: str
    evidence_quote: str


def get_model_candidates() -> List[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    fallbacks = os.getenv("GEMINI_FALLBACK_MODELS", "gemini-2.0-flash").split(",")

    models = [primary] + [m.strip() for m in fallbacks if m.strip()]
    deduped = []

    for model in models:
        if model not in deduped:
            deduped.append(model)

    return deduped


def ai_enabled() -> bool:
    return (
        os.getenv("USE_AI_STANCE", "false").lower() == "true"
        and bool(os.getenv("GEMINI_API_KEY"))
    )


def classify_stance_with_ai(
    claim: str,
    evidence_text: str,
    source_title: str = "",
) -> Optional[AIStanceResult]:
    if not ai_enabled():
        return None

    evidence_text = (evidence_text or "").strip()
    if len(evidence_text) < 40:
        return None

    evidence_text = evidence_text[:2800]

    cache_payload = json.dumps(
        {
            "claim": claim,
            "source_title": source_title,
            "evidence_text": evidence_text,
        },
        ensure_ascii=False,
        sort_keys=True,
    )

    cached = get_cached("stance_classification", cache_payload)
    if cached:
        try:
            return AIStanceResult.model_validate(cached)
        except Exception:
            pass

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
You are a strict evidence verifier.

Classify whether the provided evidence supports a specific claim.

Labels:
- supports: evidence directly confirms the key entities, event/action, time, and location.
- partially_supports: evidence confirms important parts but misses details.
- contradicts: evidence directly denies, refutes, or gives incompatible information.
- unclear: evidence is related but does not verify the claim.

Rules:
- Do not classify as supports just because the source is topically related.
- If the claim includes a year, date, location, license, partnership, construction, launch, approval, or acquisition, those details matter.
- Prefer unclear over supports when evidence is only background information.

Claim:
{claim}

Source title:
{source_title}

Evidence:
{evidence_text}
"""

    for model in get_model_candidates():
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": AIStanceResult.model_json_schema(),
                },
            )

            if not response.text:
                continue

            parsed = json.loads(response.text)
            result = AIStanceResult.model_validate(parsed)
            set_cached("stance_classification", cache_payload, result.model_dump())
            return result

        except Exception as exc:
            print(f"[Gemini stance fallback] model={model}, {type(exc).__name__}: {exc}")
            time.sleep(0.5)

    return None
