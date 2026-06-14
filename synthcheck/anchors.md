# SSR Anchor Libraries

The heart of Semantic Similarity Rating. A twin reacts in **free text**; the scorer maps that text to a scale point by picking the anchor statement it is **most semantically similar to**. Production SSR embeds both (`text-embedding-3-small`) and takes cosine argmax; the in-harness scorer reasons over these anchors directly.

**Rule:** the scorer sees ONLY the free-text reaction + the anchor set. It never sees a number the twin emitted (there isn't one). This is what prevents the variance-collapse that direct-Likert asks cause.

Anchors below are the defaults. Override per-study in the config when the category has its own language (the paper found hand-tuned anchors don't always transfer — calibrate when you have real data).

---

## Purchase Intent (1–5 top-2-box = 4+5)
- **5 — Definitely would buy:** "I'd buy this right now / take out my card today / this is exactly what I've been looking for / shut up and take my money."
- **4 — Probably would buy:** "I'm interested, I'd likely try it / this looks worth it / I'd sign up after a quick look at details."
- **3 — Might or might not:** "I'm on the fence / depends on price / maybe, I'd need to think about it / not sure it's for me."
- **2 — Probably would not:** "Doesn't really grab me / I have something similar / I don't see why I'd switch / probably not."
- **1 — Definitely would not:** "No interest / not for me at all / I'd never pay for this / hard pass."

## Price Fairness / Value (1–5)
- **5:** "That's a steal / cheaper than I expected / clearly worth more than they're asking."
- **4:** "Fair / reasonable for what you get / I'd pay that without flinching."
- **3:** "About what I'd expect / neither cheap nor expensive / it's fine."
- **2:** "Bit steep / I'd hesitate / I'd want a discount or trial first."
- **1:** "Way overpriced / no way / that's a rip-off for what it is."

## Van Westendorp (free-text → bucket, then build PSM curve)
Ask each as free text, map the *price the twin names* into the curve:
- **Too cheap (quality doubt):** "At that price I'd assume it's low quality / something's wrong with it."
- **Cheap (bargain):** "At that price it's a great deal, I'd grab it."
- **Expensive (but considered):** "At that price I'd have to think hard / it's a stretch but maybe."
- **Too expensive (rejected):** "At that price I'm out / absolutely not."

## Gabor-Granger (buy-at-$X, yes/no with intensity → demand curve)
- **5 — yes, easily:** "At $X? Yes, no question."
- **4 — yes, with a slight pause:** "At $X, yeah I'd do it."
- **3 — borderline:** "At $X... maybe, that's right at my limit."
- **2 — leaning no:** "At $X, probably not."
- **1 — no:** "At $X? No way."

## Churn Risk on Price Change (1–5, 5 = highest churn risk)
- **5 — would cancel:** "That increase? I'm canceling / done / switching."
- **4 — likely churn:** "I'd seriously look at alternatives / on my way out."
- **3 — would consider downgrade:** "I'd drop to a cheaper plan / pause it."
- **2 — grumble but stay:** "Annoying, but I'd probably keep it."
- **1 — accept:** "Fine, still worth it to me / wouldn't even notice."

## Comprehension (landing/copy, 1–5)
- **5:** "Crystal clear, I know exactly what this is and who it's for."
- **4:** "Pretty clear, I get the gist."
- **3:** "Roughly, but I had to work for it."
- **2:** "Confusing / I'm not sure what they actually do."
- **1:** "No idea what this is or why I'd care."

## First-Impression / Scroll-Stop (landing, 1–5)
- **5:** "Stops me dead, I'd read on / instantly intrigued."
- **4:** "Caught my eye, I'd keep scrolling to learn more."
- **3:** "Fine, didn't compel me but didn't repel me."
- **2:** "I'd probably scroll past."
- **1:** "Bounce / close tab immediately."

## CTA-Click Intent (1–5)
- **5:** "I'm clicking that button now."
- **4:** "I'd likely click."
- **3:** "Maybe, if I had more time / after more info."
- **2:** "Unlikely to click."
- **1:** "No chance I click."

## Believability / Trust (1–5)
- **5:** "Totally credible, I believe the claim."
- **4:** "Mostly believable."
- **3:** "Skeptical but open."
- **2:** "Sounds like marketing hype."
- **1:** "I don't believe a word of this."

---

## Scoring distribution, not point
For each metric, return the **count of twins at each anchor (1–5)** → a distribution. Top-2-box = share at 4+5. Keep the spread; the variance guardrail compares it to the expected human test-retest spread (~0.6–0.9 SD on a 5-pt scale is typical; much tighter = collapse → re-run with more heterogeneity).
