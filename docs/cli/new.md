# sdd new

새 기능의 명세를 생성합니다.

## 사용법

```bash
sdd new <name> [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `name` | 기능 이름 (영문, 케밥케이스 권장) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--all` | spec, plan, tasks 모두 생성 |

## 생성되는 파일

```
.sdd/specs/<name>/
├── spec.md     # 기능 명세
├── plan.md     # 구현 계획 (--all 옵션)
└── tasks.md    # 작업 분해 (--all 옵션)
```

## 예시

### 명세만 생성

```bash
sdd new user-auth
```

### 모든 파일 생성

```bash
sdd new user-auth --all
```

## 서브커맨드

### sdd new plan

구현 계획만 생성:

```bash
sdd new plan user-auth
```

### sdd new tasks

작업 분해만 생성:

```bash
sdd new tasks user-auth
```

## 생성되는 spec.md 예시

```markdown
---
id: user-auth
title: "user-auth"
status: draft
created: 2025-12-24
---

# user-auth

> 기능 설명을 작성하세요

## 요구사항

### REQ-01: 요구사항 제목

시스템은 ... 해야 한다(SHALL).

## 시나리오

### Scenario 1: 시나리오 제목

- **GIVEN** 전제 조건
- **WHEN** 동작
- **THEN** 예상 결과
```
