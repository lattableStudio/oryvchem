---
name: seo-sprint
description: Plan, start or close an Oryvchem SEO sprint — pick the next sprint from docs/seo/ROADMAP.md, break it into verified tasks on a feature branch, enforce approval gates, and update SPRINT_STATUS/TASKS/DECISION_LOG. Use when asked to "continue the SEO work", "next sprint" or for a status report.
---
# seo-sprint

1. Read `docs/seo/ROADMAP.md`, `SPRINT_STATUS.md` and `TASKS.md`. Pick the first sprint whose dependencies are met. Skip blocked ones and say why.
2. Create a branch `seo/sprint-<n>-<slug>` from an up-to-date `main`. Never commit SEO work to `main` directly.
3. For each task, either do it (code + check) or mark it as NEEDS APPROVAL with the exact change and command. The approval list is in `.claude/agents/seo-architect.md`. Delegate to the matching SEO agent when the task is specialised.
4. Gate each task with the `seo-check` skill (local mode), plus `npm run typecheck`. After 3 failed attempts on the same root cause, record the blocker in `SPRINT_STATUS.md` and move on.
5. Close the sprint by updating `SPRINT_STATUS.md` (evidence: command output summaries) and `TASKS.md`, adding decisions to `DECISION_LOG.md`, lessons to `KNOWLEDGE_BASE.md` and hypotheses to `EXPERIMENTS.md`.
6. Commit, and open a PR only if the user has authorised pushing. Report COMPLETED / IN PROGRESS / BLOCKED / NEEDS APPROVAL / NEXT with file paths.
