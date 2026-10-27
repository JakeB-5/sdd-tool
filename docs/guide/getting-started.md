# Getting Started with SDD Tool

This guide will help you set up and use SDD Tool for the first time.

## Prerequisites

- Node.js >= 20.0.0
- npm, pnpm, or yarn
- Git (for collaborative workflows)

## Installation

### Global Installation

Install SDD Tool globally:

```bash
npm install -g sdd-tool
```

Or with pnpm:

```bash
pnpm add -g sdd-tool
```

### Verify Installation

```bash
sdd --version
```

You should see the version number displayed.

## Setting Up Your First Project

### Step 1: Initialize Your Project

Navigate to your project directory and initialize SDD:

```bash
cd my-project
sdd init
```

This command:
- Creates `.sdd/` directory structure
- Generates 30 English skills (`sdd-*`) for Claude Code (`.claude/skills/`, invoked as `/sdd-*`) and Codex (`.agents/skills/`, invoked as `$sdd-*`)
- Generates the `sdd-spec-reviewer`, `sdd-implementer` and `sdd-impact-analyst` subagents (`.claude/agents/`, `.codex/agents/`)
- Writes the SDD guide into a managed block of the root `AGENTS.md` and ensures `CLAUDE.md` imports it (`@AGENTS.md`)
- Optionally sets up Git workflow and CI/CD

### Step 2: Configure Optional Features

During `sdd init`, you may be prompted to configure:

**Skip Git Setup:**
```bash
sdd init --skip-git-setup
```

**Auto-approve All Settings:**
```bash
sdd init --auto-approve
```

**Skip Skills generation:**
```bash
sdd init --no-skills
```

**Also write legacy slash commands (`.claude/commands/sdd.*.md`):**
```bash
sdd init --legacy-commands
```

### Step 3: Project Structure Created

After initialization, your project will have:

```
your-project/
├── .sdd/
│   ├── constitution.md      # Project principles
│   ├── domains.yml          # Domain definitions (only with `sdd init --with-domains`, otherwise created on the first `sdd new <domain>/<feature>`)
│   ├── specs/               # Specifications
│   ├── changes/             # Change proposals
│   └── archive/             # Completed changes
│
├── AGENTS.md                # SDD guide (sdd:begin/end block, read by Codex)
├── CLAUDE.md                # Imports @AGENTS.md
│
├── .claude/
│   ├── agents/              # Subagents (sdd-*.md)
│   └── skills/              # Skills (sdd-*)
├── .agents/skills/          # Codex skills (sdd-*)
└── .codex/agents/           # Codex subagents (sdd-*.toml)
```

## Creating Your First Specification

### Option 1: Using Skills (Recommended)

Start Claude Code:

```bash
claude
```

Begin your workflow:

```
/sdd-start
```

AI will analyze your project and guide you through the workflow.

### Option 2: Using CLI Commands

Create a new specification with its domain, in `<domain>/<feature>` form:

```bash
sdd new auth/user-authentication --all
```

This creates (`--all`):
- `.sdd/specs/auth/user-authentication/spec.md`
- `.sdd/specs/auth/user-authentication/plan.md`
- `.sdd/specs/auth/user-authentication/tasks.md`
- `.sdd/specs/auth/user-authentication/checklist.md`

Things to know:
- A domain that does not exist yet (`auth`) is created automatically and a notice is printed. Without a domain (`sdd new user-authentication`) the feature goes under `common`, or under the single active domain of the current context. `-d auth` still works.
- By default `sdd new` creates and switches to a `feature/user-authentication` git branch. Pass `--no-branch` to stay on your current branch (for example when several features share one branch).
- Existing files are never overwritten: running the command again exits with code 1 and names the file. Use `--force` only to regenerate the files from scratch.

Without `--all`, only `spec.md` is created; add plan.md, tasks.md and checklist.md later with `sdd new plan <feature>`, `sdd new tasks <feature>` and `sdd new checklist`.

### Edit the Specification

Open `.sdd/specs/auth/user-authentication/spec.md` and define your requirements:

```markdown
---
id: user-authentication
title: "User Authentication"
status: draft
created: 2025-01-30
domain: auth
depends: []
constitution_version: 1.0.0
---

# User Authentication

> JWT-based user authentication system

## Requirements

### REQ-01: User Login

The system SHALL support email and password authentication.

### REQ-02: Password Reset

The system SHOULD provide password reset functionality.

## Scenarios

### Scenario 1: Successful login (REQ-01)

- **GIVEN** a registered user with valid credentials
- **WHEN** they submit the login form
- **THEN** they receive a JWT token
- **AND** the token is stored securely
```

