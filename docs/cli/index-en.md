# CLI Command Reference

Complete reference for SDD Tool command-line interface commands.

## Global Options

All commands support these options:

| Option | Description |
|--------|-------------|
| `--help` | Show help message for command |
| `--version` | Show SDD Tool version |

## Command Overview

SDD Tool provides the following command categories:

1. **Project Setup** - Initialize and configure projects
2. **Specification Management** - Create and manage specs
3. **Development Support** - Aid implementation process
4. **Analysis & Validation** - Verify specs and code
5. **Change Management** - Handle spec modifications
6. **Integration** - Git, CI/CD, and migrations
7. **Advanced** - Domains, contexts, reverse extraction

## Project Setup Commands

### init

Initialize a new SDD project.

```bash
sdd init [options]
```

**Options:**
- `--skip-git-setup` - Skip Git workflow setup
- `--auto-approve` - Auto-approve all settings

**Creates:**
- `.sdd/` directory structure
- `.claude/commands/` with slash commands
- `.claude/agents/` and `.claude/skills/` (optional)
- Git hooks and CI/CD workflows (optional)

**Example:**
```bash
sdd init
sdd init --skip-git-setup
sdd init --auto-approve
```

---

## Specification Management Commands

### new

Create a new feature specification.

```bash
sdd new <name> [options]
```

**Arguments:**
- `<name>` - Feature name (e.g., user-authentication)

**Options:**
- `-d, --domain <domain>` - Domain to create spec in (v1.3.0)
- `--all` - Create spec + plan + tasks simultaneously
- `--template <type>` - Use specific template

**Creates:**
- `.sdd/specs/<domain>/<name>/spec.md`
- Optional: plan.md, tasks.md

**Examples:**
```bash
sdd new user-auth                    # Create in 'common' domain
sdd new login -d auth                # Create in 'auth' domain
sdd new checkout --all               # Create spec + plan + tasks
```

### validate

Validate all specifications for correctness.

```bash
sdd validate [options]
```

**Options:**
- `--spec <name>` - Validate specific spec only
- `--strict` - Enable strict validation mode
- `--use-cache` - Use cached validation results
- `--no-cache` - Skip cache and validate fresh

**Validates:**
- RFC 2119 keyword usage
- GIVEN-WHEN-THEN scenario format
- Required metadata fields
- Specification structure

**Examples:**
```bash
sdd validate                         # Validate all specs
sdd validate --spec user-auth        # Validate single spec
sdd validate --strict                # Strict mode
```

---

## Development Support Commands

### prepare

Verify and generate Claude Code tools needed for implementation.

```bash
sdd prepare <spec-name> [options]
```

**Arguments:**
- `<spec-name>` - Specification to prepare for

**Options:**
- `--dry-run` - Preview changes without applying
- `--auto-approve` - Automatically generate all tools
- `--force` - Overwrite existing tools

**Detects and generates:**
- Sub-agents (in `.claude/agents/`)
- Skills (in `.claude/skills/`)

**Detection patterns:**

| Keyword Pattern | Creates | Type |
|-----------------|---------|------|
| test, testing | test-runner | Agent |
| api, rest, http | api-scaffold | Agent |
| component, ui | component-gen | Agent |
| database, db | db-schema | Skill |
| doc, documentation | gen-doc | Skill |
| review, refactor | code-reviewer | Agent |

**Examples:**
```bash
sdd prepare user-auth                # Interactive mode
sdd prepare user-auth --dry-run      # Preview changes
sdd prepare user-auth --auto-approve # Generate all
```

---

## Analysis & Validation Commands

### status

Show current project status and metrics.

```bash
sdd status [options]
```

**Options:**
- `--json` - Output as JSON

**Shows:**
- Total specification count
- Specs by status (draft, active, deprecated)
- Quality metrics
- Sync status
- Recent changes

**Example:**
```bash
sdd status
sdd status --json
```

### list

List all specifications with optional filtering.

```bash
sdd list [options]
```

**Options:**
- `--status <status>` - Filter by status (draft, active, deprecated)
- `--domain <domain>` - Filter by domain
- `--json` - Output as JSON

**Example:**
```bash
sdd list                             # Show all specs
sdd list --status active             # Only active specs
sdd list --domain auth               # Auth domain specs
```

### search

Search specifications by keyword or requirement.

```bash
sdd search <query> [options]
```

**Arguments:**
- `<query>` - Search term

**Options:**
- `--type <type>` - Search type (keyword, requirement, all)
- `--domain <domain>` - Limit search to domain
- `--json` - Output as JSON

**Example:**
```bash
sdd search authentication            # Search by keyword
sdd search REQ-001                   # Search by requirement ID
sdd search login --domain auth       # Domain-specific search
```

### quality

Analyze and score specification quality.

```bash
sdd quality [options]
```

**Options:**
- `--spec <name>` - Analyze specific spec
- `--threshold <score>` - Minimum acceptable score (0-100)
- `--json` - Output as JSON

