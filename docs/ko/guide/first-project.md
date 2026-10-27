# 첫 프로젝트

이 가이드에서는 SDD Tool을 사용해 간단한 할일 관리 기능을 만들어봅니다.

## 1. 프로젝트 초기화

```bash
mkdir todo-app
cd todo-app
npm init -y
sdd init
```

## 2. Claude Code 시작

```bash
claude
```

## 3. Constitution 작성

프로젝트의 핵심 원칙을 정의합니다:

```
/sdd-constitution React 기반 할일 관리 앱
```

AI가 대화를 통해 프로젝트 원칙을 작성합니다.

### 예시 Constitution

```markdown
# Todo App Constitution

## 핵심 원칙
- 사용자 경험이 최우선이다
- 오프라인에서도 동작해야 한다

## 기술 원칙
- React + TypeScript 사용
- 로컬 스토리지로 데이터 저장

## 금지 사항
- 외부 API 의존 금지
```

## 4. 기능 명세 작성

```
/sdd-spec 할일 추가 기능
```

AI가 대화를 통해 명세를 작성합니다. 내부적으로 `sdd new <domain>/<feature> --all`을 실행하며, 도메인이 없으면 만들고
(도메인을 주지 않으면 `common`), `feature/<id>` git 브랜치로 전환하고(`--no-branch`로 건너뜀), spec.md · plan.md ·
tasks.md · checklist.md를 생성합니다. 기존 파일은 `--force` 없이는 덮어쓰지 않습니다.

::: tip Codex
이 가이드의 모든 내용은 Codex에서도 동작합니다. 스킬은 `/sdd-spec`, `/sdd-plan` ... 대신 `$sdd-spec`, `$sdd-plan` ...으로 호출합니다.
:::

### 예시 명세

```markdown
---
id: add-todo
title: "할일 추가"
status: draft
created: 2026-10-27
depends: []
---

# 할일 추가

## 요구사항

### REQ-01: 할일 입력
- 시스템은 할일 텍스트 입력을 지원해야 한다(SHALL)
- 빈 텍스트는 거부해야 한다(SHALL)

## 시나리오

### Scenario 1: 성공적인 할일 추가
- **GIVEN** 사용자가 할일 입력 폼에 있을 때
- **WHEN** "우유 사기"를 입력하고 추가 버튼을 클릭하면
- **THEN** 할일 목록에 "우유 사기"가 추가된다
```

## 5. 구현 계획

```
/sdd-plan
```

AI가 `sdd new --all`이 이미 만든 plan.md를 기술적 구현 계획으로 편집합니다.

## 6. 작업 분해

```
/sdd-tasks
```

AI가 이미 만들어진 tasks.md를 채워 실행 가능한 작업 단위로 분해합니다. 각 작업은 `### add-todo-task-001: 제목` 헤딩과
`**상태:**`, `**우선순위:**`, `**설명:**`, `**의존성:**` 줄로 이루어집니다.

## 7. 도구 점검

```
/sdd-prepare
```

필요한 서브에이전트와 스킬을 확인하고 생성합니다.

## 8. 구현

```
/sdd-implement
```

AI가 테스트 우선 방식으로 순차적 구현을 안내합니다:

1. 작업을 진행 중으로 표시: `sdd new task add-todo add-todo-task-001 in-progress`
2. 실패하는 테스트 작성 (`@spec <domain>/add-todo#REQ-01`로 요구사항 참조)
3. 테스트가 통과하도록 코드 구현
4. 작업 완료 표시: `sdd new task add-todo add-todo-task-001 completed`
5. 다음 작업으로 이동

`sdd new task`는 tasks.md의 진행 상황 블록과 `completed:` / `total:` 필드도 다시 계산합니다.

## 9. 검증

```
/sdd-validate
```

명세가 올바르게 작성되었는지 검증한 뒤, 추적성을 확인하고 스펙을 마무리합니다:

```bash
sdd validate
sdd sync                              # 모든 REQ-xx가 코드나 테스트에서 참조되어야 함
sdd new status add-todo implemented   # 스펙 상태: draft → ... → implemented
```

## 완료!

첫 번째 SDD 기반 기능이 완성되었습니다.

## 다음 단계

- [워크플로우 이해하기](/guide/workflow)
- [모범 사례](/guide/best-practices)
