from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import VerifyRequest, VerifyResponse
from app.validation_framework import verify_claim_with_ledger


app = FastAPI(
    title="DeltaMind Prototype API",
    description="Mocked AI Trust & Verification Engine backend with Evidence Triangulation Ledger.",
    version="0.2.0",
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
        "mode": "mocked-evidence-ledger",
        "version": "0.2.0",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/verify", response_model=VerifyResponse)
def verify_claim(request: VerifyRequest):
    return verify_claim_with_ledger(
        claim=request.claim,
        domain=request.domain or "general_web",
    )
