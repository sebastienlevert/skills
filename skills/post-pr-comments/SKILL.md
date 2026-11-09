---
name: post-pr-comments
description: >
  Publish reviewed findings as inline GitHub pull-request comments at the exact
  relevant diff lines using the gh CLI. Use for "post PR comments", "post this
  review", "post the comments inline", or "send these findings to the PR".
  Verify the current revision, preserve finding IDs, deduplicate delivery and
  verify published threads. Posting is explicit; never approve, request changes,
  resolve threads, edit source or merge without separate authorization.
---

# Post PR comments

Put each actionable finding where the author can act on it: the specific file
and smallest relevant line range in the PR diff. A summary containing file links
is not an inline review. Use GitHub CLI (`gh`), never a GitHub MCP server.

This skill publishes an existing review; it doesn't manufacture findings or
perform another full review. Reuse the current findings and their supporting
evidence. If there are no reviewed findings, request them or use `auto-review`
when a review is authorized. A request to review alone doesn't authorize posting.

## 1. Resolve scope and authority

1. Identify the exact repository and PR from the request or current review.
   Ask if the destination, selected findings, or intended account is ambiguous.
2. Read applicable project instructions and verify the approved `gh` identity
   and access. Do not switch accounts, initiate login, or change credentials to
   overcome an access error without authorization.
3. Distinguish publishing new findings, replying to an existing thread, and
   editing a specific existing comment. Edit or delete only comments the user
   authorized; do not replace earlier feedback merely to avoid a new review.
4. Default to a `COMMENT` review with inline comments. `APPROVE` and
   `REQUEST_CHANGES` require explicit authorization for that event; a finding's
   priority or a chat recommendation doesn't grant it. Never self-approve.
5. Draft/preview-only requests publish nothing. Otherwise an explicit request to
   post the reviewed findings is sufficient; don't add an unnecessary second
   confirmation. Still respect native host approvals and repository policy.

Do not edit source, commit or push fixes, resolve threads, change draft state,
enable auto-merge, schedule a sweep, or merge as a side effect of posting.

## 2. Refresh the review context

Fetch the current PR metadata, complete changed-file list and diff, reviews and
inline comments. Paginate collections, including comments nested under a review.

```text
gh api repos/<owner>/<repo>/pulls/<number>
gh api --paginate --slurp repos/<owner>/<repo>/pulls/<number>/files
gh pr diff <number> --repo <owner>/<repo>
gh api --paginate --slurp repos/<owner>/<repo>/pulls/<number>/reviews
gh api --paginate --slurp repos/<owner>/<repo>/pulls/<number>/comments
```

Record the reviewed and current head/base SHAs and the PR's actual base branch.
Do not substitute the default branch. For new review comments, confirm the PR is
open and unmerged; a closed/merged PR requires an explicit follow-up request.

If either revision moved, inspect the affected changes and revalidate each
finding before publishing. Drop already-fixed findings and recompute anchors.
Do not just change `commit_id` or shift line numbers to make a stale review fit.
If complete evidence is unavailable, stop the affected comments and report the
gap instead of treating a missing/truncated patch as an absent change.

Inspect pending reviews too. Never submit an unrelated pending review, its draft
comments, or someone else's findings as part of this batch.

## 3. Map each finding to an inline location

- Use the exact PR file path, including the current API path for a rename; check
  `previous_filename` and the actual patch before mapping old content.
- Use `side: "RIGHT"` and new-file line numbers for additions or current content.
  Use `side: "LEFT"` and old-file line numbers for deleted content.
- Use the diff hunk headers and actual content, not Markdown display numbers,
  a patch-array index, or the legacy `position` field. In a hunk, context advances
  both old/new counters, `-` advances only old, and `+` advances only new;
  headers and `\ No newline at end of file` are not source lines.
- Choose the smallest range that shows the cause. For a multiline comment, set
  `start_line`/`start_side` as well as ending `line`/`side`, using a supported
  contiguous range on the same side.
- Anchor a concern about untouched content to a causally relevant changed line
  only when the change creates the inconsistency. Explain the untouched location
  with a commit-pinned link; never attach a finding to unrelated code merely
  because GitHub accepts that line.
