---
name: paper
description: >
  Create or refine self-contained, interactive HTML papers: research,
  product vision, strategy/investment, architecture/convergence,
  evidence/recommendation, delivery roadmaps, and adoption/operating models.
  Always use the bundled HTML templates, at most five major sections,
  terminology and progressive reader personas. Includes a full optional
  component library, twelve CSS themes, responsive SVG diagrams and a
  lightweight type-aware review before delivery. No Markdown paper
  replacement, automatic publication, implementation or review-agent cast.
---

# Paper

Write for a specific reader outcome, not to populate a template. Work in the
current authorized conversation. Preserve the user's selected draft, factual
content, scope, meaningful deep links and approved choices.

## 1. Understand and select the outcome

Read supplied sources deeply before drafting; inspect original records where
authorized and available. A preview, summary or truncated retrieval is not a
complete source. Resolve material gaps without repeating questions that the
sources already answer. Ask only about choices that materially affect scope,
the argument, audience or intended outcome.

Load [paper-types.json](references/paper-types.json) and
[critical-content-rules.json](references/critical-content-rules.json).
Choose one primary type by the reader's goal, not the subject or desired UI:

| Type | Outcome |
|---|---|
| Research and investigation | Understand what evidence establishes and what remains unknown. |
| Product vision | Align on the product promise, beneficiaries, experience and direction. |
| Strategy and investment | Choose what to fund, stop, defer or consolidate. |
| Architecture and convergence | Adopt interfaces/reuse boundaries and migrate without losing behavior. |
| Evidence and recommendation | Proceed, narrow, stop or obtain a specific missing proof. |
| Delivery roadmap | Sequence the requested horizon, dependencies, scope and readiness gates. |
| Adoption and operating model | Reach repeated value with measurable, durable ownership. |

Each profile defines required, recommended and conditional coverage, five
meaningful section groups and outcome checks. Required coverage may be merged
into h3/h4 subsections, not silently dropped. Include recommended material only
when useful. Assess conditional coverage; an explicit user request can make it
required. Don't force research into a fabricated problem, recommendation,
urgency or funding ask.

Honor authorized project-specific constraints and voice supplied by the caller.
Do not import another project's private context, identity, service decisions,
brand, role or authority into a reusable skill or a shareable paper.

## 2. Author HTML, with progressive depth

**Canonical papers are HTML only. Always start with the bundled templates.
Do not produce a Markdown paper or maintain a parallel Markdown version.**
JSON inputs and review receipts are internal tooling, not replacement papers.

Use [the enriched template and component catalog](assets/paper.html), or one
of the seven standalone starters in `templates/`. Read
[the authoring contract](references/authoring.md) before copying components.
Keep the templates' structure and reader behavior instead of inventing an
unrelated shell.

The bundled helper needs Python 3.9+ standard library only:

```text
python "<skill-base>\scripts\paper.py" init "<authorized-path>\paper.html" --type product-vision --title "Actual title" --palette forest
python "<skill-base>\scripts\paper.py" init "<authorized-path>\paper.html" --type delivery-roadmap --content "<authorized-path>\fields.json"
```

Use the platform's actual Python executable and host-provided skill base.
Creation is an unapproved draft; existing files require explicit `--overwrite`.
When revising, preserve the selected paper rather than initializing over it.
No tool setup, package installation, server or publication is a side effect.

- Use **at most five main `#paper > section` groups and five h2 headings**.
  Put actual semantic coverage under h3/h4. Each group has a useful overview.
- Every paper has actual definitions in **`#terminology`**, including meaningful
  distinctions and limits. Definitions do not prove stakeholder agreement.
- Retain **Overview**, **Product & delivery**, and **Technical & evidence**
  personas. Reader selection changes depth, not permission, evidence or authority.
  Every main group supports independent expansion.
- Put advanced code, full inventories, scenarios and detailed evidence in
  labelled `details[data-reader-depth="1"]` or `"2"`. Keep the main argument,
  material risk, scope exclusions and decision conditions visible in Overview.
- Keep the core narrative within **1,500 words**. Preserve requested reference
  depth without concealing an oversized argument to game the budget.
- Use the optional components only when they help the reader. The full catalog
  is authoring inspiration; **remove it from finished papers**. Keep all desired
  evidence and requested examples, not all sample UI.
