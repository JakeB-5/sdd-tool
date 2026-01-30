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

SDD Tool is a command-line interface designed to work with **Claude Code** for implementing Spec-Driven Development (SDD) methodology. Through **slash commands**, you collaborate with AI to write specifications and implement features.

### Core Concepts

- **Specifications First**: Write specifications before writing code
- **AI Collaboration**: Automate workflow through Claude Code slash commands
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
# 1. Initialize your project (creates slash commands + Git/CI-CD setup)
sdd init

# 2. Start Claude Code
claude

# 3. Begin workflow with slash command
/sdd.start
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              SDD Slash Command Workflow                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd.start        → Start workflow                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd.constitution → Define project principles           │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd.spec         → Write/edit spec (spec.md)           │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd.plan         → Create implementation plan          │
│     │                                                       │
│     ▼                                                       │
│  5. /sdd.tasks        → Break down into tasks              │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd.prepare      → Verify sub-agents/skills           │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd.implement    → Sequential implementation          │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd.validate     → Validate specifications            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Slash Commands (20 Total)

Automatically generated in `.claude/commands/` when you run `sdd init`.

### Core Workflow

| Command | Description | Example |
|---------|-------------|---------|
| `/sdd.start` | Unified entry point | `/sdd.start` |
| `/sdd.constitution` | Project principles | `/sdd.constitution React-based todo app` |
| `/sdd.spec` | **Write/edit spec (unified)** | `/sdd.spec user authentication` |
| `/sdd.plan` | Implementation planning | `/sdd.plan` |
| `/sdd.tasks` | Break down into tasks | `/sdd.tasks` |
| `/sdd.prepare` | Verify sub-agents/skills | `/sdd.prepare` |
| `/sdd.implement` | Sequential implementation | `/sdd.implement` |
| `/sdd.validate` | Spec validation | `/sdd.validate` |

> **Note**: `/sdd.spec` automatically determines whether to create new specs or modify existing ones, guiding you through the appropriate workflow.

### Change Management

| Command | Description |
|---------|-------------|
| `/sdd.impact` | Analyze change impact |
| `/sdd.transition` | Switch between new ↔ change workflows |

### Deprecated

| Command | Replacement | Description |
|---------|-------------|-------------|
| `/sdd.new` | `/sdd.spec` | New feature spec |
| `/sdd.change` | `/sdd.spec` | Existing spec modification |

### Analysis & Quality

| Command | Description |
|---------|-------------|
| `/sdd.analyze` | Analyze requests and estimate scope |
| `/sdd.quality` | Calculate spec quality score |
| `/sdd.report` | Generate project report |
| `/sdd.search` | Search specs |
| `/sdd.status` | Check project status |
| `/sdd.list` | View items list |
| `/sdd.sync` | Verify spec-code synchronization |
| `/sdd.diff` | Visualize spec changes |
| `/sdd.export` | Export specs (HTML, JSON) |

### Documentation Generation

| Command | Description |
|---------|-------------|
| `/sdd.research` | Technical research document |
| `/sdd.data-model` | Data model documentation |
| `/sdd.guide` | Workflow guide |

### Operations

| Command | Description |
|---------|-------------|
| `/sdd.chat` | Interactive SDD assistant |
| `/sdd.watch` | File watch mode |
| `/sdd.migrate` | Migration from external tools |
| `/sdd.cicd` | CI/CD configuration |
| `/sdd.prompt` | Output prompt |

---

## Detailed Workflow Steps

### Step 1: /sdd.start

Entry point that analyzes project status and guides next actions:

```
/sdd.start
```

- **New project**: Recommends writing Constitution
- **Existing project**: Shows workflow menu

### Step 2: /sdd.constitution

Define your project's core principles:

```
/sdd.constitution React-based todo management app
```

AI analyzes `.sdd/constitution.md` and guides you through:
- Core Principles
- Technical Principles
- Forbidden Practices

### Step 3: /sdd.spec

Write feature specifications with AI:

```
/sdd.spec user authentication
```

AI generates through conversation:
- `spec.md` - Feature specification (RFC 2119 + GIVEN-WHEN-THEN)

### Step 4: /sdd.plan

Create an implementation plan:

```
/sdd.plan
```

- Technical decisions and rationale
- Implementation phases
- Risk analysis and mitigation

### Step 5: /sdd.tasks

Break requirements into executable tasks:

```
/sdd.tasks
```

- Each task completable within 2-4 hours
- Task dependencies marked
- Priority levels: HIGH (🔴), MEDIUM (🟡), LOW (🟢)

### Step 6: /sdd.prepare

Verify Claude Code tools needed for implementation:

```
/sdd.prepare
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

### Step 7: /sdd.implement

Sequential implementation based on tasks:

```
/sdd.implement
```

AI reads tasks.md and guides TDD-style implementation:
1. Change task status to "in progress"
2. Write tests
3. Implement code
4. Mark task as "completed"

### Step 8: /sdd.validate

Validate specifications:

```
/sdd.validate
```

- Check RFC 2119 keyword usage
- Verify GIVEN-WHEN-THEN format
- Confirm required metadata fields

---

## Interactive Mode: /sdd.chat

Execute SDD tasks naturally:

```
/sdd.chat
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
id: user-auth
title: "User Authentication"
status: draft
created: 2025-12-24
constitution_version: 1.0.0
---

