export const meta = {
  name: 'synthcheck',
  description: 'Eval-anchored, source-grounded, SSR-faithful synthetic customer swarm. Harvests real signal, simulates a heterogeneous population, scores reactions via Semantic Similarity Rating, calibrates, and returns a decision.',
  whenToUse: 'Test pricing, offers, price changes, landing pages, copy, names, or positioning before spending real money. Pass a filled config from synthcheck/configs/ as args.',
  phases: [
    { title: 'Harvest', detail: 'scrub competitors/reviews/reddit/own-data/graph into a per-cohort verbatim corpus' },
    { title: 'Swarm', detail: 'instantiate grounded heterogeneous twins and elicit FREE-TEXT reactions (no numbers)' },
    { title: 'Score', detail: 'SSR-map free text to scale points via anchor similarity' },
    { title: 'Decide', detail: 'aggregate, calibrate, haircut, verdict + surprise detector + red-team' },
  ],
}

// ---- config (args) ----
const cfg = args || {}
if (!cfg.decision || !cfg.decision.type) {
  throw new Error('synthcheck: args must include decision.type. Start from synthcheck/configs/_template.yaml')
}
const decision = cfg.decision
const stimulus = cfg.stimulus || decision.question || ''
const cohorts = (cfg.cohorts && cfg.cohorts.length) ? cfg.cohorts : [{ name: 'general-market', share: 1, traits: 'broad representative sample', anchors: [] }]
const N = cfg.n_per_cohort || 40
const BATCH = cfg.batch_size || 8
const metrics = cfg.metrics || ['purchase_intent']
const variants = decision.variants || []
const priceCells = cfg.price_cells || []
const sources = cfg.sources || []
const calibration = cfg.calibration_data || null
const anchorsOverride = cfg.anchors || null

const batchesPerCohort = Math.max(1, Math.ceil(N / BATCH))
log(`Swarm: ${cohorts.length} cohorts × ${N} twins (${batchesPerCohort} batches each) on a "${decision.type}" decision`)

// ---- schemas ----
const HARVEST_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  required: ['cohort', 'objections', 'desires', 'jtbd', 'language_bank'],
  properties: {
    cohort: { type: 'string' },
    objections: { type: 'array', items: { type: 'string' } },
    desires: { type: 'array', items: { type: 'string' } },
    jtbd: { type: 'array', items: { type: 'string' }, description: 'jobs-to-be-done, in the customer\'s words' },
    language_bank: { type: 'array', items: { type: 'string' }, description: 'real phrases/slang customers use' },
    competitor_anchors: { type: 'array', items: { type: 'string' }, description: 'real competing products + prices this cohort already pays' },
  },
}

const ELICIT_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  required: ['cohort', 'responses'],
  properties: {
    cohort: { type: 'string' },
    responses: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['twin_id', 'reactions'],
        properties: {
          twin_id: { type: 'string' },
          cell: { type: ['string', 'null'], description: 'assigned price cell or variant (between-subjects)' },
          backstory: { type: 'string', description: 'one-line grounded backstory for this twin' },
          reactions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              required: ['metric', 'free_text'],
              properties: {
                metric: { type: 'string' },
                free_text: { type: 'string', description: 'natural-language reaction. NEVER a number.' },
              },
            },
          },
        },
      },
    },
  },
}

const SCORED_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  required: ['cohort', 'metric_distributions'],
  properties: {
    cohort: { type: 'string' },
    metric_distributions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['metric', 'cell', 'counts'],
        properties: {
          metric: { type: 'string' },
          cell: { type: ['string', 'null'] },
          counts: {
            type: 'object',
            additionalProperties: false,
            required: ['one', 'two', 'three', 'four', 'five'],
            properties: {
              one: { type: 'integer' }, two: { type: 'integer' }, three: { type: 'integer' },
              four: { type: 'integer' }, five: { type: 'integer' },
            },
          },
        },
      },
    },
    verbatims: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: true, required: ['text', 'valence'],
        properties: { text: { type: 'string' }, valence: { type: 'string', enum: ['objection', 'delight', 'neutral'] } },
      },
    },
  },
}

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  required: ['verdict', 'rationale', 'report_markdown'],
  properties: {
    verdict: { type: 'string', enum: ['ship', 'kill', 'iterate'] },
    rationale: { type: 'string' },
    winning_variant: { type: ['string', 'null'] },
    optimal_price: { type: ['string', 'null'] },
    top_objections: { type: 'array', items: { type: 'string' } },
    surprise: { type: 'string', description: 'where the swarm most disagreed with the stated prior expectation' },
    validate_next: { type: 'array', items: { type: 'string' } },
    variance_warning: { type: ['string', 'null'], description: 'set if distributions look collapsed' },
    report_markdown: { type: 'string', description: 'the full human-readable deliverable' },
  },
}

