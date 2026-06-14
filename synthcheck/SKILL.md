---
name: synthcheck
description: Test any business decision on a simulated market BEFORE you spend a dollar. Simulates a heterogeneous population of your customers, interviews them in natural language, scores reactions by Semantic Similarity Rating (SSR), and returns the market's verdict on pricing, offers, price changes, landing pages, copy, names, or positioning. Triggers - "synthcheck", "run a synthcheck test", "test this price/offer/copy/name", "what would the market think", "simulate customers". Works with any model.
---

# SynthCheck — test the market before you build it

Simulate a realistic population of your customers and ask them anything — a price, an offer, a name, a landing page — and get a directional market verdict in minutes. This is the open, model-agnostic implementation of the method validated by **Colgate-Palmolive × PyMC Labs** (SSR), **Stanford** (grounded agents), and **Aaru** (swarm + calibration).

**The one thing that makes it accurate, not flattering:** never ask a simulated person for a number. Ask for a *reaction in words*, then map that language to the rating scale. Direct "rate 1–5" asks collapse to a 4; **Semantic Similarity Rating (SSR)** hit 90–92% correlation with real survey panels. This is non-negotiable.

**Output is DIRECTIONAL** — it ranks options and surfaces objections humans won't voice; absolute numbers flatter reality. Always smoke-test the winner with real money before betting big.

## Run it (the 6 steps)

### 1 · Outcome Contract — define the eval FIRST
Restate the decision as a falsifiable question + a ship/kill threshold (e.g. *"ship the $297 tier if top-2-box intent ≥ 40%"*). Capture **your own prediction** of the winner — it powers the Surprise Detector. Note any real data you have to calibrate against.

### 2 · Cohorts — 4–6 segments that matter commercially
Always include a **skeptic/red-team cohort** (its job is to refute) and a **premium cohort** (premium buyers often invert price findings → tiering signal). For each, name the **real competitor products/prices** they already pay — anchors drive realism.

**Grounding is the biggest accuracy lever** (Stanford: +15 points over demographics). If you can browse, harvest real objections/desires/slang from **reviews + reddit + competitor sites** first and ground each cohort in that language. If you have your own data (CRM, past surveys, sales calls) or a knowledge graph of real customers, use it — that's the moat.

### 3 · Simulate — with FORCED heterogeneity (anti-collapse)
Across each cohort, deliberately spread income (~5×), price sensitivity, skepticism, purchase fatigue, life circumstances (~20% financially stressed), mood, and the specific job each is hiring for. 30 clones of one customer = garbage. **Between-subjects:** for pricing, each person sees ONE price point (never compare all); for copy/names, rotate variants across people (~10 per cell).

### 4 · Elicit in words, not numbers (SSR step 1)
Each person reacts in natural language: would they buy, what they'd pay, what stops them, what they love, would they click/scroll/bounce. **No numeric ratings here.** Apply the **month-2 rule**: they "convert" only if they'd still defend the charge on their bank statement in month 2 (model spouse/budget review, novelty churn, cancel-culture).

### 5 · Score by similarity (SSR step 2)
Now map each free-text reaction to a 1–5 point by which **anchor statement** it most resembles — judging only their words. Report the **distribution** (count at each point), never just a mean. See `anchors.md` for the libraries. Top-2-box = share at 4+5.

### 6 · Verdict
- Apply an **optimism haircut** (~50% on stated conversion for planning numbers; keep rankings as-is).
- Report **distributions + uncertainty**, never one flattering number.
- **Variance guardrail:** if nearly all mass lands on one point, flag likely collapse and re-run with more heterogeneity.
- **Pricing:** revenue-max price + demand-curve shape (Van Westendorp / Gabor-Granger).
- **Objection map:** what repeats across cohorts (real fixes) + the red-team's killer objections.
- **Verbatim gold:** 3–5 quotes worth stealing for ad copy.
- **🔦 Surprise Detector:** where the market most disagreed with your prediction — the headline.
- **Validate-next:** the 1–2 signals worth a real-money smoke test before locking. Always dual-track.

## Decision packs (pick by decision type)
- **pricing** → Van Westendorp (too cheap / cheap / expensive / too expensive) + Gabor-Granger ladder → acceptable range + revenue-max price. Between-subjects price cells.
- **offer / feature** → top-2-box intent + "what would make this a no-brainer / a hard no" + MaxDiff (most/least compelling element).
- **price-change** → churn-risk ("would you cancel?"), fairness, downgrade-vs-cancel-vs-accept.
- **landing-page** → 5-second first impression, scroll-stop, comprehension, top objection, CTA-click intent, A/B head-to-head.
- **copy** → line-level reactions (stop / confuse / desire), believability, "the one line you'd cut."
- **name** → recall, pronounceability, association, category-fit.
- **positioning** → "who's this for / not for," differentiation vs a named competitor, the objection it must beat.

## Two ways to run
- **Any chat / any model:** paste [`prompt.md`](../prompt.md) — the whole method in one self-contained prompt.
- **Power mode (Claude Code / agent harness):** `synthcheck.workflow.js` fans the swarm out across parallel sub-agents, scores via a separate SSR pass, and writes a report. Use it when you want hundreds–thousands of grounded twins and a calibration loop.

## Quality rules (non-negotiable)
1. **SSR or it doesn't count** — words first, then map. No direct number asks.
2. **Heterogeneity is the product** — force the distributions; flag collapse.
3. **Anchors make realism** — always name the real competing prices.
4. **Between-subjects** — one price cell per person.
5. **The month-2 rule** — would they keep it, not just buy it.
6. **Distributions + haircut + uncertainty** — never a single flattering number.
7. **Always dual-track** — label "directional"; recommend a real-money test on the winner.
