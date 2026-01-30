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
- Generates `.claude/commands/` with 20 slash commands
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

### Step 3: Project Structure Created

After initialization, your project will have:

```
your-project/
├── .sdd/
│   ├── constitution.md      # Project principles
│   ├── AGENTS.md            # AI workflow guide
│   ├── domains.yml          # Domain definitions
│   ├── specs/               # Specifications
│   ├── changes/             # Change proposals
│   └── archive/             # Completed changes
│
└── .claude/
    ├── commands/            # Slash commands
    ├── agents/              # Sub-agents
    └── skills/              # Skills
```

## Creating Your First Specification

### Option 1: Using Slash Commands (Recommended)

Start Claude Code:

```bash
claude
```

Begin your workflow:

```
/sdd.start
```

AI will analyze your project and guide you through the workflow.

### Option 2: Using CLI Commands

Create a new specification:

```bash
sdd new user-authentication
```

This creates:
- `.sdd/specs/common/user-authentication/spec.md`

### Edit the Specification

Open `.sdd/specs/common/user-authentication/spec.md` and define your requirements:

```markdown
---
id: user-authentication
title: "User Authentication"
status: draft
created: 2025-01-30
constitution_version: 1.0.0
---

# User Authentication

> JWT-based user authentication system

## Requirements

### REQ-001: User Login

The system SHALL support email and password authentication.

#### Scenarios

- **GIVEN** a registered user with valid credentials
- **WHEN** they submit the login form
- **THEN** they receive a JWT token
- **AND** the token is stored securely

### REQ-002: Password Reset

The system SHOULD provide password reset functionality.
```

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
```

Output shows:
- Sync rate for each spec
- Missing implementations
- Outdated specs

## Viewing Project Status

### Project Overview

```bash
sdd status
```

Shows:
- Total specs count
- Specs by status (draft, active, completed)
- Recent changes
- Quality metrics

### List All Specs

```bash
sdd list
```

Browse all specifications with filters:

```bash
# Filter by status
sdd list --status active

# Filter by domain
sdd list --domain auth
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
3. Create first spec using `/sdd.spec` or `sdd new`
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
/sdd.constitution [Your project description]
/sdd.spec [Feature name]
/sdd.plan
/sdd.tasks
/sdd.implement
```

### Adding Features to Existing Project

```bash
/sdd.spec [New feature name]
/sdd.plan
/sdd.tasks
/sdd.implement
```

### Modifying Existing Features

```bash
/sdd.spec [Feature to modify]
# AI detects existing spec and offers modification workflow
/sdd.plan
/sdd.tasks
/sdd.implement
```

### Analyzing Change Impact

```bash
sdd impact user-authentication
```

Shows:
- Dependent specs
- Affected tests
- API changes

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

### Slash Commands Not Working

Ensure `.claude/commands/` exists:

```bash
ls .claude/commands/
```

If missing, run:

```bash
sdd init
```

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