Requirements are defined by `### REQ-01: Title` headings. Numbers are unique within a spec and restart at `REQ-01` in every spec.

#### Declaring dependencies

List the specs this one depends on in the frontmatter, as `<domain>/<feature>` ids, and use `[]` when there are none:

```yaml
depends: [auth/session, pricing/cart]
```

`depends` is the only dependency source for `sdd impact`. Mentioning another spec in the body is shown as a reference, not a dependency.

### Plan, Tasks and Progress

`plan.md` and `tasks.md` already exist, so edit them (with `/sdd-plan` and `/sdd-tasks`) instead of creating them again. Task ids look like `user-authentication-task-001`.

Track progress with the state commands instead of editing files by hand. `<feature>` is `<domain>/<feature>` or a unique feature name:

```bash
sdd new task auth/user-authentication user-authentication-task-001 in-progress
sdd new task user-authentication user-authentication-task-001 completed
sdd new status auth/user-authentication implemented
```

- `sdd new task <feature> <task-id> <status>` accepts `pending`, `in-progress`, `completed`, `blocked` (or `대기`, `"진행 중"`, `완료`, `차단됨`) and refreshes the progress counts in tasks.md.
- `sdd new status <feature> <status>` accepts `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`.

### Link Code to Requirements

Reference requirements from code and tests as `@spec <domain>/<feature>#REQ-01`:

```typescript
/**
 * @spec auth/user-authentication#REQ-01
 */
export function login(email: string, password: string) { /* ... */ }
```

A bare `REQ-01` is ambiguous once several specs define it, and `sdd sync` ignores it.

## Understanding Core Concepts

### Spec-Driven Development (SDD)

SDD prioritizes specifications over code:

1. **Specifications First** - Write detailed specs before implementation
2. **Spec as Source of Truth** - Specs define what code should do
3. **Code Implements Specs** - Implementation follows specification

### RFC 2119 Keywords

Use standardized keywords to clarify requirement levels:

| Keyword | Meaning | Usage |
|---------|---------|-------|
| **SHALL** / **MUST** | Absolute requirement | Critical features |
| **SHOULD** | Recommended | Important features |
| **MAY** | Optional | Nice-to-have features |
| **SHALL NOT** | Absolutely forbidden | Constraints |

Example:
```markdown
- The system SHALL validate email format
- The system SHOULD send confirmation email
- The system MAY support social login
```

### GIVEN-WHEN-THEN Scenarios

Define requirements through concrete scenarios:

```markdown
### Scenario: Successful Login

- **GIVEN** a user with email "user@example.com" and password "secret123"
- **WHEN** they click the login button
- **THEN** they are redirected to the dashboard
- **AND** their session is created
```

Benefits:
- Easy to understand and test
- Creates acceptance criteria
- Bridges communication between stakeholders

### Constitution

Define your project's core principles:

```markdown
# Project Constitution

## Core Principles
1. User privacy comes first
2. Simple and intuitive UI
3. Mobile-first design

## Technical Principles
1. Use React for UI
2. RESTful API design
3. Test-driven development

## Forbidden Practices
1. No inline styles
2. No hardcoded values
3. No circular dependencies
```

## Verification and Validation

### Validate Your Specs

Check specs for correctness:

```bash
sdd validate
```

This checks:
- RFC 2119 keyword usage
- GIVEN-WHEN-THEN format
- Required metadata fields

### Check Sync Status

Verify spec-code alignment:

```bash
sdd sync
sdd sync auth/user-authentication   # a single spec
```

Output shows:
- The sync rate (requirements referenced by code or tests / all requirements)
- Requirements that are not implemented yet, e.g. `auth/user-authentication#REQ-02`
- Warnings, such as ignored ambiguous references or a spec that defines no `### REQ-01: Title` headings

Only requirements defined by a `### REQ-01: Title` heading are counted. Code and tests are matched through `@spec <domain>/<feature>#REQ-01` references; REQ ids merely mentioned in prose are not requirements.

## Viewing Project Status

### Project Overview

```bash
sdd status
```

Shows:
- Project structure checks (constitution.md, AGENTS.md)
- Every feature with a status icon (📝 draft, ✅ implemented, ...) and its task progress (`— 작업 1/3`, when it has a tasks.md); add `--verbose` for the spec status text and the files each feature has
- The current git branch
- Next steps per feature, computed from its files, spec status and task progress: write the plan, break it into tasks, implement (with the `sdd new task` command to run), or finish with `sdd validate` · `sdd sync` and `sdd new status <feature> implemented`

