---
name: research-brief
description: >
  Produce decision-oriented market, competitive, customer, or technical research
  for any project. Use for "research this", "competitive brief", "compare these
  options", or "technical landscape". Verify sources, dates and comparison
  conditions; separate facts, vendor claims, inference and unknowns. Return a
  concise recommendation and evidence, with optional Markdown/HTML handoff to
  paper-strategist. No automatic publication, private-data export or implementation.
---

# Research brief

Research to reduce uncertainty or support a decision, not to accumulate links.
Use original evidence and a fair comparison. Be precise about what was checked,
what remains unknown, and how the evidence changes the recommendation.

## 1. Frame the question

- Identify the audience, decision or exploratory question, candidates, constraints,
  important evaluation criteria and desired depth. Reuse supplied context rather
  than asking a fixed questionnaire.
- Establish relevant versions, geography, deployment model, dates and comparison
  units. Do not compare unlike pricing, licensing, availability or functionality
  without explaining the difference.
- Ask only when missing input materially changes the search or recommendation.
  Otherwise state reasonable assumptions and start a bounded investigation.
- Use only authorized sources and tools. For GitHub use `gh`, not GitHub MCP.
  Use the live connected provider for workplace data; do not change accounts,
  bypass denials, scrape private caches, or substitute a synthetic provider.

## 2. Collect an evidence set

1. Prefer primary material: current documentation, specifications, release notes,
   source code, actual measurements and directly supplied customer evidence.
   Record the exact source URL, relevant date/version and what it establishes.
2. Use independent reports to challenge or contextualize primary claims. Keep
   vendor statements distinct from independently verified behavior.
3. Inspect the source behind a search snippet. A title, AI summary, broken URL
   or inaccessible document is not verified evidence.
4. Search for meaningful counterevidence and alternatives, including keeping the
   current approach. Do not select only sources that support an existing thesis.
5. Triangulate consequential claims where possible. If corroboration is absent,
   report that limitation rather than presenting repeated copies of one claim
   as independent confirmation.
6. Bound depth to the question. Follow high-value gaps, not every possible link.
   Stop when the decision is supported or when remaining uncertainty requires
   information or access the available tools cannot supply.

Never put private documents, customer identifiers, source code, or sensitive query
context into public search/third-party tools. Keep private working evidence separate
from a shareable brief; public artifacts need permitted original references, not
personal research notes or private-store paths.

## 3. Compare fairly

Use the criteria that matter for this decision, not a feature-count contest.
Typical dimensions include user outcomes, fit, maturity, availability, integration
effort, operating constraints, compatibility, cost and uncertainty; omit irrelevant
ones rather than filling a generic matrix.

- Use **verified**, **claimed**, **not found**, **not evaluated**, or **not
  applicable** accurately. "Not found" does not mean a capability does not exist.
- Treat repository stars, forks and mentions as adoption proxies, not proof of
  installed users, production reliability or the usage of an individual skill.
- Price comparisons need units, date, limits and meaningful workload assumptions.
  Do not invent a total cost or benchmark from marketing descriptions.
- Customer observations need their sample and context. A few interviews or one
  anecdote does not establish prevalence or validated demand.
- Conflicting or stale evidence stays visible. Explain which source applies to
  which version/date rather than silently selecting the convenient answer.
- Label inference and confidence from evidence. Do not fabricate calibrated
  percentages, causal conclusions or certainty from a large source count.

## 4. Synthesize the smallest useful brief

Use [the brief template](template.md), shortened when the question is simple:

1. Direct answer or recommendation and its scope.
2. The few findings that matter for the decision.
3. A comparison only when there are actual alternatives.
4. Risks, limitations and the evidence that could change the conclusion.
5. Next decisions or experiments and traceable original sources.

Keep a clear chain from **claim -> evidence -> interpretation -> implication**.
Do not let polished prose hide an unsupported leap. Explain why the preferred
option fits and where it does not, rather than producing a list of endorsements.
If the evidence cannot establish a recommendation, say so and identify the
smallest useful next investigation.

## 5. Handoff and publication boundaries

Default to an answer in the current conversation. Save a brief only when the user
requests an artifact, and only to the authorized location. For a requested rich
paper, use the [paper-strategist workflow](../paper-strategist/SKILL.md) when
available: editable Markdown, matching self-contained HTML and SVG-only visuals.
Do not make another workflow or file mandatory for a small research question.

Pass the research question, scoped findings, comparison criteria, dated sources,
uncertainties and recommendation to the writer. Do not reclassify hypotheses as
facts during handoff or copy private evidence into the shareable paper.

Research does not authorize implementation, account changes, uploads, emails,
issue comments, hosting, public sharing links or GitHub issue creation. Explicit
repository persistence follows its worktree/validation/draft-PR rules. Before
publication, verify destination and evidence permissions; reconcile uncertain
writes instead of duplicating them.

## Acceptance checks

- Consequential claims trace to inspected original sources, not search snippets.
- Comparisons use compatible versions, units and availability conditions.
- Vendor claims, inference, missing evidence and verified behavior stay distinct.
- Counterevidence and meaningful alternatives inform the recommendation.
- Private context is not silently exported into public research or artifacts.
- A short question receives a short brief; publication remains explicit.