- Make diagrams explain boundaries and connected flows with concise labels.
  Use inline accessible SVG, caption/key and sufficient detail, not walls of
  disconnected text. Keep full-overview fit, expansion, pan/zoom and mobile use.
- The author sets `paper-default-palette`; readers can override it and use
  **Use default**. Twelve themes vary color, offline system fonts, spacing,
  reading width and CSS header placement, never HTML structure or reading order.
  Use [the theme presets](references/theme-presets.json); do not load remote fonts.
- Use safe syntax-highlighted code, exact-copy behavior and meaningful data.
  Label synthetic charts, animation and what-if models. They never run live
  work, approve readiness or claim actual deployment.

## 3. Apply critical thinking while writing

Separate evidence, interpretation and proposed action. Put support near the
claim, state what was actually inspected/tested and retain contrary evidence.
Cite original sources actually read; do not use generated prose as evidence.
Expose meaningful source/version limits and unknowns.

For decision papers, explain the problem/context before the proposed mechanism.
Compare the strongest viable alternative, including keeping the current path
where meaningful. Explain causality, reuse, tradeoffs, failure modes and the
conditions that would change the choice. Research may compare explanations
without acquiring an invented recommendation.

Do not invent demand, measurements, experiments, owners, dates, staffing,
funding, official event timing, agreement, delivered capabilities or approvals.
Targets remain targets until independently confirmed. Distinguish quality
failure from execution error, missing evidence and untested assertions where
relevant. A simulated planning control cannot create a real commitment.

Use only in-document anchors and verified HTTPS original-source links in
shareable papers. Never link local/relative files or expose secrets, private
unrelated context or restricted evidence. Name a source and disclose unavailable
links rather than fabricating them. Do not broaden sharing permissions.

## 4. Run the integrated light review before delivery

This is **one direct author self-review**, not a review-board workflow, mandatory
multi-agent panel, numeric confidence gate or certification. Never equate a
well-formed HTML file with a sound argument.

1. Run the structure check and create its **unapproved** checklist:

   ```text
   python "<skill-base>\scripts\paper.py" review "<authorized-path>\paper.html" --checklist "<authorized-path>\paper-review.json"
   ```

   It intentionally returns a nonzero exit while review is incomplete. Inspect
   issues, optional coverage warnings, the exact-file hash and selected-type
   questions. Remove unresolved placeholders; repair real issues, not the gates.
2. Review the whole argument directly against the four shared questions and
   three selected-type outcome questions. For each, record `status`, a concrete
   rationale and valid paper anchors. Resolve failures or narrow unsupported
   claims. Explicitly assess every conditional section and why it applies or
   does not. Do not auto-fill passes or fabricate source verification.
3. Use **Playwright first** for browser/HTML checks when available. Verify the
   actual output offline, desktop and narrow phone layouts, keyboard/anchors,
   light/dark appearance, persona/section controls and any included diagrams,
   animation, syntax highlighting and roadmap. Check print and reduced motion
   when those behaviors changed. Record only checks actually performed.
   If a required source or browser check is unavailable, retain an explicit hold;
   a draft may be shown as incomplete, never claimed review-ready.
4. Complete the hash-bound receipt and run:

   ```text
   python "<skill-base>\scripts\paper.py" review "<authorized-path>\paper.html" --author-review "<authorized-path>\paper-review.json"
   ```

   Deliver as reviewed only when it reports **`ready`**. Any subsequent edit
   invalidates the receipt: recheck the changed content and regenerate the
   checklist for the exact new hash. Reuse unchanged verification evidence only
   when still valid for the actual file and affected behaviors.

The helper checks HTML structure, required coverage, real terminology,
placeholders, links/IDs, offline resources, reader controls and content budget.
It verifies review completeness and binding, **not truth or human agreement**.
`--structure-only` never means ready. See [review.md](references/review.md).

## 5. Deliver only the authorized artifact

Lead with the paper's useful conclusion, material uncertainty and the verified
artifact link appropriate to the caller's environment. The link is for depth,
not a replacement for an understandable handoff.

Save only to the requested location. No automatic HTML Canvas publication,
uploads, hosting, sharing links, messages, issues, commitments or implementation.
Publication requires an **explicit current-turn request**; an earlier publication,
template choice, document approval or review receipt does not authorize it.
Reader controls and simulations never perform external writes.

For explicitly requested repository work, obey that project's fresh-base,
isolated-worktree, validation and draft-PR conventions. Do not create a repository
or launch another CLI just to deliver a paper.
