# Copilot deterministic approval policy

Pair root **`APPROVALS.md`** (risk, confidence, context and merge method) with
**`APPROVALS.yml`** (deterministic rules). If `.yml` is absent, use `APPROVALS.yaml`.
Read both from the actual PR **base commit**, never its proposed head copies.
Record/pin both blob SHAs; either changing pauses approval/merge for owner renewal.
Both files are required for these automated gates. Missing/invalid/ambiguous data
blocks them, not review/repair. Installing the toolkit adopts neither template.

## Version 1 rule model

The portable rule structure uses **Copilot** provider names: `verdict.copilot`,
`copilot/code_review`, `copilot/diff`. Keep those names; don't add a second provider
namespace or pretend this is a byte-identical provider-specific schema. Extensions
use glob patterns, not invented `file_types`/`auto_approve` keys. Start from the
[sidecar example](../assets/APPROVALS.yml), which defaults to `mode: observe`.

| Location | Keys and values |
|---|---|
| Root | `version: 1`, required `rules`; `mode: enforce/observe`, `nested: overwrite/inherit`, `run: sequential/parallel`, optional `locals`. |
| Rule | Required double-quoted `purpose` and `paths`; at least `verdict`, `advisory`, `findings` or meaningful `reuse`; optional `if`, `override`, `use`, `mode`, `nested`, `run`. |
| Verdict | `copilot: approves/comments/blocks`; `seats` unless blocked; optional `max_age` from `1m` through `83d`. |
| Seats | Number `0..16`, or up to eight `{ count: 1..16, from: <people-list> }` sets. Every set must be filled; a person can fill several sets. |
| Override | Ordered list with `if` and at least `verdict`, `reuse` or `findings`; optional `purpose`/`use`. First true wins. Verdict fields replace individual fields; seats replace the whole seats value. |
| Locals | Values referenced by `"@name"`; `use: ["@name"]` copies rule fields. Explicit fields win; verdict/findings/reuse maps merge by key. |
| Reuse | Boolean/condition, classifier name or map (`seats` and classifier names -> conditions); override `unset` removes it. Never restores a natively dismissed review. |
| Findings | `resolution` as a people list, classifier-to-list map, or ordered `{ if, from }` sets. Permissions and verified dispositions still govern resolution. |

Globs include `*`, whole-segment `**` (dot folders included), `{a,b}`, `[ab]`, `?`
and quoted `"!path/**"` exclusions local to that rule. There must be an inclusion.
Paths use Git's slash-separated names; directory patterns end in `/**`, not `/`.
A renamed file is evaluated at **old and new paths**, counted as one changed file.
All applicable rules combine: **blocks > comments > approves**; every seat set
must pass and shortest `max_age` wins. A broad restrictive rule does not disappear
because a second allowlist matches. Exclude fast paths from the broad rule if that
is the owner's intended policy. Uncovered paths or no applicable covering verdict
cannot authorize these automated gates.

## Deterministic conditions

Use `true`/`false`, or one double-quoted condition. Operators are `=`, `!=`, `<`,
`<=`, `>`, `>=`; uppercase `AND`/`OR` and parentheses (max depth eight). Parenthesize
mixed AND/OR. Single-quote logins, branch globs and `!` items inside a condition.

| Facts | Meaning |
|---|---|
| `pr/files_changed`, `pr/files_added`, `pr/files_removed`, `pr/diff_lines` | Complete PR counts; missing counts are not zero. |
| `rule/files_changed`, `rule/files_added`, `rule/files_removed` | Counts over files matching this rule. |
| `pr/base` | Actual target branch; supports a quoted glob. |
| `pr/authors`, `pr/opened_by` | Verified accounts opening/writing/pushing the PR, not commit-message co-author trailers. |
| `pr/approved_by` | Current valid write-access human approvals, excluding authors/bots. |

Use `ANY`/`ALL` for author/approver lists, or `pr/approved_by = empty`/`!= empty`.
People lists accept `humans`, `bots`, standalone `everyone`, logins, `org/team`,
`bot:name`, `pr/authors`, `pr/opened_by`, and quoted exclusions such as
`"!pr/authors"`. `nobody` is allowed alone under findings. Roles/team membership
must be verified; unknown membership cannot fill a needed seat.

A write-access PR author may fill a YAML seat without submitting a review when
the set admits them and current opener/author/pusher evidence establishes it.
Forks/outside contributors cannot claim that author seat; on a fork, an
`!pr/authors` seat cannot be filled. A machine-driven User account is a human-kind
seat, not proof of independent human review. YAML seats are **not native GitHub
approvals**; the host cannot approve its own PR, invent an App's future review,
or override required independent/CODEOWNER approvals.

