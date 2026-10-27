# /sdd-prepare

Check which subagents and skills a feature needs before implementation, and generate the missing ones with `sdd prepare`.

## Usage

```
/sdd-prepare <feature> [--dry-run]
```

In Codex, invoke it as `$sdd-prepare <feature>`.

## Arguments

| Argument | Description |
|----------|-------------|
| feature | `<domain>/<feature>` or a feature name that is unique in the project (e.g. `auth/login` or `login`) |
| --dry-run | Preview the analysis without creating files |

## Behavior

The skill runs the CLI and walks you through the result:

1. Run `sdd prepare <feature>`. The CLI reads the feature's `spec.md`, `plan.md` and `tasks.md` and matches keywords against them.
2. Review the detected subagents and skills and whether each one already exists.
3. Decide whether to generate the missing ones. A plain run does not prompt: it analyzes, writes the `prepare.md` report and prints a hint to re-run with `--auto-approve`.

```bash
sdd prepare login                  # analyze + write prepare.md (no prompt)
sdd prepare login --dry-run        # preview only, no files created
sdd prepare login --auto-approve   # also generate the missing tools
sdd prepare login --json           # JSON output
```

## Detection Keywords

Keywords are matched case-insensitively in the feature's documents. The table lists the English keywords; the CLI also matches Korean ones (e.g. 테스트, 문서, 컴포넌트).

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

## Output

`sdd prepare` prints the number of tasks analyzed, the needed and missing subagents and skills, and, unless `--dry-run`, writes a report:

```
.sdd/specs/<domain>/<feature>/prepare.md
```

With `--auto-approve` it also creates the missing files:

```
.claude/
├── agents/
│   └── api-scaffold.md
└── skills/
    └── gen-api/
        └── SKILL.md
```

## Codex

`sdd prepare` checks and writes only the Claude Code layout (`.claude/agents/`, `.claude/skills/`). It does not check or create Codex files. In Codex, use the detected list as a checklist and create the missing files by hand:

- Subagents: `.codex/agents/<name>.toml` (`name`, `description`, `developer_instructions`)
- Skills: `.agents/skills/<name>/SKILL.md`

## Next Steps

```
/sdd-spec -> /sdd-plan -> /sdd-tasks -> /sdd-prepare -> /sdd-implement
```

After the check, start implementation with `/sdd-implement`.

## Related Commands

- [`sdd prepare`](/cli/prepare) - CLI reference
- [`/sdd-tasks`](/commands/sdd-tasks) - Task breakdown
- [`/sdd-implement`](/commands/sdd-implement) - Implementation
