# SDD Tool

**Spec-Driven Development CLI** - AI-Powered Specification Workflow

[![npm version](https://img.shields.io/npm/v/sdd-tool)](https://www.npmjs.com/package/sdd-tool)
[![CI](https://github.com/JakeB-5/sdd-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/JakeB-5/sdd-tool/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> 🇰🇷 **[한국어 문서 (Korean)](README.ko.md)**

📚 **[Documentation](https://jakeb-5.github.io/sdd-tool/)** | 🚀 **[Getting Started](https://jakeb-5.github.io/sdd-tool/guide/getting-started)** | 📋 **[CLI Reference](https://jakeb-5.github.io/sdd-tool/cli/)**

## Overview

SDD Tool is a command-line interface designed to work with **Claude Code** and **OpenAI Codex** for implementing Spec-Driven Development (SDD) methodology. Through **SDD skills** (invoked as `/sdd-*` in Claude Code or `$sdd-*` in Codex), you collaborate with AI to write specs and implement features.

### Core Concepts

- **Specifications First**: Write specifications before writing code
- **AI Collaboration**: Automate workflow through Claude Code skills
- **RFC 2119 Keywords**: Use SHALL, MUST, SHOULD, MAY to clarify requirements
- **GIVEN-WHEN-THEN Scenarios**: Define requirements using scenario-based approach
- **Constitution**: Define core principles of your project

---

## Installation

```bash
npm install -g sdd-tool
```

Verify installation:

```bash
sdd --version
```

---

## Quick Start

```bash
# 1. Initialize your project (Claude Code + Codex skills, subagents, AGENTS.md block, CLAUDE.md import, Git/CI-CD setup)
sdd init

# 2. Start Claude Code (or Codex: `codex`)
claude

# 3. Begin workflow with the start skill (Codex: $sdd-start)
/sdd-start
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   SDD Skill Workflow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd-start        → Start workflow                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd-constitution → Define project principles           │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd-spec         → Write/edit spec (spec.md)           │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd-plan         → Create implementation plan          │
│     │                                                       │
│     ▼                                                       │
│  5. /sdd-tasks        → Break down into tasks              │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd-prepare      → Verify sub-agents/skills           │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd-implement    → Sequential implementation          │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd-validate     → Validate specifications            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The CLI commands each step runs behind the scenes (you can also run them yourself):

| Step | Skill | CLI commands used |
|------|-------|-------------------|
| 1 | `/sdd-start` | `sdd status` |
| 2 | `/sdd-constitution` | edits `.sdd/constitution.md` |
| 3 | `/sdd-spec` | `sdd new <domain>/<feature> --all` (spec.md, plan.md, tasks.md, checklist.md), `sdd validate` |
| 4 | `/sdd-plan` | edits the generated `plan.md`; optionally `sdd new status <feature> planned` |
| 5 | `/sdd-tasks` | edits the generated `tasks.md`; optionally `sdd new status <feature> tasked` |
| 6 | `/sdd-prepare` | `sdd prepare <feature>` |
| 7 | `/sdd-implement` | `sdd new task <feature> <task-id> in-progress\|completed` for every task, `sdd status`; after the last task `sdd validate`, `sdd sync <feature>`, then `sdd new status <feature> implemented` |
| 8 | `/sdd-validate` | `sdd validate` (and `sdd sync` for implemented features) |

`<feature>` is `<domain>/<feature>` (e.g. `pricing/cart`) or a unique feature name (e.g. `cart`). In Codex, use `$sdd-*` instead of `/sdd-*`.

---

## Skills (Slash Commands)

`sdd init` generates 30 Claude Code skills in `.claude/skills/sdd-*/SKILL.md`. Claude Code exposes each skill as a slash command, so you invoke them as `/sdd-start`, `/sdd-spec`, etc. (kebab-case).

> `.claude/commands/` is not generated by default, because Claude Code merges commands into skills. To additionally write the legacy Korean dot-notation commands (`.claude/commands/sdd.*.md`), use `sdd init --legacy-commands`. Use `--no-skills` to skip skill generation (Claude Code and Codex).

### Codex Support

Every `sdd init` also generates OpenAI Codex files from the same definitions — no extra flag:

| Output | Purpose |
|--------|---------|
| `.agents/skills/sdd-*/SKILL.md` | The same 30 skills (frontmatter `name` + `description`; skill references written as `$sdd-x`) |
| `.agents/skills/<name>/agents/openai.yaml` | For manual-only skills (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`): `policy.allow_implicit_invocation: false` |
| `.codex/agents/sdd-*.toml` | Subagents (see below) |
| `AGENTS.md` (project root) | SDD guide inside a `<!-- sdd:begin -->` … `<!-- sdd:end -->` block; content outside the block is never touched |

In Codex, invoke a skill explicitly with `$sdd-spec auth/login` (or pick it from `/skills`); Codex also picks skills implicitly from their descriptions.

### Subagents

`sdd init` writes three subagents for both tools (`.claude/agents/<name>.md` and `.codex/agents/<name>.toml`):

| Subagent | Role |
|----------|------|
| `sdd-spec-reviewer` | Read-only spec review: RFC 2119, GIVEN-WHEN-THEN, constitution; runs `sdd validate` / `sdd quality` |
| `sdd-implementer` | Implements `tasks.md` items test-first and keeps changes scoped to the spec |
| `sdd-impact-analyst` | Read-only impact analysis with `sdd impact` before changing a spec |

Delegate by name, e.g. "Have sdd-spec-reviewer review the auth/login spec".

### Skill Frontmatter

Skills are authored in English for model-routing accuracy and use these frontmatter fields:

| Field | Applied to |
|-------|-----------|
| `context: fork` | 6 analysis skills (`sdd-analyze`, `sdd-impact`, `sdd-report`, `sdd-research`, `sdd-search`, `sdd-sync`) |
| `disable-model-invocation: true` | 5 utility skills (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`) |
| `argument-hint` | Skills that take arguments |
| `allowed-tools` | All skills — least-privilege patterns (e.g., `Bash(sdd validate*)`) |

### Core Workflow

| Command | Description | Example |
|---------|-------------|---------|
| `/sdd-start` | Unified entry point | `/sdd-start` |
| `/sdd-constitution` | Project principles | `/sdd-constitution React-based todo app` |
| `/sdd-spec` | **Write/edit spec (unified)** | `/sdd-spec user authentication` |
| `/sdd-plan` | Implementation planning | `/sdd-plan` |
| `/sdd-tasks` | Break down into tasks | `/sdd-tasks` |
| `/sdd-prepare` | Verify sub-agents/skills | `/sdd-prepare` |
| `/sdd-implement` | Sequential implementation | `/sdd-implement` |
| `/sdd-validate` | Spec validation | `/sdd-validate` |

> **Note**: `/sdd-spec` creates a new spec or modifies an existing one. Large modifications go through a change proposal under `.sdd/changes/CHG-xxx/{proposal,delta,tasks}.md`, applied with `sdd change apply <id>` and archived with `sdd change archive <id>`.

### Change Management

| Command | Description |
|---------|-------------|
| `/sdd-impact` | Analyze change impact |
| `/sdd-transition` | Switch between new ↔ change workflows |

> **Removed**: `/sdd-new` and `/sdd-change` no longer exist. Use `/sdd-spec` instead.

### Analysis & Quality

| Command | Description |
|---------|-------------|
| `/sdd-analyze` | Analyze requests and estimate scope |
| `/sdd-quality` | Calculate spec quality score |
| `/sdd-report` | Generate project report |
| `/sdd-search` | Search specs |
| `/sdd-status` | Check project status |
| `/sdd-list` | View items list |
| `/sdd-sync` | Verify spec-code synchronization |
| `/sdd-diff` | Visualize spec changes |
| `/sdd-export` | Export specs (HTML, JSON) |

### Documentation Generation

| Command | Description |
|---------|-------------|
| `/sdd-research` | Technical research document |
| `/sdd-data-model` | Data model documentation |
| `/sdd-guide` | Workflow guide |

### Operations

| Command | Description |
|---------|-------------|
| `/sdd-chat` | Interactive SDD assistant |
| `/sdd-watch` | File watch mode |
| `/sdd-migrate` | Migration from external tools |
| `/sdd-cicd` | CI/CD configuration |
| `/sdd-prompt` | Output prompt |

---

## Detailed Workflow Steps

### Step 1: /sdd-start

Entry point that analyzes project status and guides next actions:

```
/sdd-start
```

- **New project**: Recommends writing Constitution
- **Existing project**: Shows workflow menu

### Step 2: /sdd-constitution

Define your project's core principles:

```
/sdd-constitution React-based todo management app
```

AI analyzes `.sdd/constitution.md` and guides you through:
- Core Principles
- Technical Principles
- Forbidden Practices

### Step 3: /sdd-spec

Write feature specifications with AI:

```
/sdd-spec user authentication
```

For a new feature the skill runs `sdd new <domain>/<feature> --all` and then guides you through filling in:
- `spec.md` - Feature specification (RFC 2119 + GIVEN-WHEN-THEN)

`sdd new` also generates `plan.md`, `tasks.md` and `checklist.md` (`--all`), creates a missing domain automatically (no domain → `common`), and creates and switches to a `feature/<name>` git branch unless you pass `--no-branch`. Existing files are never overwritten (exit code 1); use `--force` only to regenerate them from scratch.

### Step 4: /sdd-plan

Write the implementation plan in the already generated `plan.md`:

```
/sdd-plan
```

- Technical decisions and rationale
- Implementation phases
- Risk analysis and mitigation

Only if `plan.md` is missing does the skill run `sdd new plan <feature>`.

### Step 5: /sdd-tasks

Break requirements into executable tasks in the already generated `tasks.md`:

```
/sdd-tasks
```

- Each task completable within 2-4 hours
- Task ids are `<name>-task-NNN` (e.g. `cart-task-001`)
- Task dependencies marked
- Priority levels: HIGH (🔴), MEDIUM (🟡), LOW (🟢)
- Test-first: each task writes failing tests for its scenarios before the code

### Step 6: /sdd-prepare

Verify Claude Code tools needed for implementation:

```
/sdd-prepare
```

**Features:**
- Analyzes tasks.md to auto-detect required tools
- Checks existence of sub-agents (`.claude/agents/`)
- Checks existence of skills (`.claude/skills/`)
- Auto-generates missing tools

**Detection Targets:**

| Keyword | Sub-Agent | Skill |
|---------|-----------|-------|
| test, testing | test-runner | test |
| api, rest | api-scaffold | gen-api |
| component | component-gen | gen-component |
| database | - | db-migrate |
| documentation, doc | - | gen-doc |
| review | code-reviewer | review |

**Also available via CLI:**

```bash
sdd prepare user-auth                 # Interactive
sdd prepare user-auth --dry-run       # Preview
sdd prepare user-auth --auto-approve  # Auto-generate
```

### Step 7: /sdd-implement

Sequential implementation based on tasks:

```
/sdd-implement
```

AI reads tasks.md and guides strictly test-first (TDD) implementation, one task at a time:
1. `sdd new task <feature> <task-id> in-progress`
2. Red: turn the task's scenarios into tests and confirm they fail
3. Green: write the minimum code that passes
4. Refactor with all tests green
5. Reference each requirement in code and tests as `@spec <domain>/<feature>#REQ-01`
6. `sdd new task <feature> <task-id> completed`, then commit

Task statuses are changed only with `sdd new task`; every run recomputes the progress counts in tasks.md.

When all tasks are completed, `/sdd-implement` finishes the feature:

```bash
sdd validate                              # Format check
sdd sync <feature>                        # Every requirement covered by code/tests
sdd new status <feature> implemented      # Mark the spec as implemented
```

### Step 8: /sdd-validate

Validate specifications:

```
/sdd-validate
```

- Check RFC 2119 keyword usage
- Verify GIVEN-WHEN-THEN format
- Confirm required metadata fields

For features that are already implemented, it also runs `sdd sync` to confirm every requirement is referenced by code or tests (`@spec <domain>/<feature>#REQ-01`).

---

## Interactive Mode: /sdd-chat

Execute SDD tasks naturally:

```
/sdd-chat
```

Example conversation:

```
You: I want to build a user authentication feature
AI: I'll help you create a user authentication spec. Let me ask a few questions...
    1. What authentication method? (JWT, Session, OAuth)
    2. Social login needed?
    ...
```

---

## Spec File Format

### spec.md Example

```markdown
---
id: login
title: "User Authentication"
status: draft
created: 2025-12-24
domain: auth
depends: []
constitution_version: 1.0.0
---

# User Authentication

> JWT-based user authentication system

## Requirements

### REQ-01: Login

- The system SHALL support email/password login
- The system SHOULD return specific error messages on login failure

## Scenarios

### Scenario 1: Successful Login (REQ-01)

- **GIVEN** a valid user account exists
- **WHEN** valid email and password are entered
- **THEN** a JWT token is returned
- **AND** token expiration time is set
```

### Requirements and Traceability

- **Requirements are defined by headings**: `### REQ-01: Title`. Numbers are unique within a spec and restart at `REQ-01` in every spec. Only these definition headings count as requirements in `sdd sync`; REQ ids mentioned in prose, tables or lists are references.
- **Link code and tests to requirements** with `@spec <domain>/<feature>#REQ-01` (in a comment or a test title), e.g. `@spec auth/login#REQ-01`. A bare `REQ-01` is ambiguous once several specs define it and is then ignored by `sdd sync`.
- **Status** is changed with `sdd new status <feature> <status>` (`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`) rather than by editing the frontmatter.

### Dependencies (`depends`)

Declare dependencies on other specs in the frontmatter as a YAML list of `<domain>/<feature>` ids, and use `depends: []` when there are none:

```yaml
depends: [pricing/cart, auth/session]
```

`depends` is the only dependency source for `sdd impact` (graph, cycles, health score, affected specs). Mentioning another spec in the body (`` `pricing/cart` ``, a link) is shown as a reference, not a dependency.

### RFC 2119 Keywords

| Keyword | Meaning |
|---------|---------|
| **SHALL** / **MUST** | Absolute requirement |
| **SHOULD** | Recommended (exceptions allowed) |
| **MAY** | Optional |
| **SHALL NOT** | Absolutely forbidden |

---

## CLI Commands

Terminal commands (in addition to skills):

### Basic Commands

```bash
sdd init                    # Project initialization (interactive Git/CI-CD setup)
sdd init --skip-git-setup   # Skip Git/CI-CD configuration
sdd init --auto-approve     # Auto-approve all settings
sdd init --no-skills        # Skip .claude/skills/ and .agents/skills/ generation
sdd init --legacy-commands  # Also write legacy .claude/commands/sdd.*.md
sdd validate                # Validate specs
sdd status                  # Per-feature stage, task progress and next steps
sdd list                    # View list
```

`sdd status` shows each feature's task progress (e.g. `작업 1/3`) and computes the "next steps" per feature from its files, spec status and task progress (plan → tasks → implement → `sdd validate` · `sdd sync` → `sdd new status <feature> implemented`).

### Feature Development

```bash
sdd new <domain>/<feature>           # Create a feature (missing domain is created automatically)
sdd new <name>                       # No domain: goes to `common` (or the single active context domain)
sdd new <name> -d <domain>           # Domain via option (still supported)
sdd new <domain>/<feature> --all     # spec.md + plan.md + tasks.md + checklist.md
sdd new <domain>/<feature> --no-branch  # Do not create/switch to a git branch
sdd new <domain>/<feature> --all --force  # Regenerate, overwriting existing files
sdd prepare <feature>                # Verify sub-agents/skills
```

- Path: `.sdd/specs/<domain>/<feature>/spec.md`. Example: `sdd new auth/login` (or `sdd new login -d auth`) → `.sdd/specs/auth/login/spec.md`
- A domain that does not exist yet is created (like `sdd domain create <domain>`) and a notice is printed
- Without a domain the feature goes to `common`, or to the single active domain of the current context
- By default `sdd new` creates and switches to a `feature/<name>` git branch; pass `--no-branch` to stay on the current branch
- Existing files are never overwritten: the command exits with code 1 and names the file. `--force` regenerates them

**Update status** (instead of editing frontmatter or tasks.md by hand). `<feature>` is `<domain>/<feature>` or a unique feature name:

```bash
sdd new status <feature> <status>              # draft | review | approved | planned | tasked | implementing | implemented | deprecated
sdd new task <feature> <task-id> <status>      # pending | in-progress | completed | blocked (한글: 대기 | "진행 중" | 완료 | 차단됨)

sdd new status pricing/cart implemented
sdd new task pricing/cart cart-task-001 in-progress
sdd new task cart cart-task-001 completed      # bare feature name; task ids are <name>-task-NNN
```

`sdd new task` also refreshes the progress block and `total:` / `completed:` counts in tasks.md, and suggests `sdd new status <feature> implemented` after the last task. Quote multi-word values (`"진행 중"`).

### Change Management

```bash
sdd change                  # Create change proposal
sdd change apply <id>       # Apply change
sdd impact <feature>        # Analyze impact (dependencies come from frontmatter `depends`)
```

### Quality & Analysis

```bash
sdd quality                 # Quality analysis
sdd report                  # Generate report
sdd search <query>          # Search specs
```

### Sync & Change Tracking

`sdd sync` counts only requirements a spec defines with a `### REQ-01: Title` heading, and matches them to `@spec <domain>/<feature>#REQ-01` references in code and tests (bare ids count only while unambiguous).

```bash
sdd sync                    # Verify spec-code sync
sdd sync user-auth          # Sync specific spec
sdd sync --ci --threshold 80 # CI mode (threshold)
sdd sync --json             # JSON output
sdd sync --markdown         # Markdown report

sdd diff                    # Show spec changes (working directory)
sdd diff --staged           # Show staged changes
sdd diff abc123 def456      # Compare commits
sdd diff --stat             # Statistics summary
sdd diff --json             # JSON output
```

### Spec Export

```bash
sdd export user-auth        # Export single spec to HTML
sdd export --all            # Export all specs
sdd export --format json    # JSON format
sdd export --format markdown # Merged markdown
sdd export -o ./docs/specs.html # Specify output
sdd export --theme dark     # Dark theme
sdd export --no-toc         # Exclude table of contents
```

### Domain Management

```bash
sdd domain create auth              # Create new domain
sdd domain list                     # List domains
sdd domain show auth                # Show domain details
sdd domain link auth user-login     # Link spec to domain
sdd domain depends order --on auth  # Set domain dependencies
sdd domain graph                    # Show dependency graph (Mermaid)
sdd domain graph --format dot       # DOT format
```

### Context Management

```bash
sdd context set auth                # Set context
sdd context set auth order          # Multiple domains
sdd context set auth # Dependencies included by default
sdd context show                    # Show current context
sdd context specs                   # List specs in context
sdd context clear                   # Clear context
```

### Reverse Extraction

The CLI scans structure, validates drafts, and records review decisions. The AI (the `/sdd-reverse` skill, or `$sdd-reverse` in Codex; `/sdd.reverse` only exists with `sdd init --legacy-commands`) reads the code and writes the drafts to `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`.

```bash
sdd reverse scan --json             # Scan structure (files, lines, languages, suggested domains)
sdd validate .sdd/.reverse-drafts   # Validate AI-written drafts
sdd reverse review --list           # List drafts with status and validation results
sdd reverse review <ref> --approve  # Approve a draft (or --reject --reason "...")
sdd reverse finalize                # Move approved drafts to .sdd/specs/
```

### Git Workflow

```bash
# Install Git Hooks
sdd git hooks install       # Install pre-commit, commit-msg, pre-push
sdd git hooks uninstall     # Remove hooks

# Configure commit template
sdd git template install    # Install .gitmessage template

# Complete Git workflow setup
sdd git setup               # hooks + template + .gitignore/.gitattributes

# CI/CD configuration
sdd cicd setup github       # Create GitHub Actions workflow
sdd cicd setup gitlab       # Create GitLab CI config
sdd cicd check              # Validate CI environment
```

---

## Project Structure

```
your-project/
├── .sdd/
│   ├── constitution.md     # Project constitution
│   ├── domains.yml         # Domain definitions (created by `sdd init --with-domains` or on first `sdd new <domain>/<feature>`)
│   ├── .context.json       # Current context (created by `sdd context set`)
│   ├── specs/              # Feature specifications (domain-based)
│   │   ├── common/         # Default domain (no domain specified)
│   │   │   └── feature-name/
│   │   │       ├── spec.md
│   │   │       ├── plan.md
│   │   │       ├── tasks.md
│   │   │       └── checklist.md
│   │   └── auth/           # Domain-grouped specs
│   │       └── login/
│   │           ├── spec.md
│   │           ├── plan.md
│   │           ├── tasks.md
│   │           └── checklist.md
│   ├── changes/            # Change proposals
│   ├── archive/            # Completed changes
│   └── .reverse-drafts/    # Reverse extraction drafts
│
├── AGENTS.md               # SDD guide in a <!-- sdd:begin/end --> block (read by Codex)
├── CLAUDE.md               # Imports the guide via @AGENTS.md (Claude Code)
│
├── .claude/                # Claude Code
│   ├── agents/             # Subagents (sdd-spec-reviewer, sdd-implementer, sdd-impact-analyst)
│   └── skills/             # SDD workflow skills — English, kebab-case
│       ├── sdd-start/
│       │   └── SKILL.md
│       └── ...             # 30 sdd-* skills total
├── .agents/skills/         # Codex skills (same 30 sdd-* skills)
└── .codex/agents/          # Codex subagents (sdd-*.toml)
```

> **Skills**: `sdd init` generates 30 English skills under `.claude/skills/sdd-*/SKILL.md` and `.agents/skills/sdd-*/SKILL.md`, writes the SDD guide into the root `AGENTS.md` block, and ensures `CLAUDE.md` imports `@AGENTS.md` (created if missing, appended if the line is absent, an old `@.sdd/AGENTS.md` line replaced; never overwriting your content). `.sdd/AGENTS.md` is no longer generated. Legacy `.claude/commands/` files are only written with `--legacy-commands`.

---

## Development

```bash
git clone https://github.com/JakeB-5/sdd-tool.git
cd sdd-tool
pnpm install
pnpm run build
pnpm test
```

### Documentation Development

```bash
pnpm run docs:dev      # Development server
pnpm run docs:build    # Build docs
pnpm run docs:preview  # Preview docs
```

### Test Coverage

```bash
pnpm run test:coverage  # Coverage report
```

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

---

## License

MIT License - See [LICENSE](LICENSE) for details.
