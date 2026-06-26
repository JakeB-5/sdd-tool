# sdd init

Initializes a project with SDD Tool.

## Usage

```bash
sdd init [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing configuration |
| `--skip-git-setup` | Skip Git/CI-CD setup |
| `--auto-approve` | Auto-approve all settings |
| `--no-skills` | Skip `.claude/skills/` generation (both `dev-*` and `sdd-*`) |
| `--no-commands` | Skip `.claude/commands/` slash command generation |

## Generated Files

```
your-project/
├── .sdd/
│   ├── constitution.md     # Project constitution template
│   ├── AGENTS.md           # AI workflow guide
│   ├── specs/              # Feature specs directory
│   ├── changes/            # Change proposals directory
│   ├── archive/            # Completed changes archive
│   └── templates/          # Spec templates
│
└── .claude/
    ├── commands/           # Slash commands — Korean, dot-notation
    │   ├── sdd.start.md
    │   ├── sdd.spec.md
    │   ├── sdd.plan.md
    │   └── ...
    └── skills/             # Skills 2.0 — English, kebab-case (v1.6.0)
        ├── dev-implement/
        │   └── SKILL.md
        ├── dev-test/
        │   └── SKILL.md
        ├── sdd-start/
        │   └── SKILL.md
        ├── sdd-spec/
        │   └── SKILL.md
        └── ...             # 32 sdd-* skills total
```

## Skills 2.0

Starting with v1.6.0, `sdd init` generates 32 English Skills 2.0 definitions under `.claude/skills/sdd-*/SKILL.md` alongside the existing slash commands.

Each `sdd.foo` slash command has a matching `sdd-foo` skill. Skills are authored in English and include Skills 2.0 frontmatter:

- **`context: fork`** — 7 analysis/domain skills run in a forked context (`sdd-analyze`, `sdd-impact`, `sdd-sync`, `sdd-search`, `sdd-report`, `sdd-reverse`, `sdd-research`)
- **`context: manual-invoke-only`** — `sdd-watch` (long-running, not auto-triggered)
- **`disable-model-invocation: true`** — 5 utility skills that run a single CLI command (`sdd-guide`, `sdd-chat`, `sdd-cicd`, `sdd-watch`, `sdd-migrate`)
- **`allowed-tools`** — minimum-privilege glob patterns per skill (e.g., `Bash(sdd validate*)`)

To opt out of skill generation:

```bash
sdd init --no-skills        # Skip .claude/skills/ entirely
sdd init --no-commands      # Skip .claude/commands/ entirely
```

Both flags are backward-compatible. Omitting them generates everything (the default).

## Git Workflow Setup

After initialization, the tool analyzes your project structure and suggests Git workflow settings:

1. **Git Hooks Installation**: Automatic spec validation on commit/push
2. **Commit Template Installation**: Consistent commit message format
3. **GitHub Actions Setup**: Automatic validation and labeling on PRs

Each setting is executed **after user approval**.

## Examples

### Basic Initialization (Interactive)

```bash
sdd init
```

Example output:
```
Initializing SDD project...
✓ SDD project initialized.

🔍 Analyzing project structure...

=== Project Analysis Results ===

📁 Project Type:
   TypeScript (Node.js)

🔧 Git Status:
   Repository: ✅ Initialized
   Hooks: ❌ Not installed
   Commit Template: ❌ None

🚀 CI/CD Status:
   GitHub Actions: ❌ Not configured

📋 Recommended Settings:
   • Git Hooks: Automatic spec validation on commit/push
   • Commit Template: Consistent commit message format
   • GitHub Actions: Automatic validation and labeling on PRs

Install Git workflow (Hooks + Template)? (y/n): y
✓ Git workflow installation complete!

Set up GitHub Actions CI/CD? (y/n): y
✓ sdd-validate.yml created
✓ sdd-labeler.yml created
```

### Auto-Approve (for CI/Scripts)

```bash
sdd init --auto-approve
```

All settings are applied automatically without prompts.

### Skip Git Setup

```bash
sdd init --skip-git-setup
```

Initializes only the SDD structure, skipping Git/CI-CD setup.

### Overwrite Existing Configuration

```bash
sdd init --force
```

## After Initialization

1. Run Claude Code: `claude`
2. Start the workflow: `/sdd.start`

## Related Documentation

- [sdd git](/cli/git) - Git workflow setup
- [sdd cicd](/cli/cicd) - CI/CD pipeline setup
- [Commit Convention](/guide/commit-convention)
- [CI/CD Setup Guide](/guide/cicd-setup)
