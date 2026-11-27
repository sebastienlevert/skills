# Integrated light review

One direct author pass, proportionate to the selected outcome. No ten-persona
board, external reviewer, automatic publication or numeric confidence score.
Substantive problems are corrected or explicitly held before delivery.

## What is checked

The helper checks the HTML-only five-group ceiling, required semantic coverage,
actual terminology, reader controls, core narrative budget, unresolved drafting
slots, author-library removal, duplicate IDs, fragment links, HTTPS-only source
links, SVG-only visuals and offline resources. It accepts merged coverage marked
on real content. Recommended coverage is advisory.

The author then answers four shared questions: claim/source traceability,
reasoning/alternatives, scope/commitments and reader depth/terminology. Each type
adds three outcome-specific checks from `paper-types.json`:

| Type | Light-review emphasis |
|---|---|
| Research | Answer the scoped questions; expose evidence limits; do not invent a problem or default recommendation. |
| Vision | Make value/experience understandable; distinguish first proof from ambition; do not claim agreement or delivered features. |
| Investment | State the actual choice/strongest alternative; retain resource uncertainty/stop conditions; enable a concrete investment choice. |
| Architecture | Make interfaces/compatibility explicit; identify code/reuse/ownership boundaries; provide migration and retirement proof. |
| Recommendation | Let decisive evidence drive the action; retain contrary findings; separate the bounded next action from release/investment authority. |
| Roadmap | Connect targets to scope/dependencies/proof; cover the requested horizon; expose capacity and date uncertainty. |
| Operating model | Measure repeated user value; establish durable ownership/independence proof; expand through evidence, not assumed adoption. |

Assess each conditional section explicitly. If it applies, its actual coverage
is required. If it does not, explain why rather than inserting generic prose.
Browser checks must refer to the actual paper and included interactions.

## Exact-file receipt

`review --checklist` creates an **unapproved** JSON receipt with the file's SHA-256,
type, required questions and unset browser/conditional results. The author fills
each check with `status: "pass"`, a concrete `rationale`, and existing `anchors`
such as `["#findings", "#limits"]`. A failed/unknown answer is not passed.

Conditional answers use a boolean `applies` plus a specific `reason`. Browser
results record actual offline, desktop, mobile, keyboard and reader-control
verification. Use Playwright first when available, and inspect included diagram,
animation, code-copy and roadmap behavior as applicable.

`review --author-review` holds stale hashes, missing/failed substantive answers,
invalid evidence anchors, applicable-but-missing coverage and incomplete browser
checks. Any paper edit changes its hash, including line-ending edits.
Regenerate an existing explicitly named checklist with `--overwrite-checklist`;
the default preserves an existing receipt.

| Result | Meaning |
|---|---|
| `hold` | A structural, content-review, source or verification issue remains. |
| `needs-author-review` | Structure passed; no complete exact-file author assessment exists. |
| `ready` | Format checks and the supplied exact-file author assessment are complete. It is not independent truth verification, human approval or publication authority. |

`--structure-only` can exit successfully for tooling while still reporting
`needs-author-review`. Never present it as a reviewed paper. Do not fabricate
receipt answers to satisfy the tool, weaken required checks or silently change
the paper's type to evade the intended outcome.

Source access failures and missing browser capabilities stay visible holds.
A requested draft may be delivered as **incomplete**, with the specific gap;
never claim a failed or unverified paper is review-ready. No automatic external
actions or permissions are introduced by any result.