- For a binary, deleted file, unrepresented hunk, or genuinely cross-cutting
  concern with no valid inline anchor, use an appropriate supported file-level
  comment or one concise review-body exception. Make that limitation explicit.
  Never invent a line or silently downgrade all findings to a summary.

Keep stable finding IDs and priorities from the reviewed results. Each comment
needs a short title, the triggering condition, concrete impact, evidence, and
the smallest corrective direction. Label suggestions, open decisions and release
dependencies separately from confirmed defects. Do not inflate severity or add
unreviewed claims. Preserve uncertainty and material verification limits.

One finding gets one thread, not repeated comments at every affected call site.
Include a suggested patch only when it is correct, complete and valid for that
exact range; posting a suggestion doesn't authorize applying it.

## 4. Deduplicate and publish

1. Compare existing published and pending feedback by PR, author, finding ID or
   meaning, path/range, reviewed commit and body. Exact and equivalent findings
   shouldn't become duplicate threads. When an existing concern is already
   present, report its URL; reply or update it only when that action is authorized.
2. Recheck the PR head/base immediately before writing. If they moved, return to
   context verification. A server rejection isn't permission to post to another
   line, another revision, or the PR conversation instead.
3. Prefer one review submission containing all new inline comments. Its body can
   identify the reviewed revision, automated assistance and material limitations,
   but shouldn't repeat every finding. Follow an explicit summary-only request
   instead of imposing inline publication.
4. Pass bodies and JSON as data, not shell interpolation or executable code.
   Submit the exact reviewed head as `commit_id` and the authorized event.

A single-line payload has this shape; replace every placeholder with verified
values before submitting:

```json
{
  "commit_id": "<reviewed-head-sha>",
  "event": "COMMENT",
  "body": "Automated review of <reviewed-head-sha>; findings are inline.",
  "comments": [
    {
      "path": "src/example.ts",
      "line": 42,
      "side": "RIGHT",
      "body": "**F1 - P2: Short title.** Trigger, impact, evidence, and correction."
    }
  ]
}
```

```text
gh api --method POST repos/<owner>/<repo>/pulls/<number>/reviews --input <payload-file>
```

Use the host's supported tool to create the payload. Use native filesystem path
separators for the local payload file; GitHub repository `path` fields and API
endpoints always use `/`, including on Windows. On PowerShell quote entire
`--flag=value` tokens. Do not use a summary-only `gh pr comment` command to
approximate line comments.

For an explicitly authorized reply, use the existing review comment's reply
endpoint rather than starting a duplicate thread:

```text
gh api --method POST repos/<owner>/<repo>/pulls/<number>/comments/<comment-id>/replies --input <reply-payload-file>
```

The reply payload contains `body`. An authorized edit uses `PATCH` on
`repos/<owner>/<repo>/pulls/comments/<comment-id>` with the intended body.
Do not silently edit or resolve another reviewer's comment.

## 5. Verify delivery

Read the created review and every created comment back from GitHub. Verify the
repository/PR, author, published review state, exact commit, paths, line ranges,
sides and bodies. A pending review isn't delivered feedback.

```text
gh api repos/<owner>/<repo>/pulls/<number>/reviews/<review-id>
gh api --paginate --slurp repos/<owner>/<repo>/pulls/<number>/reviews/<review-id>/comments
```

For a timeout, connection loss, or ambiguous write result, query reviews and
comments for the intended content before retrying. Reconcile partial delivery
and post only missing findings; never blindly repeat a batch. Preserve any
unrelated existing pending review.

Return the canonical review URL and inline thread URLs, the number actually
posted, skipped duplicates and any unposted findings or material limitations.
Do not report all comments delivered if any remain pending, rejected or unknown.
Do not resolve threads after posting.

## Acceptance checks

- Authorized findings appear at their specific relevant diff locations, not only
  in a summary or conversation comment.
- Added, removed, renamed and multiline locations use verified paths and sides.
- Head/base movement triggers revalidation; fixed or stale findings aren't posted.
- Equivalent feedback and uncertain writes don't produce duplicate threads.
- `COMMENT` remains the default; approval, request-changes and resolution aren't
  inferred from a request to post comments.
- Delivery is read back and linked; partial or blocked publication stays visible.
