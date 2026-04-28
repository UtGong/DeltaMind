from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import VerifyRequest, VerifyResponse
from app.mock_engine import verify_claim_mock


app = FastAPI(
    title="DeltaMind Prototype API",
    description="Mocked AI Trust & Verification Engine backend.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "DeltaMind Prototype API",
        "status": "running",
        "mode": "mocked-demo",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/verify", response_model=VerifyResponse)
def verify_claim(request: VerifyRequest):
    return verify_claim_mock(
        claim=request.claim,
        domain=request.domain or "general_web",
    )
