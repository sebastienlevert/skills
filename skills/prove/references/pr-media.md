# Publish actual proof media

Use the host's `github-pr-media` skill when available. This portable recipe uses
GitHub CLI, not a new upload service or committed screenshot directory.

## Capture first

Inspect actual scenario captures and verify their candidate/build provenance.
Choose the few images or recordings that establish acceptance. Keep filenames
as quoted data, not interpolated executable text; use native local path separators.
Never upload credentials, private data, mockups presented as observed results
or unrelated files.

## Attach and comment

Check `gh pr comment --help` for `--attach` on the actual host/authentication.
This feature is available in gh 2.99.0 and later; use numeric version comparison
or the advertised flag, not lexical string comparison.

Pass the body and selected images as data:

```text
gh pr comment <number> --repo <owner/repo> --body-file <proof-body-path> --attach "<screenshot-path>#Observed result and useful alt text"
```

Repeat `--attach` for additional selected media. Let the command append hosted
images; the comment body need not contain any local media reference.
For a video, omit the `#` alt suffix and any image-Markdown reference:

```text
gh pr comment <number> --repo <owner/repo> --body-file <proof-body-path> --attach "<recording-path>"
```

GitHub renders a video player when its hosted URL stands alone in a paragraph.
Use meaningful scenario captions in the body. The body file and captures remain
session artifacts; only the uploaded asset URLs belong in the final comment.

## Verify, including failures

Preserve the command's exit status, diagnostics and printed comment URL. Read
back that exact comment via the PR's paginated issue-comment API, not simply the
newest comment. Verify all intended assets, candidate, observed-result summary
and absence of local paths. Do not infer complete publication from a created
comment when an attachment failed.

Partial uploads may create a comment even when the command fails. Reconcile it
before retrying; identify failed files from retained diagnostics and retry only
those. A linked follow-up proof comment may complete missing media without
duplicating successful uploads; record all receipts and the final evidence set.
Do not blindly repost the whole attachment batch or edit someone else's comment.

Unsupported `--attach`, GitHub Enterprise Server media support or authentication
is not permission to switch identities, extract tokens or use an unrelated public
host. Use an already-authorized, reviewer-accessible hosted artifact when one
exists, or report blocked publication and the specific missing capability.
Preview/local capture is not delivered PR proof. Never test this recipe with
dummy uploads or live posts merely to validate the skill.
