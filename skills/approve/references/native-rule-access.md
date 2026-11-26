# Native rule inspection capability

Rules inspection must not accidentally make a free private repository require
a paid plan. Availability is different from authorization and merge permission.

Run the [checked reader](../scripts/native-rule-access.mjs) against the actual
GitHub host, repository and PR base branch:

```text
node <toolkit>\skills\approve\scripts\native-rule-access.mjs github.com owner/repo main
```

It performs only `gh api` GETs. It verifies the authenticated identity before and
after the reads, canonical repository and write access, and captures the actual
branch-protection and effective-rule HTTP responses. It never switches accounts,
changes settings/rules, approves, readies, merges or grants permissions.

- **Inspection required:** inspect the returned available rule data normally.
- **Native enforcement only:** both reads are authoritative unprotected or the
  exact GitHub.com private-repository plan-capability response, with verified
  identity/write access. A trusted base policy must explicitly permit this route.
  Record unavailable capability, not absent rules. Preserve source validation,
  independent review, policy seats, visible checks/discussions, readiness and
  explicit merge authority; submit only the normal expected-head-bound operation.
  GitHub remains authoritative for native requirements and rejects unmet gates.
- **Blocked:** authentication/authorization failure, other 403, ambiguous 404,
  unknown host entitlement, missing access/identity, or malformed/incomplete data.

The helper's classification is not `APPROVE`, a merge verdict, a human approval
or policy adoption. Never manufacture a successful read or replay a denied
operation through another identity. New head/base/policy requires fresh affected
evidence; the head cannot authorize its own gate relaxation. A required queue
still takes precedence, and a native rejection never authorizes bypass/retry.