**Metrics evaluated:**
- Requirement clarity
- Scenario completeness
- Metadata completeness
- RFC 2119 usage
- Format compliance

**Example:**
```bash
sdd quality
sdd quality --spec user-auth
sdd quality --threshold 80
```

### report

Generate comprehensive project report.

```bash
sdd report [options]
```

**Options:**
- `--format <format>` - Output format (markdown, json, html)
- `-o, --output <path>` - Output file path
- `--include-stats` - Include detailed statistics

**Report includes:**
- Specification summary
- Quality metrics
- Sync status
- Change history
- Domain overview

**Example:**
```bash
sdd report
sdd report --format html -o ./reports/sdd-report.html
```

---

## Synchronization & Change Tracking Commands

### sync

Verify specification-code synchronization.

```bash
sdd sync [spec-name] [options]
```

**Arguments:**
- `[spec-name]` - Optional: specific spec to check

**Options:**
- `--threshold <n>` - Minimum sync percentage (0-100)
- `--ci` - CI mode (exit with error if below threshold)
- `--json` - Output as JSON
- `--markdown` - Output as markdown report

**Checks:**
- Code references to spec requirements
- Test coverage for scenarios
- API changes vs spec
- Missing implementations

**Examples:**
```bash
sdd sync                             # Check all specs
sdd sync user-auth                   # Check specific spec
sdd sync --ci --threshold 80         # CI mode with threshold
sdd sync --json                      # JSON output
```

### diff

Show specification changes and modifications.

```bash
sdd diff [commit1] [commit2] [options]
```

**Arguments:**
- `[commit1]` - First commit (optional)
- `[commit2]` - Second commit (optional)

**Options:**
- `--staged` - Show staged changes only
- `--stat` - Show statistics summary only
- `--json` - Output as JSON

**Shows:**
- Modified specs
- New specs
- Deleted specs
- Change details

**Examples:**
```bash
sdd diff                             # Working directory changes
sdd diff --staged                    # Staged changes
sdd diff abc123 def456               # Between commits
sdd diff --stat                      # Summary statistics
```

---

## Spec Export Commands

### export

Export specifications in various formats.

```bash
sdd export [spec-name] [options]
```

**Arguments:**
- `[spec-name]` - Optional: specific spec to export

**Options:**
- `--format <format>` - Output format (html, json, markdown)
- `--all` - Export all specifications
- `-o, --output <path>` - Output directory/file
- `--theme <theme>` - Theme (light, dark)
- `--no-toc` - Exclude table of contents
- `--include-metadata` - Include YAML frontmatter

**Export formats:**
- **html** - Interactive HTML with styling
- **json** - Structured JSON format
- **markdown** - Plain markdown

**Examples:**
```bash
sdd export user-auth                 # Export single to HTML
sdd export --all                     # Export all specs
sdd export --format json             # JSON format
sdd export -o ./docs/specs.html      # Custom output path
sdd export --theme dark --all        # Dark theme
```

---

## Change Management Commands

### change

Create and manage change proposals.

```bash
sdd change [subcommand] [options]
```

**Subcommands:**
- `(create)` - Create new change proposal (default)
- `apply <id>` - Apply change proposal
- `review <id>` - Review change proposal
- `list` - List all change proposals

**Options:**
- `--spec <name>` - Target specification
- `--description <text>` - Change description
- `--auto-approve` - Auto-approve changes

**Examples:**
```bash
sdd change                           # Create proposal interactively
sdd change --spec user-auth          # Create for specific spec
sdd change apply abc123              # Apply change proposal
sdd change list                      # View all proposals
```

### impact

Analyze impact of specification changes.

```bash
sdd impact <spec-name> [options]
```

**Arguments:**
- `<spec-name>` - Specification to analyze

**Options:**
- `--depth <depth>` - Analysis depth (shallow, deep)
- `--json` - Output as JSON

**Analyzes:**
- Dependent specifications
- Affected tests
- Related implementations
- API changes
- Database changes

**Examples:**
```bash
sdd impact user-auth
sdd impact user-auth --depth deep
sdd impact user-auth --json
```

---

## Domain & Context Management Commands

### domain

Manage specification domains.

```bash
sdd domain <subcommand> [options]
```

**Subcommands:**
- `create <name>` - Create new domain
- `list` - List all domains
- `show <name>` - Show domain details
- `link <domain> <spec>` - Link spec to domain
- `depends <domain> --on <dep>` - Set dependencies
- `graph` - Show dependency graph
- `delete <name>` - Delete domain

**Options:**
- `--description <text>` - Domain description
- `--format <format>` - For graph: dot or mermaid

**Examples:**
```bash
sdd domain create auth
sdd domain list
sdd domain show auth
sdd domain link auth user-login
sdd domain depends order --on auth
sdd domain graph --format mermaid
```

### context

Manage specification context for focused work.

```bash
sdd context <subcommand> [options]
```

**Subcommands:**
- `set <domain...>` - Set context to domain(s)
- `show` - Show current context
- `specs` - List specs in current context
- `clear` - Clear context

