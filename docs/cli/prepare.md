# sdd prepare

Checks required subagents and skills for implementation.

## Usage

```bash
sdd prepare <feature> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `feature` | `<domain>/<feature>` or a unique feature name |

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview only |
| `--auto-approve` | Auto-generate |
| `--json` | JSON format output |

`sdd prepare` reads the feature's tasks.md and writes into the Claude Code layout (`.claude/agents/`, `.claude/skills/`).
For Codex, the generated skills and `.codex/agents/*.toml` subagents are the equivalents; copy or adapt them by hand.

## Detection Keywords

Keywords are searched in the feature's tasks.md, plan.md and spec.md (case-insensitive, whole words; Korean keywords such as `테스트`, `문서`, `리뷰` match as substrings).

| Keywords | Subagent | Skill |
|----------|----------|-------|
| test, vitest, jest, unit test | test-runner | test |
| api, rest, endpoint, graphql | api-scaffold | gen-api |
| component, react, vue, ui | component-gen | gen-component |
| db, database, prisma, migration | - | db-migrate |
| doc, readme, jsdoc, documentation | doc-generator | doc |
| type, schema, zod, typescript | - | gen-types |
| lint, eslint, prettier, format | - | lint |
| review, code review | code-reviewer | review |

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

Check results are saved to `.sdd/specs/<domain>/<feature>/prepare.md`.

```markdown
# Tool Check Results

## Required Tools

- [x] test-runner (exists)
- [ ] api-scaffold (needs creation)

## Recommendations

- API scaffolding subagent creation recommended
```