const anchorsNote = anchorsOverride
  ? `Use these study-specific anchor statements: ${JSON.stringify(anchorsOverride)}`
  : 'Use the default anchor libraries from synthcheck/anchors.md (purchase intent, price fairness, Van Westendorp, Gabor-Granger, churn, comprehension, scroll-stop, CTA, believability).'

// ---- Stage 1: Harvest (barrier — profiles need the full corpus) ----
phase('Harvest')
let corpus = []
if (sources.length) {
  corpus = (await parallel(sources.map((s) => () =>
    agent(
      `You are a market-signal harvester building the grounding fuel for a synthetic customer swarm.\n` +
      `Source type: ${s.type}. Target: ${s.target || s.query || '(use your tools to find it)'}.\n` +
      `Cohort focus: ${s.cohort || 'all cohorts'}.\n` +
      `Decision being tested: ${decision.type} — ${decision.question || ''}\n\n` +
      `Use your tools (web search/fetch, and any available MCP data tools) to pull REAL customer language. ` +
      `Distill into: objections, desires, jobs-to-be-done (in their words), a language_bank of real phrases/slang, ` +
      `and competitor_anchors (real products + prices they already pay). Be specific and quote real wording.`,
      { label: `harvest:${s.type}`, phase: 'Harvest', schema: HARVEST_SCHEMA }
    )
  ))).filter(Boolean)
  log(`Harvested ${corpus.length}/${sources.length} sources into the verbatim corpus`)
} else {
  log('No sources configured — twins will be grounded on config traits only (lower fidelity; add sources for the +15pt grounding lift)')
}

function corpusFor(cohortName) {
  const hits = corpus.filter((c) => !c.cohort || c.cohort === cohortName || c.cohort === 'all cohorts')
  const pool = hits.length ? hits : corpus
  if (!pool.length) return '(no harvested corpus — ground on traits + named competitor anchors only)'
  return pool.map((c) =>
    `Objections: ${(c.objections || []).join(' | ')}\nDesires: ${(c.desires || []).join(' | ')}\n` +
    `JTBD: ${(c.jtbd || []).join(' | ')}\nLanguage: ${(c.language_bank || []).join(' | ')}\n` +
    `Competitor anchors: ${(c.competitor_anchors || []).join(' | ')}`
  ).join('\n---\n')
}

// ---- build the work-list of batches ----
const cellList = decision.type === 'pricing' || decision.type === 'price-change'
  ? (priceCells.length ? priceCells : ['(no price cells configured)'])
  : (variants.length ? variants : ['(single variant)'])

const batches = []
for (const co of cohorts) {
  for (let b = 0; b < batchesPerCohort; b++) {
    batches.push({ cohort: co, batchIndex: b })
  }
}

// ---- Stage 2→3: Swarm (elicit) then Score (SSR-map), pipelined per batch ----
phase('Swarm')
const scoredBatches = (await pipeline(
  batches,
  // Stage A: instantiate grounded twins + elicit FREE-TEXT
  (item) => {
    const co = item.cohort
    return agent(
      `You simulate a batch of ${BATCH} heterogeneous synthetic customers ("twins") for cohort "${co.name}".\n\n` +
      `STIMULUS (what they react to):\n${stimulus}\n\n` +
      `COHORT TRAITS: ${co.traits || ''}\n` +
      `GROUNDING CORPUS (use this real language to make twins real, not generic):\n${corpusFor(co.name)}\n\n` +
      `BUILD ${BATCH} twins with FORCED HETEROGENEITY (anti-collapse): spread income ~5×, price sensitivity, ` +
      `skepticism, purchase fatigue, life circumstances (~20% financially stressed), mood, and the specific JTBD each is hiring for. ` +
      `Give each a one-line grounded backstory. Name the real competitor prices they anchor to: ${(co.anchors || []).join(', ') || 'infer from corpus'}.\n\n` +
      `BETWEEN-SUBJECTS: assign each twin exactly ONE cell from [${cellList.join(' | ')}] (rotate across the batch). Never let a twin see other cells.\n\n` +
      `ELICIT for metrics [${metrics.join(', ')}]. For EACH metric, the twin reacts in NATURAL LANGUAGE only — ` +
      `what they'd do, what they'd pay, what stops them, what they love. ABSOLUTELY NO numeric ratings; that is a different step. ` +
      `Apply the month-2 rule: a twin only "converts" if it would defend the charge on its bank statement in month 2.\n\n` +
      `Return the responses array. free_text must be a real human-sounding reaction, never a number.`,
      { label: `twins:${co.name}#${item.batchIndex}`, phase: 'Swarm', schema: ELICIT_SCHEMA }
    )
  },
  // Stage B: SSR-map free text → scale points via anchor similarity
  (elicited, item) => {
    if (!elicited) return null
    return agent(
      `You are the Semantic Similarity Rating (SSR) scorer. You receive free-text customer reactions and map each ` +
      `to a 1–5 scale point by which ANCHOR STATEMENT it is most semantically similar to. ` +
      `You do NOT see any number from the customer — only their words. This is what keeps distributions realistic.\n\n` +
      `${anchorsNote}\n\n` +
      `Cohort: ${item.cohort.name}. Metrics: [${metrics.join(', ')}].\n` +
      `FREE-TEXT RESPONSES (JSON):\n${JSON.stringify(elicited.responses).slice(0, 12000)}\n\n` +
      `For each metric AND each cell, return counts of how many twins landed on each anchor point (one..five). ` +
      `Also extract the 3–5 richest verbatims (objection/delight) — the discriminative, low-positivity-bias gold.`,
      { label: `ssr:${item.cohort.name}#${item.batchIndex}`, phase: 'Score', schema: SCORED_SCHEMA }
    )
  }
)).filter(Boolean)

