# finals-core

## Stack
Node 22.12+, ESM with TypeScript declarations (`src/*.d.ts`), Node's built-in test runner. Pure functions (ladder, rankings, team builder): no storage, HTTP or chat code, zero runtime dependencies. Part of canccuplatform — see `../CLAUDE.md` for the platform map, hosts and contracts.

## Commands
npm test

## Release
No deploy. Released only by tag through the manual release workflow (#1); once it exists, never tag or push tags by hand. Consumers pin a release tag (thefinals_mini_tourney: `"finals-core": "github:glyzer/finals-core#vX.Y.Z"`). Changing an export's behavior or signature is a breaking change for consumers — say so first.

## Rules
- Before reporting done: `npm test`. Fix failures yourself.

- Branch `issue-<n>-<slug>`; n is the number immediately after "issue-" in the branch name. Work only on that issue.
- If the issue can't be done as written or the scope must grow: stop, say so, and offer to create the new issue (in this repo, or in the platform repo with `-R glyzer/canccuplatform` if it's cross-repo or a contract). Never edit the current issue.
- Docs (README.md, `.d.ts` files) change in the same PR as the behavior or API they describe.
- No new dependencies without saying so first (runtime dependencies stay at zero). Small diffs. No refactors outside scope.
- Plans → docs/plans/, handoffs → docs/handoffs/. Commit them. Never put plans in issue or PR comments.
- Don't touch: `.env*`, secrets of any kind.

## Commands I type
- issues    run `gh issue list -l ready` and `gh issue list -l in-progress`; then `gh issue list -l idea`, shown under "Ideas" (the pool groom promotes from). Nothing else.
- <number>  claim: `gh issue develop <n> --checkout --name issue-<n>-<slug>` (<slug> is derived from the issue title: lowercase, hyphens, max ~4 words); `gh issue edit <n> --add-label in-progress --remove-label ready`; show the issue; propose a tier with a one-line reason and wait.
            fix = implement, verify, report · feature = short plan in chat, wait for OK, implement · plan = write docs/plans/issue-<n>.md and stop.
- resume    checkout the in-progress branch, read the newest docs/handoffs/ file, continue from "next action".
- execute   run docs/plans/issue-<n>.md for this branch step by step, verifying each.
- finish    delete docs/handoffs/issue-<n>-*.md; run `npm test`; then re-read the issue's acceptance criteria against the work — if any is unmet, stop without committing and list the unmet ones; stage; conventional commit; push; `gh pr create --title "<subject>" --body "Closes #<n>"`; then `gh pr checks --watch`. If it reports no checks, wait 30 seconds and run it again — CI hasn't registered yet; "no checks" is never green (until this repo has a PR workflow, report that no CI is configured and treat the local `npm test` as the gate). If CI fails: `gh run view <id> --log-failed`, fix, commit, push, watch again — at most two rounds, then stop and show me. When green: print PR URL + file-by-file diff summary, ending with `Verification run: <what was executed> — <result>` (or `Verification run: none — <reason>`). Do NOT merge.
- ship      confirm `gh pr checks` is green (if not, say so and stop); `gh pr merge --squash --delete-branch`; checkout main and pull. Remove the `in-progress` label from the issue. If this issue has a parent issue: label its next unblocked child `ready`; close the parent if all children are closed. Shipping does not release: a release is only the manual release workflow.
- pause     run /handoff, save to docs/handoffs/issue-<n>-<date>.md, commit "handoff #<n>", push.

## Output
No preamble, no narration. Report as: files changed (one line each), commands run, what's left. Every final report ends with `Verification run: <what was executed> — <result>`, or `Verification run: none — <reason>`. Reasoning only for non-obvious decisions. No subagents unless isolation is needed.

## Conventions
- Labels: ready, in-progress, epic, blocked, idea.
- Conventional commits. Conventions, hosts and contracts: `../CLAUDE.md`.