**Options:**
- `--include-deps` - Include dependent domains

**Examples:**
```bash
sdd context set auth
sdd context set auth order payment   # Multiple domains
sdd context set auth --include-deps  # With dependencies
sdd context show
sdd context specs
sdd context clear
```

---

## Reverse Extraction Commands

### reverse

Extract specifications from existing code.

```bash
sdd reverse <subcommand> [options]
```

**Subcommands:**
- `scan` - Scan project for spec candidates
- `extract` - Extract spec drafts
- `review` - Review extracted specs
- `finalize` - Finalize approved specs

**Options:**
- `--depth <depth>` - Scan depth (shallow, deep)
- `--ai` - Use AI for intent inference
- `--auto-approve` - Auto-approve extractions

**Use cases:**
- Reverse-engineer specs from legacy code
- Maintain specifications for existing projects
- Document undocumented features

**Examples:**
```bash
sdd reverse scan                     # Scan project
sdd reverse scan --depth deep        # Deep scan
sdd reverse extract                  # Extract drafts
sdd reverse extract --ai             # AI-powered extraction
sdd reverse review                   # Review specs
sdd reverse finalize                 # Finalize specs
```

---

## Git Integration Commands

### git

Configure Git workflow for team collaboration.

```bash
sdd git <subcommand> [options]
```

**Subcommands:**
- `setup` - Complete Git workflow setup
- `hooks install` - Install Git hooks
- `hooks uninstall` - Remove Git hooks
- `template install` - Install commit template

**Git hooks installed:**
- `pre-commit` - Validate specs before commit
- `commit-msg` - Enforce commit message format
- `pre-push` - Verify specs before push

**Creates:**
- `.gitmessage` - Commit message template
- `.gitignore` - SDD-specific ignores
- `.gitattributes` - Spec file attributes

**Examples:**
```bash
sdd git setup                        # Complete setup
sdd git hooks install                # Just hooks
sdd git template install             # Just template
sdd git hooks uninstall              # Remove hooks
```

---

## CI/CD Integration Commands

### cicd

Configure CI/CD pipelines.

```bash
sdd cicd <subcommand> [options]
```

**Subcommands:**
- `setup <platform>` - Setup CI/CD pipeline
- `check` - Verify CI environment

**Supported platforms:**
- `github` - GitHub Actions
- `gitlab` - GitLab CI
- `jenkins` - Jenkins

**Setup includes:**
- Spec validation workflow
- Sync verification
- Quality checks
- Automated reporting

**Examples:**
```bash
sdd cicd setup github                # GitHub Actions
sdd cicd setup gitlab                # GitLab CI
sdd cicd check                       # Verify setup
```

---

## Utility Commands

### prompt

Output the system prompt for Claude Code.

```bash
sdd prompt [options]
```

**Options:**
- `--json` - Output as JSON

**Use for:**
- Debugging AI interactions
- Customizing prompts
- Documentation

**Example:**
```bash
sdd prompt
```

### watch

Watch for changes to specifications.

```bash
sdd watch [options]
```

**Options:**
- `--spec <name>` - Watch specific spec
- `--validate` - Auto-validate on change

**Features:**
- Real-time change detection
- Automatic validation
- Change logging

**Example:**
```bash
sdd watch
sdd watch --validate
```

### migrate

Migrate from other specification tools.

```bash
sdd migrate <source> [options]
```

**Arguments:**
- `<source>` - Source tool (spec-kit, openspec, etc.)

**Options:**
- `--input <path>` - Source file/directory
- `--output <path>` - Output directory
- `--auto-approve` - Auto-approve migration

**Supports:**
- Spec Kit specifications
- OpenSpec proposals
- Custom formats

**Example:**
```bash
sdd migrate spec-kit --input ./specs
```

---

## Command Organization by Workflow

### For New Projects

```bash
sdd init
sdd new feature-name --all
sdd validate
sdd prepare feature-name
```

### For Daily Development

```bash
sdd new feature-name            # Start feature
sdd validate                    # Check specs
sdd sync                        # Check implementation
sdd status                      # Review progress
```

### For Quality Assurance

```bash
sdd quality                     # Score all specs
sdd quality --spec feature      # Score one spec
sdd sync                        # Check coverage
sdd diff                        # Review changes
```

### For CI/CD Integration

```bash
sdd validate --strict           # Validate specs
sdd sync --ci --threshold 80    # Check sync
sdd report --format json        # Generate metrics
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Validation error |
| 3 | Sync threshold not met |

---

## Tips for Effective CLI Usage

1. **Use --help liberally** - Every command has detailed help
2. **Combine with pipes** - Use `--json` for scripting
3. **CI-friendly options** - `--ci`, `--json`, `--strict` for automation
4. **Dry-run first** - Use `--dry-run` before making changes
5. **Watch for changes** - Use `sdd watch` during development

---

Next: Learn about [Specification Writing](../spec-writing/index.md)
