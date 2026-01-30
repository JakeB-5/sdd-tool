# SDD Tool - Quick Reference Guide

A quick lookup guide for common SDD Tool commands and concepts.

## Installation & Setup

```bash
# Install globally
npm install -g sdd-tool

# Initialize project
sdd init

# Start workflow
/sdd.start
```

## Essential Slash Commands

| Command | Purpose |
|---------|---------|
| `/sdd.start` | Begin workflow |
| `/sdd.constitution` | Define project principles |
| `/sdd.spec` | Write/edit specifications |
| `/sdd.plan` | Create implementation plan |
| `/sdd.tasks` | Break down into tasks |
| `/sdd.prepare` | Verify tools needed |
| `/sdd.implement` | Implement features |
| `/sdd.validate` | Validate specs |
| `/sdd.chat` | Interactive assistant |

## Essential CLI Commands

```bash
# Project setup
sdd init

# Create specs
sdd new feature-name
sdd new login -d auth               # With domain

# Validation & quality
sdd validate                        # Check all specs
sdd quality                         # Quality score
sdd status                          # Project overview

# Development
sdd sync                            # Verify code matches specs
sdd prepare feature-name            # Prepare tools
sdd list                            # View all specs

# Analysis
sdd search <keyword>                # Find specs
sdd impact feature-name             # Change analysis
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
constitution_version: 1.0.0
---

# Feature Title

> One-line description

## Requirements

### REQ-001: Requirement Title

Requirement description using RFC 2119 keywords.

## Scenarios

### Scenario: Brief description

- **GIVEN** initial context
- **WHEN** action occurs
- **THEN** expected outcome
```

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
│   ├── domains.yml          # Domain definitions
│   ├── specs/               # Specifications
│   ├── changes/             # Change proposals
│   └── archive/             # Completed changes
│
└── .claude/                 # Claude Code config
    ├── commands/            # Slash commands
    ├── agents/              # Sub-agents
    └── skills/              # Skills
```

## Common Workflows

### New Project (Greenfield)

1. `sdd init` - Initialize
2. `/sdd.constitution` - Define principles
3. `/sdd.spec` - Write first spec
4. `/sdd.plan` - Plan implementation
5. `/sdd.tasks` - Break into tasks
6. `/sdd.prepare` - Verify tools
7. `/sdd.implement` - Build feature

### Existing Project (Brownfield)

1. `sdd init --skip-git-setup` - Initialize without Git setup
2. Identify key specs to document
3. Use `/sdd.reverse` for legacy code extraction
4. Follow greenfield workflow for new features

### Feature Development

```bash
sdd new my-feature
sdd validate
sdd prepare my-feature
/sdd.implement
sdd sync                    # Verify implementation
```

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

## Domains (v1.3.0+)

```bash
# Organize specs by domain
sdd new login -d auth           # auth domain
sdd new checkout -d payment     # payment domain
sdd domain create auth
sdd domain link auth login
sdd domain depends payment --on auth
sdd domain graph
```

## Context (v1.2.0+)

Focus on specific domains:

```bash
sdd context set auth            # Focus on auth domain
sdd context specs               # Specs in context
sdd context clear               # Reset context
```

## Reverse Extraction (v1.2.0+)

Extract specs from existing code:

```bash
sdd reverse scan                # Scan project
sdd reverse extract             # Extract drafts
sdd reverse review              # Review specs
sdd reverse finalize            # Finalize
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

### Missing slash commands

```bash
# Recreate commands
sdd init
# or manually check .claude/commands/
```

### Sync failures

```bash
# Check specific spec
sdd sync user-auth

# Generate detailed report
sdd sync --json
```

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

- **Full Guide**: [Getting Started](docs/guide/getting-started-en.md)
- **CLI Reference**: [CLI Commands](docs/cli/index-en.md)
- **Spec Writing**: [Writing Specifications](docs/spec-writing/index-en.md)
- **RFC 2119**: [Keywords Guide](docs/spec-writing/rfc2119-en.md)
- **Scenarios**: [GIVEN-WHEN-THEN](docs/spec-writing/given-when-then-en.md)

## Quick Facts

- **Node version**: >= 20.0.0
- **Package manager**: npm, pnpm, or yarn
- **Config location**: `.sdd/` directory
- **Slash commands**: 20+ total
- **CLI commands**: 25+ total
- **RFC 2119 keywords**: 5 (SHALL, SHOULD, MAY, SHALL NOT, SHOULD NOT)

## Keyboard Shortcuts (Claude Code)

| Command | Shortcut |
|---------|----------|
| Show command palette | Cmd/Ctrl + Shift + P |
| Type slash command | `/` then command name |
| Context menu | Cmd/Ctrl + K |

## Version Compatibility

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
