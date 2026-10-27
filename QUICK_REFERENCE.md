# SDD Tool - Quick Reference Guide

A quick lookup guide for common SDD Tool commands and concepts.

## Installation & Setup

```bash
# Install globally
npm install -g sdd-tool

# Initialize project (generates skills + CLAUDE.md import + Git/CI-CD setup)
sdd init
sdd init --no-skills        # Skip .claude/skills/ generation
sdd init --legacy-commands  # Also write legacy .claude/commands/sdd.*.md

# Start workflow
/sdd-start
```

## Essential Skills (Slash Commands)

| Skill | Purpose |
|-------|---------|
| `/sdd-start` | Begin workflow |
| `/sdd-constitution` | Define project principles |
| `/sdd-spec` | Write/edit specifications |
| `/sdd-plan` | Create implementation plan |
| `/sdd-tasks` | Break down into tasks |
| `/sdd-prepare` | Verify tools needed |
| `/sdd-implement` | Implement features |
| `/sdd-validate` | Validate specs |
| `/sdd-chat` | Interactive assistant |

## Essential CLI Commands

```bash
# Project setup
sdd init

# Create specs
sdd new auth/login --all            # Domain auto-created; spec + plan + tasks + checklist
sdd new feature-name                # No domain -> common
sdd new login -d auth               # Domain via option
sdd new auth/login --no-branch      # Skip feature/<name> branch creation
sdd new auth/login --all --force    # Regenerate (existing files are never overwritten otherwise)

# Track progress (<feature> = <domain>/<feature> or a unique feature name)
sdd new task <feature> <task-id> in-progress   # pending|in-progress|completed|blocked
sdd new status <feature> implemented           # draft|review|approved|planned|tasked|implementing|implemented|deprecated

# Validation & quality
sdd validate                        # Check all specs
sdd quality                         # Quality score
sdd status                          # Per-feature stage, task progress, next steps

# Development
sdd sync                            # Verify code matches specs
sdd prepare <feature>               # Prepare tools
sdd list                            # View all specs

# Analysis
sdd search <keyword>                # Find specs
sdd impact <feature>                # Change analysis (uses frontmatter depends)
sdd report                          # Generate report

# Version control
sdd git setup                       # Git workflow
sdd cicd setup github               # GitHub Actions
```

## Spec File Structure

```markdown
---
id: unique-id
title: "Feature Title"
status: draft
created: 2025-01-30
domain: auth
depends: []                  # [<domain>/<feature>, ...]; [] for none
constitution_version: 1.0.0
---

# Feature Title

> One-line description

## Requirements

### REQ-01: Requirement Title

The system SHALL describe the requirement using RFC 2119 keywords.

## Scenarios

### Scenario 1: Brief description (REQ-01)

- **GIVEN** initial context
- **WHEN** action occurs
- **THEN** expected outcome
```

- Requirements are the `### REQ-01: Title` headings (unique per spec); `sdd sync` counts only these
- Reference them from code and tests as `@spec <domain>/<feature>#REQ-01` (a bare `REQ-01` is ambiguous across specs)
- `depends` is the only dependency source for `sdd impact`; mentioning a spec in the body is just a reference

## RFC 2119 Keywords

| Keyword | Meaning | When to Use |
|---------|---------|------------|
| **SHALL** | Mandatory | Critical requirements |
| **SHOULD** | Recommended | Important features |
| **MAY** | Optional | Nice-to-have features |
| **SHALL NOT** | Forbidden | Constraints |
| **SHOULD NOT** | Discouraged | Anti-patterns |

**Examples:**
```markdown
- The system SHALL support email login
- The system SHOULD validate input
- The system MAY include dark mode
- The system SHALL NOT expose passwords
```

## GIVEN-WHEN-THEN Format

```markdown
### Scenario: Login Success

- **GIVEN** user has valid credentials
- **WHEN** they submit login form
- **THEN** they receive auth token
- **AND** they see dashboard
```

**Tips:**
- GIVEN: Setup and preconditions
- WHEN: Single action/trigger
- THEN: Observable outcome
- AND/OR: Additional related items

## Project Structure

