# sdd status

프로젝트 상태를 조회합니다.

## 사용법

```bash
sdd status [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--json` | JSON 형식으로 출력 |
| `--verbose` | 기능별 상태 라벨·파일, 아카이브된 변경, 기능 브랜치도 표시 |
| `-d, --domain <domain>` | 특정 도메인의 기능만 표시 |

## 설명

현재 SDD 프로젝트의 상태를 표시합니다:

- 프로젝트 구조: `constitution.md`, 루트 `AGENTS.md`의 SDD 블록
- 기능 목록: 상태 아이콘, 제목, ID, tasks.md가 있으면 작업 진행률(`— 작업 완료/전체`)
- 대기 중인 변경, 현재 Git 브랜치
- 기능별로 계산한 다음 단계

### 다음 단계

기능의 단계는 파일 · 스펙 상태 · 작업 진행률로 판정합니다 (위에서부터 처음 맞는 행):

| 단계 | 조건 | 안내 |
|------|------|------|
| `done` | 스펙 `deprecated`, 또는 `implemented`(레거시 `completed`)이고 미완료 작업 없음 — plan.md / tasks.md 유무 무관 | — |
| `implement` | 미완료 작업 있음 | 구현(`/sdd-implement` · `$sdd-implement`) 후 `sdd new task <feature> <task-id> completed`. 스펙이 `implemented`이면 "스펙 상태(implemented)와 작업 진행률(n/m)이 맞지 않습니다"를 덧붙임 |
| `plan` | plan.md 없음 | `sdd new plan <feature>` (Claude Code `/sdd-plan` · Codex `$sdd-plan`) |
| `tasks` | tasks.md 없음 | `sdd new tasks <feature>` (`/sdd-tasks` · `$sdd-tasks`) |
| `tasks` | tasks.md는 있지만 `### <feature>-task-NNN: 제목` 형식의 작업을 찾지 못함 | 형식 확인, 또는 `sdd new tasks <feature> --force`로 재생성(기존 내용 덮어씀) |
| `finalize` | 모든 작업 완료, 스펙 상태가 `implemented` 아님 | `sdd validate` · `sdd sync` 후 `sdd new status <feature> implemented` |

모든 기능이 완료되면 완료되었다고 명시합니다. `--json` 출력의 각 기능에는 `stage`가 포함됩니다.

## 출력 예시

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

## 관련 명령어

- [`sdd new`](/cli/new) - `sdd new status` / `sdd new task`로 스펙·작업 상태 변경
- [`sdd list`](/cli/list) - 항목 목록 조회
- [`sdd validate`](/cli/validate) - 스펙 검증
