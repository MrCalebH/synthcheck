<div align="center">

# SynthCheck — test the market before you build it

**Simulate a thousand of your customers and ask them anything — your price, your offer, your name, your landing page — before you spend a dollar finding out the hard way.**

[![Website](https://img.shields.io/badge/website-synthcheck-ff5c38?style=flat-square)](https://trysynthcheck.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![Works with any LLM](https://img.shields.io/badge/works%20with-Claude%20·%20GPT%20·%20Gemini%20·%20any%20LLM-9d7bff?style=flat-square)](#two-ways-in)

[**Try it now →**](#two-ways-in) · [**The method →**](#the-method) · [**Why it's accurate →**](#why-it-actually-works)

</div>

---

## Why SynthCheck exists

Everyone building anything makes the same expensive bet: they pick a price, a name, a headline, an offer — **on a hunch** — then spend weeks and dollars finding out if the market agrees. Real customer research is slow, costly, and usually skipped.

It doesn't have to be. The biggest CPG company in the world (Colgate-Palmolive), Stanford, and a $1B startup (Aaru) all proved the same thing in 2024–2025: **a properly-run simulated market predicts real customer behavior with remarkable accuracy** — 85–92% correlation with real survey panels. Aaru's synthetic voters called a primary within 371 votes.

**SynthCheck** packages that exact method into one command. Tell it a decision; it builds a realistic, heterogeneous population of your customers, interviews them in their own words, and hands you the market's verdict — what'll sell, what won't, what to charge, and the objections you didn't see coming.

## The whole idea, in 7 words

> **Don't launch to find out. Find out, then launch.**

The catch with naive "ask ChatGPT what customers think" is that it lies politely — everything scores a 4/5. SynthCheck's discipline (interview in *words*, then map to the scale; force real heterogeneity; ground in real customer language) is the difference between a flattering guess and a verdict you can bet on.

## Two ways in

**Option A — paste one prompt into any chat** (Claude, GPT, Gemini, anything). No install, any model:

> Open [`prompt.md`](./prompt.md), copy the box, fill the four blanks, send. Verdict in one message.

**Option B — install the skill** (Claude Code, Codex, Gemini CLI & friends):

```bash
git clone https://github.com/MrCalebH/synthcheck.git
# copy the synthcheck/ folder into your agent's skills directory
```

Then say **`/synthcheck`** or *"run a synthcheck test on this price."*

**Point your agent at it** — already have an agent? Just give it the raw URL and say *"follow this":*
`https://raw.githubusercontent.com/MrCalebH/synthcheck/main/prompt.md`

## The method

Six steps. The discipline in each is what makes it accurate instead of flattering.

| Step | What happens |
|---|---|
| **1 · Outcome Contract** | Restate the decision as a falsifiable question + a ship/kill threshold. Capture your own prediction (powers the Surprise Detector). |
| **2 · Cohorts** | 4–6 real segments — including a skeptic/red-team and a premium cohort. Ground them in real reviews/reddit/competitor language. Name the real prices they already pay. |
| **3 · Simulate** | Build the population with **forced heterogeneity** (income, skepticism, price-sensitivity, life). One price per person (between-subjects). |
| **4 · Elicit in words** | Each person reacts in natural language — never a number yet. The month-2 rule: would they *keep* it, not just buy it. |
| **5 · Score by similarity** | Map each reaction to a 1–5 point by which anchor it resembles (**SSR**). Report the distribution, not a mean. |
| **6 · Verdict** | Ship/kill vs the threshold + optimism haircut + objection map + verbatim gold + 🔦 the Surprise + what to validate with real money next. |

## Why it actually works

Three findings, three levers — all baked into the steps above:

- **Words, then numbers (SSR).** Colgate-Palmolive × PyMC Labs (2025): mapping free-text reactions to the scale by semantic similarity hit **90–92% correlation** with real survey panels, vs garbage from direct "rate 1–5" asks. → *Step 4 → 5.*
- **Grounding beats demographics by +15 points.** Stanford "Generative Agent Simulations of 1,000 People" (2024): agents built on rich real backstories replicated people's answers **85% as well as the people replicated themselves**. → *Step 2.*
- **Scale + calibration.** Aaru (2025): a persistent swarm that updates against real outcomes predicted a primary within **371 votes**. → *the dual-track + validate-next.*

**Honest framing:** SynthCheck is *directional*. It ranks options and surfaces real objections reliably; absolute conversion numbers flatter reality. Always smoke-test the winner with real money before betting big. It gets sharper the more real data you feed it.

## Use it on everything

Pricing · Offers · Price changes · Landing pages · Headlines & copy · Product names · Positioning · Feature bets · Pitch lines. Anywhere you're about to ship on a hunch, run a SynthCheck first.

## The one rule

> **Directional, not gospel.** SynthCheck tells you what to build and what to test — it doesn't replace the real-money test. Use it to stop betting blind, not to stop validating.

## What's in here

```
prompt.md             the gift — paste into any chat, any model (start here)
synthcheck/
  SKILL.md            the installable skill (Claude Code, Codex, Gemini CLI…)
  anchors.md          the SSR scoring libraries (the accuracy backbone)
  synthcheck.workflow.js  power mode — fan a real swarm across parallel agents
  configs/            config template for power mode
web/                  the website (trysynthcheck.vercel.app)
```

## Wear the badge

Shipped something you tested with SynthCheck? Add the badge — it's how SynthCheck spreads:

[![Tested with SynthCheck](https://img.shields.io/badge/tested%20with-SynthCheck-ff5c38?style=flat-square)](https://trysynthcheck.vercel.app)

```markdown
[![Tested with SynthCheck](https://img.shields.io/badge/tested%20with-SynthCheck-ff5c38?style=flat-square)](https://trysynthcheck.vercel.app)
```

## License

MIT — take it, fork it, ship it. See [LICENSE](./LICENSE).