# User Authentication

> JWT-based user authentication system

## Requirements

### REQ-01: Login

- The system SHALL support email/password login
- The system SHOULD return specific error messages on login failure

## Scenarios

### Scenario 1: Successful Login

- **GIVEN** a valid user account exists
- **WHEN** valid email and password are entered
- **THEN** a JWT token is returned
- **AND** token expiration time is set
```

### RFC 2119 Keywords

| Keyword | Meaning |
|---------|---------|
| **SHALL** / **MUST** | Absolute requirement |
| **SHOULD** | Recommended (exceptions allowed) |
| **MAY** | Optional |
| **SHALL NOT** | Absolutely forbidden |

---

## CLI Commands

Terminal commands (in addition to slash commands):

### Basic Commands

```bash
sdd init                    # Project initialization (interactive Git/CI-CD setup)
sdd init --skip-git-setup   # Skip Git/CI-CD configuration
sdd init --auto-approve     # Auto-approve all settings
sdd validate                # Validate specs
sdd status                  # Check status
sdd list                    # View list
```

### Feature Development

```bash
sdd new <name>              # Create new feature (common domain)
sdd new <name> -d <domain>  # Create with domain (v1.3.0)
sdd new <name> --all        # Create spec + plan + tasks
sdd prepare <name>          # Verify sub-agents/skills
```

**v1.3.0 Domain-based Structure:**
- Without domain: creates in `common` folder
- Path: `.sdd/specs/<domain>/<feature>/spec.md`
- Example: `sdd new login -d auth` → `.sdd/specs/auth/login/spec.md`

### Change Management

```bash
sdd change                  # Create change proposal
sdd change apply <id>       # Apply change
sdd impact <feature>        # Analyze impact
```

### Quality & Analysis

```bash
sdd quality                 # Quality analysis
sdd report                  # Generate report
sdd search <query>          # Search specs
```

### Sync & Change Tracking (v0.8.0)

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

### Spec Export (v0.9.0)

```bash
sdd export user-auth        # Export single spec to HTML
sdd export --all            # Export all specs
sdd export --format json    # JSON format
sdd export --format markdown # Merged markdown
sdd export -o ./docs/specs.html # Specify output
sdd export --theme dark     # Dark theme
sdd export --no-toc         # Exclude table of contents
```

### Domain Management (v1.2.0)

```bash
sdd domain create auth              # Create new domain
sdd domain list                     # List domains
sdd domain show auth                # Show domain details
sdd domain link auth user-login     # Link spec to domain
sdd domain depends order --on auth  # Set domain dependencies
sdd domain graph                    # Show dependency graph (Mermaid)
sdd domain graph --format dot       # DOT format
```

### Context Management (v1.2.0)

```bash
sdd context set auth                # Set context
sdd context set auth order          # Multiple domains
sdd context set auth --include-deps # Include dependencies
sdd context show                    # Show current context
sdd context specs                   # List specs in context
sdd context clear                   # Clear context
```

### Reverse Extraction (v1.2.0)

```bash
sdd reverse scan                    # Scan project structure
sdd reverse scan --depth deep       # Deep analysis
sdd reverse extract                 # Extract spec drafts
sdd reverse extract --ai            # AI-powered intent inference
sdd reverse review                  # Review extracted specs
sdd reverse finalize                # Finalize approved specs
```

### Git Workflow (v1.0.0)

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

## Claude Code Structure

```
your-project/
├── .sdd/
│   ├── constitution.md     # Project constitution
│   ├── AGENTS.md           # AI workflow guide
│   ├── domains.yml         # Domain definitions (v1.2.0)
│   ├── .context.json       # Current context (v1.2.0)
│   ├── specs/              # Feature specifications (v1.3.0: domain-based)
│   │   ├── common/         # Default domain (no domain specified)
│   │   │   └── feature-name/
│   │   │       ├── spec.md
│   │   │       ├── plan.md
│   │   │       └── tasks.md
│   │   └── auth/           # Domain-grouped specs
│   │       └── login/
│   │           ├── spec.md
│   │           ├── plan.md
│   │           └── tasks.md
│   ├── changes/            # Change proposals
│   ├── archive/            # Completed changes
│   └── .reverse-drafts/    # Reverse extraction drafts (v1.2.0)
│
└── .claude/
    ├── commands/           # Slash commands (20 total)
    │   ├── sdd.start.md
    │   ├── sdd.spec.md
    │   └── ...
    ├── agents/             # Sub-agents
    │   ├── test-runner.md
    │   └── api-scaffold.md
    ├── skills/             # Skills (v1.2.0)
    │   ├── dev-implement.md
    │   ├── dev-test.md
    │   ├── sdd-reverse.md
    │   ├── sdd-domain.md
    │   ├── sdd-context.md
    │   └── ...
    └── settings.json       # Skill settings (v1.2.0)
```

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
