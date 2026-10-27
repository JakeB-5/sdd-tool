# sdd start

Starts the SDD workflow (a single entry point that shows the project status and the available workflows).

## Usage

```bash
sdd start [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-w, --workflow <type>` | Show the steps of one workflow: `new-feature`, `change-spec`, `validate`, `status`, `constitution` |
| `--status` | Show the project status only |

## Behavior

`sdd start` is not interactive. Without options it prints the project status (constitution version, spec count, the
first 5 spec ids followed by `... 외 N개` when there are more, pending changes) followed by the list of workflows. With `--workflow <type>` it prints the steps, the
matching Claude Code skills and the commands for that workflow. Outside an SDD project it fails (exit code 1).

## Examples

### Basic Start

```bash
sdd start
```

Output (CLI output is Korean):
```
ℹ === SDD 프로젝트 상태 ===

ℹ Constitution: v1.0.0
ℹ 명세 수: 2개
  • auth/login
  • billing/pay
⚠ 진행 중인 변경: 1개

ℹ === 사용 가능한 워크플로우 ===

ℹ [new-feature] 새 기능 명세
  • 명령어: sdd new <name>

ℹ [change-spec] 기존 스펙 변경
  • 명령어: sdd change
...
```

### Start New Feature Workflow Directly

```bash
sdd start --workflow new-feature
```

Prints the steps: `sdd new <name>`, edit spec.md, `sdd new plan <id>`, `sdd new tasks <id>`, implement.

### Start Change Workflow Directly

```bash
sdd start --workflow change-spec
```

Prints the change steps: `sdd change -t "..."`, edit proposal.md / delta.md, `sdd change validate <id>`,
`sdd change apply <id>`, `sdd change archive <id>`.

### Project Status Only

```bash
sdd start --status
```

## Workflow Flow

```
sdd start
    │
    ├── No Constitution
    │   └── /sdd-constitution
    │
    ├── New Feature
    │   └── /sdd-spec → /sdd-plan → /sdd-tasks → /sdd-implement → /sdd-validate
    │
    └── Change
        └── /sdd-spec (change proposal) → /sdd-impact → sdd change apply
```

## Skill

In Claude Code use the `/sdd-start` skill, in Codex `$sdd-start`:

```
/sdd-start
```

## Related Documentation

- [sdd constitution](/cli/constitution) - Constitution management
- [sdd new](/cli/new) - Create new feature
- [sdd change](/cli/change) - Change management
- [Getting Started Guide](/guide/getting-started)