// ---- Stage 4: aggregate distributions in plain JS (barrier reached: all scored) ----
phase('Decide')
const agg = {} // key: metric||cell -> {one..five, cohorts:Set}
const allVerbatims = []
for (const sb of scoredBatches) {
  for (const md of (sb.metric_distributions || [])) {
    const key = `${md.metric}||${md.cell ?? 'all'}`
    const a = agg[key] || { metric: md.metric, cell: md.cell ?? 'all', one: 0, two: 0, three: 0, four: 0, five: 0, cohorts: {} }
    const c = md.counts || {}
    a.one += c.one || 0; a.two += c.two || 0; a.three += c.three || 0; a.four += c.four || 0; a.five += c.five || 0
    a.cohorts[sb.cohort] = true
    agg[key] = a
  }
  for (const v of (sb.verbatims || [])) allVerbatims.push({ cohort: sb.cohort, ...v })
}
const aggregated = Object.values(agg).map((a) => {
  const n = a.one + a.two + a.three + a.four + a.five
  const top2 = n ? Math.round(((a.four + a.five) / n) * 100) : 0
  return { metric: a.metric, cell: a.cell, n, dist: { one: a.one, two: a.two, three: a.three, four: a.four, five: a.five }, top2box_pct: top2 }
})
log(`Aggregated ${aggregated.length} metric×cell distributions across ${scoredBatches.length} batches`)

// ---- Stage 5: Decide (verdict + calibration + surprise + red-team) ----
const report = await agent(
  `You are the decision synthesizer for a synthetic customer swarm. Produce the final deliverable against the Outcome Contract.\n\n` +
  `OUTCOME CONTRACT:\n- Decision: ${decision.type} — ${decision.question || ''}\n- Threshold: ${decision.threshold || '(none given — recommend one)'}\n` +
  `- Variants/cells tested: ${cellList.join(' | ')}\n- Stated PRIOR expectation (for the Surprise Detector): ${decision.prior_expectation || '(none given)'}\n\n` +
  `AGGREGATED DISTRIBUTIONS (top2box = % at 4+5):\n${JSON.stringify(aggregated, null, 1)}\n\n` +
  `VERBATIMS:\n${JSON.stringify(allVerbatims.slice(0, 40), null, 1)}\n\n` +
  `CALIBRATION DATA (treat swarm as PRIOR; shift toward this observed reality if present): ${calibration ? JSON.stringify(calibration) : 'none — output is uncalibrated prior; say so'}\n\n` +
  `DO ALL OF THIS:\n` +
  `1. Apply an optimism haircut (~50% on stated conversion for planning numbers; keep RANKINGS as-is).\n` +
  `2. Report distributions + uncertainty, never a single flattering number.\n` +
  `3. VARIANCE GUARDRAIL: if any distribution is implausibly tight (almost all mass on one point), set variance_warning and note the swarm may have collapsed (re-run with more heterogeneity).\n` +
  `4. Give the verdict vs the threshold (ship/kill/iterate) with rationale.\n` +
  `5. Pricing decisions: derive optimal price + the elasticity shape from the cells.\n` +
  `6. Red-team: surface the objections most likely to kill this, even if minority.\n` +
  `7. SURPRISE DETECTOR: where did the swarm most disagree with the stated prior expectation? This is the headline insight.\n` +
  `8. validate_next: the 1–2 signals worth a real-money smoke test before locking (always dual-track).\n\n` +
  `Write report_markdown as a clean, skimmable deliverable a founder can act on in 60 seconds: verdict up top, the table, ` +
  `the pricing/variant call, top objections (fixes), verbatim gold (ad-copy seeds), the surprise, and what to validate with real humans next. ` +
  `Label it clearly as DIRECTIONAL.`,
  { label: 'decide', phase: 'Decide', schema: REPORT_SCHEMA }
)

return {
  decision_type: decision.type,
  verdict: report.verdict,
  winning_variant: report.winning_variant || null,
  optimal_price: report.optimal_price || null,
  surprise: report.surprise,
  variance_warning: report.variance_warning || null,
  aggregated,
  report_markdown: report.report_markdown,
  meta: { cohorts: cohorts.map((c) => c.name), n_per_cohort: N, batches: batches.length, sources_harvested: corpus.length },
}
