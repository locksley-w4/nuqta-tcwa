# AI Business Analyzer

Hackathon MVP that produces a **bank-grade viability report** for opening a business at a given location.

## Beyond the site score — extra features

The platform doesn't stop at the geographic viability score. Four additional capabilities turn it from a one-shot report into a full decision-and-funding workflow:


### 1. Find Location — reverse opportunity search
Instead of analyzing a known address, the user can ask the inverse question: *"Where in the city should I open a coffee shop?"* The backend scans a 10×10 (city) or 8×8 (selected area) grid and surfaces:
- **Top 15 hotspots** when scanning the whole city, or **top 5** when scanning a 5 km box around a selected point
- A **suitability score (0–100)** per spot, weighted by demand, foot traffic, and competition (with extra penalty for cafés/restaurants in saturated zones)
- A short **"why this spot"** explanation for each candidate
- All hotspots rendered on the map as **glowing green pulse pins**, alongside up to 60 existing **competitor pins** (rose-colored) so the user can visually verify each hotspot really sits in an underserved pocket
- **One-click drill-through**: clicking any hotspot pin auto-fills the analyzer form and runs the full Block A–E breakdown at that exact coordinate


### 2. Financial health & bank fundability
A second analytical pass evaluates the loan itself, not just the site. The user enters the **requested loan amount, collateral value, projected monthly revenue, projected monthly expenses, and term in months**. The backend then runs the standard banking checks at the typical Uzbek commercial rate (24% APR):
- **Monthly payment** via the standard amortization formula
- **DSCR** (Debt Service Coverage Ratio) — net income / monthly payment, target ≥ 1.20
- **Collateral coverage** — collateral / loan amount, target ≥ 1.25
- A composite **Bank Fundability Score (0–100)** with **APPROVE / REVIEW / DECLINE** verdict and an indicative rate premium
- A **24-month cash flow simulator** with cash-gap month detection
- An **AI Bank Feedback** panel that explains, in banker voice, *why* the file passes or fails and exactly how to fix it (e.g. *"WARNING: Your collateral coverage is 110%. Uzbek banks typically require 125%. Lower the loan request to $X or pledge an extra $Y of collateral."*)

When both site and finance results are available, the dashboard shows a combined **Overall Business Success Probability** hero — a single percentage that captures both *should I open here* and *will the bank fund it*.


### 3. AI-suggested action plan
Every recommendation card has a **View action plan** button that opens a tailored, numbered to-do list generated from the weakest dimensions in the analysis:
- **Demand < 65** → "Strengthen demand signals" with the seasonal launch window
- **Location < 65** → "Improve site visibility" referencing nearby anchors
- **>10 competitors / 1 km** → "Differentiate from local competitors" with the optimal price band
- **Break-even >14 months or cash gaps** → "Tighten the financial model" with the recommended max rent
- **Credit grade weak / NPL non-green** → "Boost bank readiness"
- **Bank verdict not APPROVE** → quotes the actual AI bank feedback line
- A final commit step: *"Lock in the lease and start hiring"* (when YES/CONDITIONAL) or *"Reconsider the site"* (when NO)

Each step ships with an icon, a tone (good / warn / bad), and a metric pill quoting the exact numbers backing the recommendation.

### 4. Download report
The **Download report** button next to the recommendation exports the full analysis as a single JSON file (`analysis-<businessType>-<YYYY-MM-DD>.json`) containing:
- Timestamp, business type, coordinates, address
- The full summary (final score, recommendation, credit risk)
- All seven blocks (A–G) in their entirety
- Block scores, weights, AI reasoning bullets
- The finance result if a finance check was run

The output is investor / banker ready — drop it straight into a credit memo or share with a partner.

---

## Stack
- **Frontend**: React + Vite + Tailwind + recharts + react-leaflet + lucide-react
- **Backend**: Node.js + Express

## Run

### Backend
```bash
cd backend
npm install
npm run dev   # http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

The Vite dev server proxies `/analyze` → `http://localhost:5001`.

## API

`POST /analyze`
```json
{ "businessType": "Coffee shop", "lat": 41.2995, "lng": 69.2401 }
```

Response shape (truncated):
```json
{
  "businessType": "Coffee shop",
  "coordinates": { "lat": 41.2995, "lng": 69.2401 },
  "blocks": {
    "market":     { "tam": 56.4, "sam": 18.2, "som": 1.42, "nicheOpportunityScore": 72 },
    "demand":     { "forecast": [{ "month": "Jan", "revenue": 9123, "isSeasonalSpike": false }, ...],
                    "annualRevenue": 142000, "peak": 16800, "trough": 8100, "demandScore": 71 },
    "location":   { "pedestrianTrafficScore": 78, "anchorEffect": { "rating": "Strong", "score": 70, "nearbyAnchors": 4 }, "locationScore": 75 },
    "financials": { "breakEvenMonths": 11.5, "roiEstimate": 38.2, "financialScore": 73 },
    "risk":       { "competitorsWithin1km": 8, "competitionDensity": 2.5, "closureProbability": 22.4, "competitionScore": 68 }
  },
  "blockScores": { "market": 72, "demand": 71, "location": 75, "financials": 73, "risk": 71 },
  "summary": { "finalScore": 72, "recommendation": "CONDITIONAL", "creditRisk": "Medium", ... },
  "reasoning": { "summary": "...", "factors": ["..."] },
  "weights": { "location": 0.30, "demand": 0.25, "competition": 0.20, "financial": 0.25 }
}
```

## Scoring formula

`Final = 0.30 · Location + 0.25 · Demand + 0.20 · Competition + 0.25 · Financials`

- **YES** ≥ 75 → Low credit risk
- **CONDITIONAL** 55–74 → Medium credit risk
- **NO** < 55 → High credit risk

Cafes, restaurants, bakeries and similar businesses receive a **competition sensitivity penalty** (15% dampening on their competition score) since they're highly exposed to local competitors.

## Frontend features

- Hero **YES / CONDITIONAL / NO** badge with final score
- Stat cards (final score, niche opportunity, break-even, closure probability)
- **Radar chart** over the 5 analytical blocks
- **12-month revenue line chart** with Ramadan/Navro'z spikes highlighted
- **Interactive map picker** (Leaflet + CartoDB dark tiles) with:
  - Address / city / landmark **search** via Nominatim (no API key)
  - **Click anywhere** on the map to drop a pin
  - Reverse-geocoded address shown back in the search bar
- **AI Reasoning** panel from the backend reasoning engine
- Detailed **Block A–E** grid
- **Banker View** toggle reveals a Credit Risk Assessment with rate premium

Scores are mocked but deterministic per `(businessType, lat, lng)` — the same input always returns the same report.