### List All Specs

```bash
sdd list features
```

Browse features with their status, optionally filtered:

```bash
# Filter by status
sdd list features --status implementing

# Status of a single domain
sdd status --domain auth
```

## Searching Specifications

Find specs quickly:

```bash
sdd search authentication
```

Search options:
- By keyword (default)
- By requirement ID
- By domain

## Next Steps

### Short Term (This Week)
1. Run `sdd init` to initialize your project
2. Write your project `constitution.md`
3. Create first spec using `/sdd-spec` or `sdd new <domain>/<feature> --all`
4. Validate specs with `sdd validate`

### Medium Term (This Month)
1. Set up Git workflow: `sdd git setup`
2. Create comprehensive specs for core features
3. Establish team practices
4. Set up CI/CD: `sdd cicd setup github`

### Long Term
1. Build out full specification library
2. Refine domain structure
3. Implement reverse extraction for legacy code
4. Establish SDD as team standard

## Common Use Cases

### Starting a New Project

```bash
sdd init
/sdd-start
/sdd-constitution [Your project description]
/sdd-spec [domain]/[feature]   # runs: sdd new <domain>/<feature> --all
/sdd-plan                      # edit the generated plan.md
/sdd-tasks                     # edit the generated tasks.md
/sdd-implement                 # per task: sdd new task <feature> <task-id> in-progress -> completed;
                               # at the end: sdd validate, sdd sync <feature>, sdd new status <feature> implemented
/sdd-validate                  # sdd validate (and sdd sync for implemented features)
```

In Codex, use `$sdd-*` instead of `/sdd-*`.

### Adding Features to Existing Project

```bash
/sdd-spec [domain]/[new feature]
/sdd-plan
/sdd-tasks
/sdd-implement
/sdd-validate
```

### Modifying Existing Features

```bash
/sdd-spec [Feature to modify]
# AI detects existing spec and offers modification workflow
# (small edits go straight into spec.md, large ones through a change proposal)
/sdd-plan
/sdd-tasks
/sdd-implement
```

### Analyzing Change Impact

```bash
sdd impact auth/user-authentication
```

Shows:
- Specs that depend on it (and the ones it depends on), taken from the frontmatter `depends` list only
- Body references: specs mentioned in the text, listed separately and not counted as dependencies
- Risk score and recommendations

Declare real dependencies with `depends: [<domain>/<feature>, ...]` (`[]` for none).

## Troubleshooting

### Command Not Found

Ensure SDD Tool is installed globally:

```bash
npm install -g sdd-tool
```

### Missing .sdd Directory

Initialize your project:

```bash
sdd init
```

### Skills Not Working

Ensure `.claude/skills/` exists:

```bash
ls .claude/skills/
```

If missing, regenerate them. Plain `sdd init` refuses to run when `.sdd/` already exists, so use:

```bash
sdd init --force
```

`--force` regenerates skills, subagents and the AGENTS.md block, but it also replaces `.sdd/constitution.md` and `.sdd/templates/` with the defaults (the old constitution is saved as `.sdd/constitution.md.bak`). Specs under `.sdd/specs/` are kept.

## Learning Resources

- **[CLI Reference](../cli/index.md)** - Detailed command documentation
- **[Spec Writing Guide](../spec-writing/index.md)** - Best practices for specifications
- **[RFC 2119 Keywords](../spec-writing/rfc2119.md)** - Keyword usage guide
- **[GIVEN-WHEN-THEN Scenarios](../spec-writing/given-when-then.md)** - Scenario writing
- **[Best Practices](./best-practices.md)** - Team workflow recommendations

## Tips for Success

1. **Start with Constitution** - Define principles before writing specs
2. **Use RFC 2119 Keywords** - Makes requirements unambiguous
3. **Write Scenarios** - GIVEN-WHEN-THEN makes specs testable
4. **Keep Specs Updated** - Update specs when requirements change
5. **Validate Regularly** - Check specs before implementation
6. **Use Domains** - Organize specs by domain for large projects
7. **Review Before Implementation** - Discuss specs with team first

## Getting Help

- Run `sdd --help` for command help
- Run `sdd <command> --help` for command-specific help
- Check documentation at [https://jakeb-5.github.io/sdd-tool/](https://jakeb-5.github.io/sdd-tool/)
- Open issues on [GitHub](https://github.com/JakeB-5/sdd-tool/issues)

---

## Next: Explore CLI Commands

Ready to dive deeper? Check out the [CLI Reference](../cli/index.md) for detailed command documentation.
