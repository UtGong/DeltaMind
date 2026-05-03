# DeltaMind

**DeltaMind** is an AI Trust & Verification Engine that evaluates whether public web claims are supported, contradicted, uncertain, or insufficiently evidenced.

Instead of returning a simple chatbot-style answer, DeltaMind decomposes a claim into checkable units, retrieves sources, extracts evidence, evaluates source reliability, detects provenance and echo-chamber risks, models temporal consistency, and generates an explainable trust index.

## Core Question

> Which answer is reliable, and why?

DeltaMind is designed to help users understand:

- What evidence supports a claim
- What evidence is missing
- Which sources are reliable
- Whether sources are truly independent
- Whether the evidence matches the claimed timeline
- Why the system assigns a high or low confidence score

## Current Prototype

The current prototype supports:

- Real public web retrieval
- Page-level evidence extraction
- Gemini-assisted atomic claim decomposition
- Gemini / heuristic stance classification
- Source Authority Matrix
- Reliability priors
- Temporal reasoning
- Dempster-Shafer evidence aggregation
- Provenance-aware evidence graph
- Echo-chamber / source-origin detection
- Evidence ledger interface
- Belief / disbelief / uncertainty visualization
- Temporal timeline visualization
- Provenance graph visualization
- Source evidence matrix
- Markdown report export

## Technical Framework

DeltaMind is built around an evidence-theoretic verification pipeline.

### 1. Atomic Claim Decomposition

Complex claims are broken into smaller, independently checkable units.

Example:

```text
Input claim:
MGM Macau is building a new hotel and casino in 2028.

Atomic claims:
1. MGM Macau is building a new hotel and casino.
2. The construction is planned for 2028.
```

This allows DeltaMind to evaluate which parts of a claim are supported, unsupported, or uncertain.

### 2. Evidence Retrieval and Extraction

DeltaMind retrieves public web sources and extracts relevant evidence spans from full page content.

The system does not rely only on search snippets because snippets can be incomplete or misleading.

### 3. NLI-Style Stance Reasoning

Each evidence span is classified as:

- `supports`
- `partially_supports`
- `contradicts`
- `unclear`

The system follows a conservative verification principle:

> Topical relevance is not enough. Evidence must verify the key entity, action, time, and location in the claim.

### 4. Source Authority Matrix

Each source receives a reliability profile based on source type and domain.

Examples:

| Source Type | Role |
|---|---|
| Regulatory source | Highest authority for official/legal claims |
| Official company source | Strong for company announcements, but may have self-reporting bias |
| Independent news | Useful for external corroboration |
| Gaming industry press | Domain-specific source authority |
| Syndicated news | Useful but requires origin tracing |
| Reference source | Useful for background, not primary verification |

Each source may include:

- `source_tier`
- `source_role`
- `authority_score`
- `credibility_score`
- `reliability_prior`
- `bias_risk`
- `authority_reason`

### 5. Provenance-Aware Evidence Graph

DeltaMind models verification as a graph:

```text
Input Claim
→ Atomic Claims
→ Evidence Spans
→ Sources
→ Source Dependencies
```

This enables the system to trace each judgment back to its evidence source.

### 6. Echo-Chamber Detection

DeltaMind checks whether multiple sources are truly independent or repeating the same origin.

Signals include:

- Shared named origins
- Similar evidence text
- Copied or syndicated reporting
- Source dependency paths
- Similarity groups

This helps avoid over-counting repeated information as independent corroboration.

### 7. Temporal Reasoning

DeltaMind compares:

- Claimed event year/date
- Source publication year
- Temporal fit or mismatch

Example:

If a claim says an event will happen in **2028**, but no source confirms 2028, the claim should not receive strong support.

### 8. Dempster-Shafer Evidence Aggregation

Instead of a black-box confidence percentage, DeltaMind models evidence as:

- **Belief**: evidence supporting the claim
- **Disbelief**: evidence contradicting the claim
- **Uncertainty**: missing, unclear, or insufficient evidence

The final trust index combines:

- Source stance
- Source authority
- Reliability prior
- Source independence
- Temporal decay
- Atomic claim coverage
- Contradiction signals
- Uncertainty mass

## Interface Structure

The frontend follows a progressive disclosure structure:

```text
Overall → Detail → More Detail
```

### Overall

- Trust Index
- Verdict
- Belief / disbelief / uncertainty bar
- Temporal summary
- Provenance summary

### Detail