```
your-project/
├── .sdd/                    # Specs directory
│   ├── constitution.md      # Project principles
│   ├── domains.yml          # Domain definitions (`sdd init --with-domains`, or created by the first `sdd new <domain>/<feature>`)
│   ├── specs/               # Specifications
│   ├── changes/             # Change proposals
│   └── archive/             # Completed changes
│
├── AGENTS.md                # SDD guide (sdd:begin/end block, read by Codex)
├── CLAUDE.md                # Imports @AGENTS.md
│
├── .claude/                 # Claude Code config
│   ├── agents/              # Sub-agents
│   └── skills/              # Skills
│       └── sdd-*/           # SDD workflow skills (30)
├── .agents/skills/          # Codex skills (same 30)
└── .codex/agents/           # Codex sub-agents
```

## Common Workflows

### New Project (Greenfield)

1. `sdd init` - Initialize
2. `/sdd-start` → `/sdd-constitution` - Define principles
3. `/sdd-spec` - Write first spec (`sdd new <domain>/<feature> --all`)
4. `/sdd-plan` - Plan implementation (edit the generated plan.md)
5. `/sdd-tasks` - Break into tasks (edit the generated tasks.md)
6. `/sdd-prepare` - Verify tools
7. `/sdd-implement` - Build test-first (`sdd new task <feature> <task-id> in-progress|completed`); after the last task: `sdd validate`, `sdd sync <feature>`, then `sdd new status <feature> implemented`
8. `/sdd-validate` - `sdd validate` (plus `sdd sync` for implemented features)

In Codex, use `$sdd-*` instead of `/sdd-*`.

### Existing Project (Brownfield)

1. `sdd init --skip-git-setup` - Initialize without Git setup
2. Identify key specs to document
3. Use `/sdd-reverse` for legacy code extraction
4. Follow greenfield workflow for new features

### Feature Development

```bash
sdd new shop/my-feature --all             # Creates domain, files and feature/my-feature branch
sdd validate
sdd prepare shop/my-feature
/sdd-implement                            # Runs sdd new task ... in-progress / completed per task
sdd sync shop/my-feature                  # Verify @spec shop/my-feature#REQ-01 coverage
sdd new status shop/my-feature implemented
```

Re-running `sdd new` for an existing feature fails with exit code 1 instead of overwriting files; use `--force` to regenerate.

### Quality Checks

```bash
sdd validate --strict       # Strict validation
sdd quality                 # Quality scoring
sdd sync --ci --threshold 80 # CI mode
```

## Specification Checklist

Before finalizing a spec:

- [ ] ID and title are clear
- [ ] Status is set correctly
- [ ] Constitution version is noted
- [ ] Overview explains purpose and scope
- [ ] Requirements use RFC 2119 keywords
- [ ] Scenarios use GIVEN-WHEN-THEN format
- [ ] Both happy path and error cases covered
- [ ] Edge cases considered
- [ ] Related specs linked
- [ ] Reviewed by team

## Writing Tips

### Requirements

**Good:**
- "System SHALL validate email format (RFC 5322)"
- "Response SHOULD complete within 500ms"

**Avoid:**
- "System should validate email"
- "Should be fast"

### Scenarios

**Good:**
```markdown
- **GIVEN** alice@example.com is registered
- **WHEN** alice submits login with correct password
- **THEN** alice receives JWT token
```

**Avoid:**
```markdown
- **GIVEN** a user
- **WHEN** they try to log in
- **THEN** something happens
```

## Domains

```bash
# Organize specs by domain (a missing domain is created automatically)
sdd new auth/login              # auth domain
sdd new checkout -d payment     # payment domain (-d still works)
sdd domain create auth
sdd domain link auth login
sdd domain depends payment --on auth
sdd domain graph
```

## Context

Focus on specific domains:

```bash
sdd context set auth            # Focus on auth domain
sdd context specs               # Specs in context
sdd context clear               # Reset context
```

## Reverse Extraction

Extract specs from existing code. The AI (`/sdd-reverse`) writes drafts to `.sdd/.reverse-drafts/`; the CLI scans, reviews, and finalizes:

```bash
sdd reverse scan --json                 # Scan structure
sdd validate .sdd/.reverse-drafts       # Validate drafts
sdd reverse review --list               # List drafts
sdd reverse review <ref> --approve      # Approve (or --reject --reason "...")
sdd reverse finalize                    # Move approved drafts to .sdd/specs/
```

## Spec Export

```bash
sdd export user-auth            # Single spec to HTML
sdd export --all                # All specs
sdd export --format json        # JSON format
sdd export -o ./docs            # Custom output
sdd export --theme dark         # Dark theme
```

