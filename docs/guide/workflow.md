# Workflow

Understand the complete SDD Tool workflow.

The steps below are skills: type `/sdd-spec` in Claude Code, `$sdd-spec` in Codex (same names, same behavior).
`sdd ...` lines are CLI commands you can also run in a terminal.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SDD Workflow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd-start        → Start workflow                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd-constitution → Define project principles           │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd-spec         → Write/modify feature spec (spec.md) │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd-plan         → Create implementation plan (plan.md)│
│     │                                                       │
│     ▼                                                       │
│  5. /sdd-tasks        → Task breakdown (tasks.md)           │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd-prepare      → Check subagents/skills              │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd-implement    → Sequential implementation           │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd-validate     → Spec validation                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step Details

### 1. /sdd-start

Checks the project setup and guides the next action.

- Checks `.sdd/`, the Git repository and hooks, the CI workflow and whether source code exists
- Runs a setup wizard first for anything missing (`sdd init`, `sdd git hooks install`, `sdd cicd setup github`)
- Only then recommends the next skill: `/sdd-spec` for a new (greenfield) project, `/sdd-reverse` for existing code
  without specs (brownfield), `/sdd-status` or `/sdd-implement` when specs already exist

### 2. /sdd-constitution

Defines the core principles of your project.

- Core Principles
- Technical Principles
- Forbidden

### 3. /sdd-spec

Write or modify feature specs with AI assistance.

- Automatically detects new feature vs existing spec modification
- Runs `sdd new <domain>/<feature> --all`: creates a missing domain (`common` if none given), switches to a
  `feature/<id>` branch (unless `--no-branch`) and writes spec.md, plan.md, tasks.md and checklist.md.
  Existing files are never overwritten without `--force`
- Requirements are `### REQ-01: Title` headings, unique within the spec
- Uses RFC 2119 keywords
- GIVEN-WHEN-THEN scenarios
- Dependencies on other specs go in the frontmatter `depends: [<domain>/<feature>]` (`[]` for none)

### 4. /sdd-plan

Create an implementation plan (edits the plan.md that `--all` already created).

- Technical decisions and rationale
- Implementation phases definition
- Risk analysis

### 5. /sdd-tasks

Break down work into executable units (edits the tasks.md that `--all` already created).

- Each task is `### <feature>-task-001: Title` followed by `**상태:**` (status), `**우선순위:**`, `**설명:**`, `**의존성:**`
  (English `**Status:**` / `**Priority:**` / `**Description:**` / `**Dependencies:**` labels are read too)
- 2-4 hour completion size
- Task dependencies indicated (`없음` / `none` for no dependencies)
- Priority settings
- Tasks are test-first: write the failing test before the implementation

### 6. /sdd-prepare

Check required implementation tools.

- Verify subagents
- Verify skills
- Auto-generate missing tools

### 7. /sdd-implement

Test-first sequential implementation.

1. Change task status to "in progress": `sdd new task <feature> <task-id> in-progress`
2. Write a failing test, referencing the requirement as `@spec <domain>/<feature>#REQ-01`
3. Implement code until the test passes
4. Change task status to "complete": `sdd new task <feature> <task-id> completed`

`<feature>` is `<domain>/<feature>` or a unique feature name. Task status values are `pending`, `in-progress`,
`completed`, `blocked` (or `대기`, `진행 중`, `완료`, `차단됨`); every run also recomputes the progress block and the
`completed:` / `total:` fields of tasks.md. `sdd new status <feature> <status>` sets the spec status
(`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`).

### 8. /sdd-validate

Perform spec validation.

- RFC 2119 keyword usage
- GIVEN-WHEN-THEN format compliance
- Metadata required fields check

Then close the loop from the terminal:

```bash
sdd validate
sdd sync                              # every REQ-xx defined by a heading should be referenced by code or a test
sdd new status <feature> implemented  # `sdd status` suggests this once all tasks are completed
```

## Change Management Workflow

When modifying existing features:

```
/sdd-spec     → Modify spec (auto-detects existing spec; large changes become a change proposal:
                sdd change -t "<title>" -s <spec>, repeat -s for several specs)
    ↓
/sdd-impact   → Impact analysis (sdd impact <spec>)
    ↓
edit specs and implement following .sdd/changes/<id>/delta.md
    ↓
sdd change apply <id>      → mark the proposal as applied (specs are not rewritten automatically)
    ↓
sdd change archive <id>
```

## File Structure

```
.sdd/
├── constitution.md     # Project constitution
├── domains.yml         # Domains (created on demand)
├── specs/              # Feature specs
│   └── <domain>/<feature>/
│       ├── spec.md      # Specification
│       ├── plan.md      # Implementation plan
│       ├── tasks.md     # Task breakdown
│       └── checklist.md # Workflow checklist
├── changes/            # Change proposals (proposal.md, delta.md)
└── archive/            # Completed changes
```
