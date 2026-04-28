import json
import os
from typing import Literal, List, Optional

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field, ValidationError


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


def decompose_claim_with_ai(claim: str) -> Optional[ClaimDecompositionResult]:
    if not ai_claim_decomposition_enabled():
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
You are a claim decomposition assistant for a news verification system.

Break the input claim into small, checkable atomic claims.

Rules:
- Do not over-decompose trivial facts unless they are important for verification.
- Identify one core claim.
- Identify supporting details such as product, place, date, organization, approval, partnership, construction, or launch details.
- Each atomic claim must be independently checkable.
- Avoid vague phrasing.
- Return 2 to 6 atomic claims.

Input claim:
{claim}
"""

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": ClaimDecompositionResult.model_json_schema(),
            },
        )

        if not response.text:
            return None

        parsed = json.loads(response.text)
        return ClaimDecompositionResult.model_validate(parsed)

    except (json.JSONDecodeError, ValidationError, Exception) as exc:
        print(f"[Gemini claim decomposition fallback] {exc}")
        return None
