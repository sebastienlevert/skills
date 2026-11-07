# GitHub thread mechanics

Use `gh` against the verified host/repository. Pass query variables and comment
text as JSON data, not interpolated executable shell/query syntax. On PowerShell,
quote the entire `--flag=value` token. Never use a GitHub MCP server.

## Read the native thread, not just a review summary

For a known PR, query the current revision and thread connection:

```graphql
query Feedback($owner: String!, $repo: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      headRefOid
      reviewThreads(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id isResolved isOutdated viewerCanResolve path line
          comments(first: 100) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id url body createdAt
              author { login }
              commit { oid }
              replyTo { id }
            }
          }
        }
      }
    }
  }
}
```

Follow outer cursors until the requested scope is complete. A thread's comments
have their own cursor; use `node(id: $threadId)` with an
`... on PullRequestReviewThread` fragment and `comments(first: 100, after: $after)`
to continue that connection. A failed page is not an empty or resolved thread.

Use the actual GraphQL thread ID for replying and resolving. Do not confuse it
with a PR number, REST numeric comment ID, review ID, URL anchor, or client
mutation ID. Source URLs identify the requested scope; verify their association
with the PR before acting.

Do not depend on a deprecated numeric comment field to identify a thread. The
GraphQL reply operation below uses the thread's native `id` directly. On hosts
without these schema capabilities, report the limitation; do not guess an endpoint
or claim Markdown text resolved a native conversation.

## Reply after verifying pushed fixes

```graphql
mutation Reply($thread: ID!, $body: String!) {
  addPullRequestReviewThreadReply(
    input: { pullRequestReviewThreadId: $thread, body: $body }
  ) {
    comment { id url body }
  }
}
```

Submit through `gh api graphql --input -` with a JSON object containing `query`
and `variables`. Verify the response and re-read the thread to confirm the reply.
A successful transport alone is not proof the intended comment exists.

If delivery is uncertain, find the reply by thread, author, body and fix-commit
reference before retrying. `clientMutationId` is a correlation value, not a
server-guaranteed deduplication key.

For an ordinary issue-comment/review-body concern, use the actual supported PR
conversation operation and link the original source. Don't substitute a generic
PR comment for an inline reply just because it is easier. Conversation comments
and whole review bodies do not have `resolveReviewThread` state.

## Resolve only after the evidence reply

Re-read the current head, full thread discussion, `isResolved`, and
`viewerCanResolve`. Reconcile new feedback before closing the thread.

```graphql
mutation Resolve($thread: ID!) {
  resolveReviewThread(input: { threadId: $thread }) {
    thread { id isResolved }
  }
}
```

Fetch the thread again and verify its state. If it was already resolved, report
that fact instead of writing needlessly. A failed resolution after a successful
reply is a partial outcome: retry only the unresolved operation when authorized.

There is no atomic guarantee that another contributor cannot post immediately
after a read. Check immediately before writing, verify afterward, and surface any
new unaddressed concern. Do not treat resolution as reviewer approval or a merge
permission.