- Evidence map
- Atomic claim checklist
- Source delta signals

### More Detail

- Provenance graph
- Evidence graph summary
- Rule-based scoring breakdown
- Source evidence matrix
- Retrieved source cards
- System notes
- Markdown report export

## Example Verification

Claim:

```text
MGM Macau is building a new hotel and casino in 2028.
```

Expected result:

```text
Verdict:
Unsupported / insufficient evidence

Reason:
The system may find sources related to MGM Macau, existing hotels, casinos, or tourism,
but unless a source directly confirms a new hotel and casino project planned for 2028,
the claim remains uncorroborated.
```

## Tech Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Gemini API
- Public web retrieval
- Rule-based fallback logic

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Component-based evidence ledger UI

## Project Structure

```text
deltamind-prototype/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── validation_framework.py
│   │   ├── real_source_adapter.py
│   │   ├── web_retriever.py
│   │   ├── page_fetcher.py
│   │   ├── evidence_extractor.py
│   │   ├── ai_claim_decomposer.py
│   │   ├── ai_stance_classifier.py
│   │   ├── ai_cache.py
│   │   ├── source_authority.py
│   │   ├── source_independence.py
│   │   ├── temporal_reasoning.py
│   │   ├── dempster_shafer.py
│   │   └── evidence_graph.py
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── verification/
│   │   ├── lib/
│   │   └── types/
│   └── package.json
│
└── README.md
```

## Setup

### 1. Backend

Create and activate the conda environment:

```bash
conda create -n deltamind python=3.11 -y
conda activate deltamind
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Create `.env`:

```bash
cat > .env << 'ENV'
USE_AI_STANCE=true
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.0-flash
GEMINI_API_KEY=your_real_gemini_key_here

MAX_AI_SOURCE_STANCE_CALLS=2
MAX_AI_ATOMIC_EVAL_SOURCES=2
ENV
```

Start backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Test backend:

```bash
curl --noproxy "*" http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

Test verification endpoint:

```bash
curl --noproxy "*" -s -X POST http://127.0.0.1:8000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"claim":"MGM Macau is building a new hotel and casino in 2028","domain":"real_gaming"}' \
  | python -m json.tool
```

### 2. Frontend

Start frontend:

```bash
cd frontend
npm install
npm run dev
```

Create frontend `.env.local` if needed:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Open:

```text
http://localhost:3000
```

## API

### Health Check

```http
GET /health
```

### Verify Claim

```http
POST /api/verify
```

Request:

```json
{
  "claim": "MGM Macau is building a new hotel and casino in 2028",
  "domain": "real_gaming"
}
```

Supported domains:

```text
general_web
gaming_industry
real_web
real_gaming
```

Response includes:

- Trust index
- Verdict
- Sources
- Atomic claims
- Evidence map
- Belief mass
- Temporal summary
- Provenance summary
- Evidence graph
- Scoring breakdown
- System notes

## Current Limitations

The current prototype is functional but still early-stage.

Known limitations:

- Gemini free-tier quota can limit repeated AI calls
- Source retrieval quality depends on public web search results
- Source-origin tracing is currently heuristic
- Echo-chamber detection uses named-origin and similarity signals, not full citation graph reconstruction
- Dempster-Shafer scoring is implemented but still requires calibration
- Temporal reasoning is currently year-level and should be expanded to event-level timelines
- Some domain authority profiles still need expansion

## Roadmap

Next technical steps:

1. Improve source-origin tracing
2. Add embedding-based source similarity
3. Expand gaming-industry and regulatory source profiles
4. Strengthen event timeline extraction
5. Calibrate Dempster-Shafer mass functions
6. Add stronger citation-chain analysis
7. Build domain-specific evaluation cases
8. Improve frontend graph interaction
9. Add report comparison across multiple claims
10. Prepare publishable research framing

## Research Direction

DeltaMind reframes verification from a retrieval-and-answering problem into a structured evidence modeling problem.

The core contribution is:

```text
DeltaMind identifies reliability gaps between information sources and transforms those gaps into explainable confidence signals for AI systems and human decision-makers.
```

Instead of saying only “true” or “false,” DeltaMind explains:

- Which parts of a claim are supported
- Which parts lack evidence
- Which sources are authoritative
- Which sources may be dependent
- Whether evidence is temporally valid
- How much belief, disbelief, and uncertainty remain

## Repository

GitHub:

```text
git@github.com:UtGong/DeltaMind.git
```