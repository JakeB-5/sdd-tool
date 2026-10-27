# sdd status

Displays project status.

## Usage

```bash
sdd status [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--verbose` | Also show each feature's status label and files, archived changes, and feature branches |
| `-d, --domain <domain>` | Only show features of one domain |

## Description

Displays the current SDD project status:

- Project structure: `constitution.md`, the SDD block in the root `AGENTS.md`
- Features: status icon, title, id, and task progress (`— 작업 completed/total`) when tasks.md exists
- Pending changes and the current git branch
- Next steps, computed per feature

### Next steps

Each feature's stage is derived from its files, spec status and task progress (first matching row wins):

| Stage | Condition | Suggested next step |
|-------|-----------|---------------------|
| `done` | spec `deprecated`, or `implemented` (legacy `completed`) with no open tasks — plan.md / tasks.md are optional | — |
| `implement` | spec `implemented` but some tasks not completed | finish the open tasks; the line adds "스펙 상태(implemented)와 작업 진행률(n/m)이 맞지 않습니다" |
| `plan` | no plan.md | `sdd new plan <feature>` (Claude Code `/sdd-plan` · Codex `$sdd-plan`) |
| `tasks` | no tasks.md | `sdd new tasks <feature>` (`/sdd-tasks` · `$sdd-tasks`) |
| `tasks` | tasks.md exists but no `### <name>-task-NNN: title` task (`<name>` = feature name without domain) was recognized | check the format, or regenerate with `sdd new tasks <feature> --force` (overwrites the file) |
| `implement` | some tasks not completed | implement (`/sdd-implement` · `$sdd-implement`), then `sdd new task <feature> <task-id> completed`. The line reads "구현 진행 중 (n/m)" once a task is in progress or completed, and "구현 시작 전 (0/m)" (start with `sdd new task <feature> <task-id> in-progress`) before that. The spec status is never changed automatically |
| `finalize` | all tasks completed, spec status is not `implemented` | `sdd validate` · `sdd sync`, then `sdd new status <feature> implemented` |

When every feature is done, the section says so explicitly. With `--json`, each feature carries its `stage`.

## Output Example

```
📊 SDD 프로젝트 상태
════════════════════════════════════════

📁 프로젝트 구조:
   ✅ constitution.md
   ✅ AGENTS.md

📋 기능 목록:
   ✅ 카트 (pricing/cart) — 작업 4/4
   🔨 체크아웃 (pricing/checkout) — 작업 1/3
   📝 쿠폰 (pricing/coupon)

🔀 현재 브랜치: main

💡 다음 단계:
   pricing/checkout: 구현 진행 중 (1/3) — Claude Code /sdd-implement · Codex $sdd-implement, 작업 완료 시 sdd new task pricing/checkout <task-id> completed
   pricing/coupon: 명세 완성 후 계획 작성 — sdd new plan pricing/coupon (Claude Code /sdd-plan · Codex $sdd-plan)
```

## Related Commands

- [`sdd new`](/cli/new) - `sdd new status` / `sdd new task` change spec and task status
- [`sdd list`](/cli/list) - List items
- [`sdd validate`](/cli/validate) - Validate specs
