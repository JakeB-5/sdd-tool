# sdd start

SDD 워크플로우를 시작합니다 (프로젝트 상태와 사용 가능한 워크플로우를 보여주는 통합 진입점).

## 사용법

```bash
sdd start [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `-w, --workflow <type>` | 한 워크플로우의 단계를 표시: `new-feature`, `change-spec`, `validate`, `status`, `constitution` |
| `--status` | 프로젝트 상태만 표시 |

## 동작

`sdd start`는 대화형이 아닙니다. 옵션 없이 실행하면 프로젝트 상태(Constitution 버전, 스펙 수와 ID, 진행 중인 변경)와
워크플로우 목록을 출력합니다. `--workflow <type>`을 주면 해당 워크플로우의 단계, 관련 Claude Code 스킬, 명령어를
출력합니다. SDD 프로젝트 밖에서는 실패합니다(종료 코드 1).

## 예시

### 기본 시작

```bash
sdd start
```

출력:
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

### 새 기능 워크플로우 바로 시작

```bash
sdd start --workflow new-feature
```

단계를 출력합니다: `sdd new <name>`, spec.md 편집, `sdd new plan <id>`, `sdd new tasks <id>`, 구현.

### 변경 워크플로우 바로 시작

```bash
sdd start --workflow change-spec
```

변경 단계를 출력합니다: `sdd change -t "..."`, proposal.md / delta.md 편집, `sdd change validate <id>`,
`sdd change apply <id>`, `sdd change archive <id>`.

### 프로젝트 상태만

```bash
sdd start --status
```

## 워크플로우 흐름

```
sdd start
    │
    ├── Constitution 없음
    │   └── /sdd-constitution
    │
    ├── 새 기능
    │   └── /sdd-spec → /sdd-plan → /sdd-tasks → /sdd-implement → /sdd-validate
    │
    └── 변경
        └── /sdd-spec (변경 제안) → /sdd-impact → sdd change apply
```

## 스킬

Claude Code에서는 `/sdd-start` 스킬을, Codex에서는 `$sdd-start`를 사용하세요:

```
/sdd-start
```

## 관련 문서

- [sdd constitution](/cli/constitution) - Constitution 관리
- [sdd new](/cli/new) - 새 기능 생성
- [sdd change](/cli/change) - 변경 관리
- [시작하기 가이드](/guide/getting-started)