## CI/CD Integration

```bash
# GitHub Actions
sdd cicd setup github
sdd cicd check

# Validation in CI
sdd validate --strict
sdd sync --ci --threshold 80
```

## Common Issues

### "Command not found: sdd"

```bash
# Reinstall globally
npm install -g sdd-tool

# Or use with npx
npx sdd --version
```

### Missing skills

```bash
# Check that the skills exist
ls .claude/skills/

# Recreate them in an existing project (plain `sdd init` refuses when .sdd/ exists)
sdd init --force
```

`sdd init --force` regenerates skills, subagents and the AGENTS.md block, but it also replaces `.sdd/constitution.md` and `.sdd/templates/` with the defaults (the old constitution is saved as `.sdd/constitution.md.bak`). Specs under `.sdd/specs/` are kept. Re-apply your constitution edits from the `.bak` file afterwards.

### Sync failures

```bash
# Check specific spec
sdd sync auth/user-auth

# Generate detailed report
sdd sync --json
```

- A requirement shows as unimplemented when no code/test references it as `@spec <domain>/<feature>#REQ-01`
- "여러 스펙에 해당하여 무시되었습니다" warning: a bare `REQ-01` matches several specs; qualify it with `<domain>/<feature>#`
- "REQ 정의 헤딩이 없어 요구사항 0개로 집계됩니다" warning: the spec defines no requirement headings; add `### REQ-01: Title`

### `sdd new` fails with "파일이 이미 존재합니다"

The feature already has the file. Edit it instead, or add `--force` to regenerate it from scratch.

## File Paths

**Specs location:**
```
.sdd/specs/<domain>/<feature>/spec.md
```

**Examples:**
```
.sdd/specs/common/user-auth/spec.md     # common domain
.sdd/specs/auth/login/spec.md           # auth domain
```

**Changes:**
```
.sdd/changes/change-id/proposal.md
.sdd/archive/change-id/proposal.md      # After approval
```

## Getting Help

```bash
sdd --help                      # General help
sdd <command> --help            # Command-specific help
sdd --version                   # Show version
```

## Additional Resources

- **Full Guide**: [Getting Started](docs/guide/getting-started.md)
- **CLI Reference**: [CLI Commands](docs/cli/index.md)
- **Spec Writing**: [Writing Specifications](docs/spec-writing/index.md)
- **RFC 2119**: [Keywords Guide](docs/spec-writing/rfc2119.md)
- **Scenarios**: [GIVEN-WHEN-THEN](docs/spec-writing/given-when-then.md)

## Quick Facts

- **Node version**: >= 20.0.0
- **Package manager**: npm, pnpm, or yarn
- **Config location**: `.sdd/` directory
- **Skills (slash commands)**: 30 total
- **CLI commands**: 25+ total
- **RFC 2119 keywords**: 5 (SHALL, SHOULD, MAY, SHALL NOT, SHOULD NOT)

## Keyboard Shortcuts (Claude Code)

| Command | Shortcut |
|---------|----------|
| Show command palette | Cmd/Ctrl + Shift + P |
| Type slash command | `/` then command name |
| Context menu | Cmd/Ctrl + K |

## Version Compatibility

- **v2.1.0+**: `sdd new status` / `sdd new task` state commands, `sdd new` never overwrites existing files (`--force` regenerates), missing domains auto-created, `sdd impact` dependencies only from frontmatter `depends`, `sdd sync` counts only `### REQ-01: Title` headings
- **v2.0.0+**: Claude Code and Codex output from every `sdd init` (root `AGENTS.md` block, `.agents/skills/`, subagents), `@spec <domain>/<feature>#REQ-xx` references
- **v1.6.0+**: Skills — 30 English `sdd-*` skills, `--no-skills` flag (`--legacy-commands` writes legacy `.claude/commands/`)
- **v1.3.0+**: Domain-based spec structure
- **v1.2.0+**: Context, reverse extraction, skills
- **v1.0.0+**: Git workflow integration
- **v0.9.0+**: Spec export (HTML, JSON)
- **v0.8.0+**: Sync verification

---

**Need more help?**
- GitHub: https://github.com/JakeB-5/sdd-tool
- Issues: https://github.com/JakeB-5/sdd-tool/issues
- Documentation: https://jakeb-5.github.io/sdd-tool/