## Local evaluation, not model interpretation of paths

Run the bundled [evaluator](../scripts/approval-policy.mjs) on base-pinned sidecar
and a complete, verified, revision-bound session snapshot:

```text
node <toolkit>\skills\approve-pr\scripts\approval-policy.mjs <session>\APPROVALS.yml <session>\pr-snapshot.json
```

It requires Node.js 22+ and the toolkit's locked `yaml`/`picomatch` dependencies.
If the required command fails for missing packages, restore with
`npm ci --ignore-scripts` in the **toolkit package root**, subject to permissions;
don't add dependencies to the target repo or silently use an LLM as the parser.
The helper reads/evaluates only; it performs no GitHub writes or permission grants.

Snapshot fields: `headSha`, `baseSha`, `base`, `filesComplete`, `authorsComplete`,
`approvalsComplete`, `isFork`, `files` (`path`, optional `previousPath`, `status`,
`additions`, `deletions`, `kind: file/symlink/submodule`, plus `previousKind` for
modified/renamed/type-changed files), `authors` (login/kind/
writeAccess/verified teams), `openedBy`, `openedHeadSha`, optional `latestCommit`
(authorLogin/pusherLogin), and chronological `approvals` (login/kind/writeAccess/
teams/state/commitId/nativeValid). Include `outsideContributor`, original
`evaluatedAt`, and proven `diffUnchanged` only when source evidence establishes
them. Capture all files/reviews/authors; a truncated list or retyped assertion is
not independent evidence. Preserve those source references in the run record.
Derive file kinds from actual old/new Git modes, not extensions. A rename must
provide both canonical paths; a mode change cannot hide its previous symlink or
submodule kind. Keep reviews chronological and latest decisive state per account.

Output is compact: exact revisions, `copilot`, `seatsSatisfied`,
`policySatisfied`, `automationApprovalAllowed`, expiry, reasons and matched rules.
CLI detail lists are capped (16 rules/reasons, three path samples per rule), with
total counts and `detailsTruncated`; aggregate verdicts still evaluate **all**
input evidence/rules. Truncated display detail is not truncated input coverage.
Approval needs **automationApprovalAllowed** plus Markdown and native gates.
Merge needs **policySatisfied** plus all Markdown risk/confidence and native merge
requirements; a `comments` verdict can allow merge after required real approvals,
but never submits an automated approving review. Observe never authorizes either.

Provider classifier identifiers are retained in this Copilot namespace:
`copilot/code_review` consumes current recorded auto-review evidence;
`copilot/diff` describes a verified authored delta; `repo/name`, `.output`,
`.severity` and `(input=value)` address custom results. Supply only sourced,
head/base-bound results with `status`, `value` and `source`. Custom string outputs
need their definition's allowed `values` (ordered for ordinal comparisons); numeric
outputs need verified `min`/`max`. Missing, invalid or in-progress evidence stays
pending, including under `!=` predicates. A finished error/incomplete
override keeps the strict base verdict and does not fall through to a later
permissive override; explicit `= error`/`= incomplete` can select its own verdict.
No remote model/API is called by this evaluator. `run` never authorizes agents.

The local helper handles the **root** sidecar. It refuses a snapshot containing
nested sidecars rather than ignoring their rules; `nested` does not implement
hierarchy on its own. It conservatively requires current native-valid approval
evidence (or a proven unchanged diff), rather than evaluating permissive old-diff
reuse. Findings/classifier lifecycle remains with the owning skills. A matching
`findings` rule also requires sourced, head/base-bound `findingsEvidence`: the
owner must verify all applicable resolver permissions and current classifier/
finding dispositions before supplying it. A clean verdict or JSON assertion
cannot prove a thread was legitimately resolved. Never silently ignore a relevant
unsupported feature to lighten a gate. Protected policy/owner/Git files need a
verified person; `.gitattributes`, symlinks and submodule changes never receive
automated approval from this helper.

## Token-efficient use

Cache the validated policy by both blobs/PR base and the decision by complete
fact/review/classifier fingerprints and expiry. Re-run only when those inputs or
expiry change; return the compact decision, not YAML/JSON pages, to model context.
Classifier work occurs only when a matching condition requires it and existing
evidence is insufficient. Native writes always recheck fresh authority/state.
