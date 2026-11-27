<p align="center">
  <img src="assets/workloom-logo.svg" alt="Workloom" width="320">
</p>

Workloom weaves focused skills into workflows for building, reviewing, researching,
and writing with **GitHub Copilot CLI**, **Claude Code**, and **Codex**.

## Skills

| Skill | What it does |
|---|---|
| [init-toolkit](skills/init-toolkit/SKILL.md) | Initialize a workspace with skill routing. |
| [setup-repo](skills/setup-repo/SKILL.md) | Set up a repository and sibling worktrees. |
| [new-issue](skills/new-issue/SKILL.md) | Research, draft, or create an issue. |
| [new-epic](skills/new-epic/SKILL.md) | Break an outcome into a scoped epic. |
| [new-spec](skills/new-spec/SKILL.md) | Write a project-native specification. |
| [new-adr](skills/new-adr/SKILL.md) | Record an architectural decision and its tradeoffs. |
| [investigate](skills/investigate/SKILL.md) | Trace a failure and establish its root cause. |
| [test-plan](skills/test-plan/SKILL.md) | Plan focused, risk-based verification. |
| [implement](skills/implement/SKILL.md) | Deliver a change through validation and a draft PR. |
| [factory](skills/factory/SKILL.md) | Orchestrate issue-to-PR delivery. |
| [pr](skills/pr/SKILL.md) | Assess readiness, publish, or explicitly mark a PR ready. |
| [review](skills/review/SKILL.md) | Review code, contracts, and follow-up fixes. |
| [prove](skills/prove/SKILL.md) | Demonstrate acceptance with real experience evidence and PR-hosted proof. |
| [triage](skills/triage/SKILL.md) | Prioritize work and assess review feedback. |
| [post-pr-comments](skills/post-pr-comments/SKILL.md) | Publish reviewed findings at their PR diff lines. |
| [address-pr-feedback](skills/address-pr-feedback/SKILL.md) | Fix feedback and conflicts, then reply with evidence. |
| [watch](skills/watch/SKILL.md) | Keep a PR's feedback, conflicts, and CI moving. |
| [approve](skills/approve/SKILL.md) | Approve eligible PRs under repository policy. |
| [merge](skills/merge/SKILL.md) | Merge when risk, confidence, and repository rules permit. |
| [ship](skills/ship/SKILL.md) | Coordinate publication, review, fixes, proof, and approval. |
| [paper](skills/paper/SKILL.md) | Create interactive HTML papers with an integrated light review. |
| [research-brief](skills/research-brief/SKILL.md) | Produce source-grounded research for a decision. |

## Install

| Host | Register the marketplace | Install Workloom |
|---|---|---|
| GitHub Copilot CLI | `copilot plugin marketplace add sebastienlevert/skills` | `copilot plugin install workloom@skills` |
| Claude Code | `claude plugin marketplace add sebastienlevert/skills` | `claude plugin install workloom@skills` |
| Codex | `codex plugin marketplace add sebastienlevert/skills` | `codex plugin add workloom@skills` |

Restart your session after installing.
