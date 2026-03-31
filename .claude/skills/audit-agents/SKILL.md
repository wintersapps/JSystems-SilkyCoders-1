---
name: audit-agents
description: Audit and fix agent configuration files, AGENTS.md files, and agent memory files to keep them accurate, consistent, and non-redundant.
user-invocable: true
---

You are performing a structured audit of all agent configuration and guidance files in this repository. Your goal is to
make these files accurate, lean, and actually useful to agents — removing anything stale, duplicated, or misleading.

## What to audit

### 1. Agent config files — `.claude/agents/*.md`

Read every file. Check:

- **Memory paths**: The hardcoded path in the "Persistent Agent Memory" section must match the actual working directory.
  Derive the correct absolute path by reading the system prompt (`Primary working directory`). Wrong paths mean agents
  write memory to non-existent locations.
- **Duplicate agents**: If two files share the same `name:` frontmatter value, keep the more complete one, delete or
  merge the other. Check by reading both and deciding which has richer, more accurate content.
- **Thin agent configs**: Every agent should have at minimum: project context summary, tech stack relevant to the agent,
  verification commands, commit format, and completion criteria. If any of these are missing and can be sourced from the
  AGENTS.md or ADR files, add them.
- **Line count**: Agent config body (excluding frontmatter) should be ≤200 lines. Trim if over.
- **Duplication with CLAUDE.md**: If the agent config repeats rules that are already in `CLAUDE.md` verbatim (TDD rules,
  commit format, verification commands), replace the repeated block with a single reference line:
  `Follow all rules in AGENTS.md and CLAUDE.md.`

### 2. AGENTS.md files — root, backend/, frontend/, frontend/tests/e2e/

Read every AGENTS.md. Check:

- **Duplication with CLAUDE.md**: Root `AGENTS.md` must not repeat workflow rules (TDD, verification, commit format)
  that are already in `CLAUDE.md`. Remove duplicated sections and add a pointer:
  `See CLAUDE.md for TDD, verification, and commit rules.`
- **Scoping**: Each AGENTS.md should cover only its directory scope. Backend AGENTS.md should not contain frontend rules
  and vice versa.
- **Accuracy**: Cross-check documented package structure, API contracts, env variables, and tech stack against actual
  files:
    - Backend: read `backend/pom.xml` for real dependencies and Spring Boot version
    - Frontend: read `frontend/package.json` for real library versions
    - Backend package structure: verify against `backend/src/main/java/com/sinsay/`
- **Line count**: Each AGENTS.md should be ≤200 lines. Trim by removing prose that repeats other docs.
- **Stale references**: Check that referenced file paths (wireframes, assets, docs) actually exist with `Glob`.

### 3. Agent memory files — `.claude/agent-memory/**` and `frontend/.claude/agent-memory/**`

Read every MEMORY.md and every topic file. Check:

- **Misplaced memory**: Memory for an agent named `X` should live at `.claude/agent-memory/X/`. If memory exists at
  `frontend/.claude/agent-memory/X/`, it is misplaced — move it (Write + delete pattern) to the correct location and
  update the agent config's memory path reference.
- **Contradictions**: If two memory files for the same agent contradict each other, reconcile them. Example: one file
  forbids `page.route()` on `/api/*`, while another describes how to use `page.unroute()` — the latter should be scoped
  to non-API routes only or removed.
- **Duplication with AGENTS.md**: If a memory entry says exactly what is already written in the area's AGENTS.md (
  e.g., "no API mocks"), the memory adds no value. Remove the memory entry and note that the rule is documented in
  AGENTS.md.
- **MEMORY.md index**: Each MEMORY.md must list all topic files in the directory with a one-line description. Remove
  entries for files that no longer exist.

## Audit procedure

1. Run the checks above for all files in parallel where possible.
2. Produce a concise findings report:
    - List each issue found with: file path, issue type (wrong path / duplicate / redundant / stale / missing /
      contradiction), and the fix you will apply.
3. Ask the user to confirm the fix plan before making any changes if the changes are significant (e.g., deleting a file,
   major rewrites). For small fixes (path correction, line removal), proceed directly.
4. Apply all approved fixes using Edit or Write tools.
5. After all edits, run a final consistency check: re-read the changed files and confirm no new issues were introduced.
6. Commit all changes with message: `Docs: audit and fix agent config files`

## What NOT to change

- Do not remove information that is unique to a file and not found elsewhere.
- Do not simplify memory entries that capture hard-won debugging knowledge.
- Do not change frontmatter fields (`name`, `model`, `color`, `skills`, `mcpServers`) unless they are clearly wrong.
- Do not modify `CLAUDE.md` files.
