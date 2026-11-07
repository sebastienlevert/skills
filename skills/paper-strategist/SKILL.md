---
name: paper-strategist
description: >
  Create or refine decision-ready strategy and architecture papers, using
  evidence, a clear thesis, alternatives, tradeoffs, and a concrete ask. Use for
  "write a strategy paper", "decision paper", or "rich HTML paper". Produce editable
  Markdown and, when requested, clean self-contained HTML with light/dark mode,
  a floating TOC, reading-time estimate, and SVG-only visuals. Ask only material
  missing questions; do not impose a fixed interview or publish automatically.
---

# Paper strategist

Write to resolve a decision, not to fill a template. Lead with the thesis, explain
the mechanism, substantiate it, and end with the action needed. Follow the
project's own document conventions where they exist.

## 1. Understand the decision

- Establish topic, audience, intended decision, current recommendation, scope and
  evidence. Preserve the user's existing draft and approved choices.
- Read relevant supplied sources before asking for information already present.
  If a draft is already selected, continue it; do not silently substitute another
  document found in a folder.
- Ask only questions whose answers materially change the recommendation or
  argument. A short interview is useful when input is thin; a fixed sequence of
  questions or a numeric confidence gate is not required.
- Separate facts, assumptions, hypotheses and decisions. Do not invent customer
  demand, numbers, owners, dates, approvals or proof of implementation.
- Research can supply an evidence brief, but a separate research workflow or
  review-agent cast is not mandatory for every paper.

## 2. Use an opinionated narrative

Use [the Markdown template](template.md). Its default order is:

1. **Executive decision brief:** recommendation, why now, and the precise ask.
2. **Context:** audience, relevant change, scope and explicit non-goals.
3. **Problem:** observable pain, evidence and the current baseline.
4. **Insight:** the argument that changes how the problem should be approached.
5. **Proposal:** mechanism, boundaries, viable alternatives and tradeoffs.
6. **Operating model:** responsibilities, dependencies and a proportionate path.
7. **Proof and signals:** measures, experiments and stop/pivot criteria.
8. **Risks and open decisions:** failure modes and assumptions that could overturn
   the recommendation.
9. **Next steps:** concrete actions and decisions, without invented commitments.

The executive brief is unnumbered; the eight narrative sections follow it.
Adapt length to the decision. Prefer prose that explains causality over walls of
bullets, decorative cards or slide-like fragments. Include a table only when it
makes comparison or ownership easier to understand.

Use viable alternatives, including maintaining the current approach where
meaningful. Distinguish current commitments from proposed or deferred work.
Omit irrelevant detail rather than fabricating material to populate every heading.
Do not silently expand a focused paper into a platform roadmap.

## 3. Produce the requested artifacts

Markdown is the editable source. When HTML is requested, create a matching
self-contained `.html` using [the reader template](assets/paper.html) and
[the visual contract](references/html-style.md). The template opens directly in
a browser; it has no renderer, build step, external fonts or package dependencies.

Replace preview title, metadata, decision brief, body, diagrams and references
with the actual paper. Transfer the content rather than reauthoring the argument
during formatting. Keep the Markdown and HTML sections, numbers, evidence and
decisions consistent. Escape quoted text and code; never turn untrusted source
HTML into active markup or script.

All visuals are inline SVG diagrams/charts with explanatory captions. No raster
images, remote images, screenshots, SVG `<image>` elements, or external diagram
renderers. Do not invent chart data. Preserve editable SVG source if useful.

Retain the template's lightweight reader behavior:

- System-aware light/dark mode with a user override and safe storage fallback.
- Floating, collapsible TOC generated from actual headings.
- Approximate reading time and word count from prose, not navigation or code.
- Reading progress, stable anchor links, mobile layout and print styling.
- Keyboard access, reduced-motion support, and a readable no-JavaScript fallback.

Use neutral branding by default. Apply an explicitly supplied brand only when it
preserves readability, contrast, content hierarchy and both themes. Do not embed
personal preferences, internal branding or private source material into a reusable
template.

## 4. Validate and hand off

1. Check thesis, audience, ask, evidence, alternatives, scope and internal
   consistency. Label unresolved assumptions instead of making them look settled.
2. Verify citations against original sources. Private research can inform the
   reasoning, but do not expose personal notes or restricted evidence in a paper
   intended for others; obtain a suitable original source or disclose the gap.
3. Review both HTML themes, narrow/wide layouts, TOC links, reading estimate and
   print output. Check that the paper opens without a network connection and that
   all visuals are SVG. Do not equate packaging validation with content approval.
4. Return the requested file(s) and material open decisions. A chat-only draft
   makes no files. Save only to the authorized location; no automatic emails,
   uploads, hosting, sharing-link creation, GitHub issues or publication.
5. If explicitly saving into a repository, follow its instructions, fresh-base
   task worktree, validation and draft-PR conventions. Do not create a repository
   just to deliver a document or auto-implement its proposals.

## Acceptance checks

- Existing evidence reduces questions instead of triggering a repetitive interview.
- The paper has a clear recommendation, mechanism, alternatives and decision ask.
- HTML and Markdown convey the same claims and commitments.
- The HTML is a single offline-readable file with SVG-only visuals.
- Reader controls enhance navigation without dominating or obscuring content.
- Sharing and publication remain separately authorized actions.
