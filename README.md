# DeltaMind Prototype

DeltaMind is a prototype of an **AI Trust & Verification Engine** designed to evaluate the reliability of public web and gaming-industry claims.

Instead of simply answering whether a claim is true or false, DeltaMind builds an explainable **Evidence Triangulation Ledger**. The system decomposes a claim into smaller atomic claims, maps each claim to supporting or conflicting evidence, evaluates source authority and independence, detects potential echo-chamber reporting, and generates an explainable trust index.

This repository currently contains a **mocked full-stack demo**. The frontend and backend are functional, while the verification results are simulated through rule-based mock data. Future versions will integrate real web retrieval and AI-based claim extraction, stance classification, and evidence reasoning.

## Core Idea

DeltaMind does not simply count how many sources mention a claim. It evaluates:

- what parts of the claim are supported;
- which sources provide the evidence;
- whether the sources are authoritative or low-quality;
- whether multiple sources are independent or repeating the same origin;
- whether evidence is recent or outdated;
- whether there are contradictions or missing expected evidence;
- why the system assigns a certain trust score.

The goal is to make AI-assisted verification more transparent, auditable, and useful for human decision-making.

## Current Prototype Features

- Claim/topic input
- Mocked public source retrieval
- Source authority tiers
- Source credibility and freshness scores
- Source stance classification
- Atomic claim decomposition
- Evidence map
- Source-delta signals
- Echo-chamber risk signal
- Temporal decay signal
- Rule-based trust index
- Explainable verification summary
- Next.js frontend dashboard
- FastAPI backend API

## System Architecture

```text
User Claim
  ↓
Atomic Claim Decomposition
  ↓
Mocked Source Retrieval
  ↓
Source Authority Classification
  ↓
Evidence and Stance Mapping
  ↓
Provenance / Independence Analysis
  ↓
Delta Signal Detection
  ↓
Trust Index Calculation
  ↓
Evidence Ledger Dashboard
```

## Tech Stack

### Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Environment

- Ubuntu
- Conda

## Project Structure

```text
deltamind-prototype/
  backend/
    app/
      main.py
      models.py
      validation_framework.py
      mock_engine.py
    requirements.txt

  frontend/
    src/
      app/
        page.tsx
        layout.tsx
    package.json

  README.md
```

## Backend Setup

Create and activate the Conda environment:

```bash
conda create -n deltamind python=3.11 -y
conda activate deltamind
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

Health check:

```bash
curl --noproxy "*" http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Install dependencies:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```bash
cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
ENVEOF
```

Run the frontend:

```bash
npm run dev
```

The frontend should be available at:

```text
http://localhost:3000
```

## Example API Request

```bash
curl --noproxy "*" -X POST http://127.0.0.1:8000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"claim":"Company X partnered with Company Y to launch Product Z in Macau next Tuesday.","domain":"gaming_industry"}'
```

## Example Output Fields

The backend returns a verification response with fields such as:

```json
{
  "input_claim": "...",
  "normalized_claim": "...",
  "trust_index": 72,
  "trust_label": "Likely reliable",
  "verdict": "Likely reliable",
  "atomic_claims": [],
  "sources": [],
  "delta_signals": [],
  "evidence_map": [],
  "scoring_breakdown": {},
  "ledger_summary": "..."
}
```

## Evidence Triangulation Ledger

DeltaMind is structured around a ledger-style verification framework.

### Atomic Claims

A complex claim is decomposed into smaller checkable claims.

Example:

```text
Original claim:
Company X partnered with Company Y to launch Product Z in Macau next Tuesday.

Atomic claims:
1. Company X partnered with Company Y.
2. The partnership involves Product Z.
3. The launch location is Macau.
4. The launch date is next Tuesday.
```

### Source Authority Matrix

Sources are categorized by their verification role:

| Tier | Source Type | Role |
|---|---|---|
| Tier 0 | Regulatory / legal / government source | Strongest for legal, licensing, and compliance claims |
| Tier 1 | Official company source | Strong direct evidence, but may contain self-reporting bias |
| Tier 2 | Independent high-quality news | External confirmation |
| Tier 3 | Specialized gaming industry press | Domain-specific context |
| Tier 4 | Aggregators / blogs / forums | Weak evidence or early signal |
| Tier 5 | Social media / unknown source | Discovery signal only |

### Delta Signals

DeltaMind models differences between sources, including:

- agreement delta;
- contradiction delta;
- authority delta;
- freshness delta;
- provenance delta;
- source independence delta;
- echo-chamber risk;
- missing evidence.

### Trust Index

The trust index is currently calculated through a rule-based scoring model:

```text
Trust Index =
Authority Score
+ Evidence Directness Score
+ Independent Corroboration Score
+ Provenance Clarity Score
+ Recency Score
+ Atomic Claim Coverage Score
- Contradiction Penalty
- Echo-Chamber Penalty
- Missing Evidence Penalty
```

The trust score is mapped to labels such as:

| Score | Label |
|---:|---|
| 85–100 | Highly reliable |
| 70–84 | Likely reliable |
| 55–69 | Partially verified |
| 40–54 | Uncertain |
| 20–39 | Weakly supported |
| 0–19 | Contradicted / unreliable |

## Current Status

This is an early mocked prototype.

The current version demonstrates the intended system workflow and interface, but it does not yet perform real-time web search or AI-based verification.

## Next Steps

Planned improvements include:

1. Integrate real public web search.
2. Add AI-based claim decomposition.
3. Add AI-based evidence extraction.
4. Add stance / contradiction classification.
5. Add provenance and source-origin tracing.
6. Add semantic similarity-based echo-chamber detection.
7. Improve the scoring model.
8. Add saved verification cases for demo and evaluation.
9. Prepare research-oriented evaluation comparing DeltaMind against search/RAG-style baselines.

## Research Direction

DeltaMind is designed as a possible research system for explainable AI-assisted news verification.

The potential research contribution is:

> DeltaMind integrates atomic claim decomposition, source authority modeling, provenance tracking, echo-chamber detection, temporal reasoning, and evidence-aware confidence scoring into a unified verification ledger for public web and gaming-industry claims.

## License

This project is currently for internal research and prototype development.
