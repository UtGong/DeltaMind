import json
import os
import time
from typing import Literal, Optional, List

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field, ValidationError


load_dotenv()


class AIStanceResult(BaseModel):
    stance: Literal["supports", "partially_supports", "contradicts", "unclear"]
    confidence: int = Field(description="Integer from 0 to 100.")
    reasoning: str
    evidence_quote: str


def get_model_candidates() -> List[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    fallbacks = os.getenv("GEMINI_FALLBACK_MODELS", "gemini-2.5-flash-lite").split(",")

    models = [primary] + [m.strip() for m in fallbacks if m.strip()]
    seen = set()
    deduped = []

    for model in models:
        if model not in seen:
            deduped.append(model)
            seen.add(model)

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

    evidence_text = evidence_text[:3500]
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
You are a strict evidence verifier.

Classify whether the provided evidence supports a specific claim.

Rules:
- Do not classify as "supports" just because the source is topically related.
- "supports" means the evidence directly confirms the key entities, event/action, and important time/location details in the claim.
- "partially_supports" means the evidence confirms some important parts but misses or weakens other details.
- "contradicts" means the evidence directly denies, refutes, or gives incompatible information.
- "unclear" means the evidence is related but does not verify the claim.
- If the claim includes a year, date, location, license, partnership, construction, launch, approval, or acquisition, those details matter.
- Prefer "unclear" over "supports" when evidence is only background information.

Claim:
{claim}

Source title:
{source_title}

Evidence:
{evidence_text}
"""

    for model in get_model_candidates():
        for attempt in range(2):
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
                return AIStanceResult.model_validate(parsed)

            except Exception as exc:
                print(
                    f"[Gemini stance fallback] "
                    f"model={model}, attempt={attempt + 1}, "
                    f"{type(exc).__name__}: {exc}"
                )
                time.sleep(1.5 * (attempt + 1))

    return None
