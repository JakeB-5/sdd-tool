# sdd prepare

Checks required subagents and skills for implementation.

## Usage

```bash
sdd prepare <feature> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `feature` | Feature name |

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview only |
| `--auto-approve` | Auto-generate |

## Detection Keywords

| Keyword | Subagent | Skill |
|---------|----------|-------|
| test | test-runner | test |
| api, rest | api-scaffold | gen-api |
| component | component-gen | gen-component |
| database | - | db-migrate |
| doc, documentation | - | gen-doc |
| review | code-reviewer | review |

## Examples

### Interactive Check

```bash
sdd prepare user-auth
```

### Preview

```bash
sdd prepare user-auth --dry-run
```

### Auto-Generate

```bash
sdd prepare user-auth --auto-approve
```

## Generated Files

### Subagents

```
.claude/agents/
├── test-runner.md
├── api-scaffold.md
└── code-reviewer.md
```

### Skills

```
.claude/skills/
├── test/
│   └── SKILL.md
├── gen-api/
│   └── SKILL.md
└── gen-component/
    └── SKILL.md
```

## Check Report

Check results are saved to `.sdd/specs/<feature>/prepare.md`.

```markdown
# Tool Check Results

## Required Tools

- [x] test-runner (exists)
- [ ] api-scaffold (needs creation)

## Recommendations

- API scaffolding subagent creation recommended
```
