# /sdd-constitution

프로젝트 헌법(`.sdd/constitution.md`)을 작성하거나 수정하고 버전을 올립니다.

## 사용법

```
/sdd-constitution      # Claude Code
$sdd-constitution      # Codex
```

이 스킬은 인수를 받지 않으며, 대신 프로젝트에 대해 질문합니다.

## 개요

헌법은 프로젝트의 핵심 원칙을 정의합니다. 모든 스펙과 구현은 여기에 선언된 원칙을 따라야 합니다.

## 동작

### 새 프로젝트 설정

1. 프로젝트의 핵심 가치와 원칙을 질문
2. `.sdd/constitution.md`를 열어 내용 작성
3. `sdd constitution validate`로 형식 검증

### 기존 헌법 수정

1. `sdd constitution show`로 현재 내용 확인
2. 수정 후 변경 범위에 맞게 버전 업데이트:
   - `sdd constitution bump --patch -m "Fix wording"`
   - `sdd constitution bump --minor -m "Add new principle"`
   - `sdd constitution bump --major -m "Change core principle"`

`bump`는 버전 변경(예: `1.0.0 → 1.0.1`)을 출력하고 `.sdd/CHANGELOG.md`에 항목을 기록합니다.

## 헌법 구조

```markdown
---
version: 1.0.0
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Constitution: <Project Name>

> Project description

## Core Principles

### 1. <Principle Name>
- Rule (SHALL/MUST/SHOULD/MAY)

## Forbidden Practices
- Prohibition (SHALL NOT/MUST NOT)

## Tech Stack
- Technology choices

## Quality Standards
- Quality requirements
```

## 버전 관리

| 올림 | 시점 |
|------|------|
| **MAJOR** | 핵심 원칙 변경 (기존 스펙에 영향) |
| **MINOR** | 새 원칙 추가 |
| **PATCH** | 표현 수정, 오타 정정 |

## CLI 명령어

스킬은 모든 `sdd constitution` 하위 명령어를 실행할 수 있습니다:

```bash
sdd constitution show      # 현재 헌법 표시
sdd constitution version   # 버전만 표시
sdd constitution validate  # 형식 검증
sdd constitution history   # 변경 이력 조회
sdd constitution bump      # 버전 업데이트
```

## 예시

```
/sdd-constitution

AI: 헌법을 설정하겠습니다. 몇 가지 질문이 있습니다:

    1. 프로젝트의 핵심 가치는 무엇인가요?
    2. 어떤 기술 스택과 품질 기준을 적용하나요?
    3. 절대 하지 말아야 할 것(금지 사항)은 무엇인가요?

    (.sdd/constitution.md 작성)
    $ sdd constitution validate   (통과)
```

## 관련 명령어

- [`sdd constitution`](/ko/cli/constitution) - CLI 버전
- [`/sdd-start`](/ko/commands/sdd-start) - 프로젝트 설정 진입점
- [`/sdd-implement`](/ko/commands/sdd-implement) - 구현은 헌법을 따릅니다
