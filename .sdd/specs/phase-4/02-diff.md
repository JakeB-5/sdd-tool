---
id: phase4-diff
title: "sdd diff - 스펙 변경사항 시각화"
status: draft
version: 0.8.0
created: 2025-12-24
author: Claude
dependencies: []
---

# sdd diff - 스펙 변경사항 시각화

> 스펙 파일의 변경사항을 시각적으로 표시합니다.

## 개요

Git diff와 유사하게 스펙 파일의 변경사항을 보여주되, 스펙 구조(요구사항, 시나리오 등)를 인식하여 의미 있는 차이를 표시합니다.

## 요구사항

### REQ-01: Git 기반 Diff

- 시스템은 Git 커밋 간 스펙 변경을 비교해야 한다(SHALL)
- 시스템은 스테이징된 변경을 비교해야 한다(SHALL)
- 시스템은 작업 디렉토리 변경을 비교해야 한다(SHALL)

### REQ-02: 구조적 Diff

- 시스템은 요구사항(REQ-xxx) 추가/수정/삭제를 감지해야 한다(SHALL)
- 시스템은 시나리오(GIVEN-WHEN-THEN) 변경을 감지해야 한다(SHALL)
- 시스템은 메타데이터(YAML frontmatter) 변경을 감지해야 한다(SHALL)
- 시스템은 RFC 2119 키워드 변경을 강조해야 한다(SHOULD)

### REQ-03: 출력 형식

- 시스템은 터미널에 컬러 diff를 출력해야 한다(SHALL)
- 시스템은 추가(+), 삭제(-), 수정(~) 를 구분해야 한다(SHALL)
- 시스템은 `--stat` 옵션으로 요약 통계를 지원해야 한다(SHALL)
- 시스템은 `--json` 옵션으로 JSON 출력을 지원해야 한다(MAY)

### REQ-04: 비교 대상

- 시스템은 두 커밋 간 비교를 지원해야 한다(SHALL)
- 시스템은 브랜치 간 비교를 지원해야 한다(SHALL)
- 시스템은 특정 스펙 파일만 비교하는 옵션을 제공해야 한다(SHOULD)

## 시나리오

### Scenario 1: 작업 디렉토리 변경 확인

- **GIVEN** spec.md 파일이 수정되었을 때
- **WHEN** `sdd diff` 명령을 실행하면
- **THEN** 변경된 내용이 컬러로 표시된다

### Scenario 2: 커밋 간 비교

- **GIVEN** 두 개의 커밋이 존재할 때
- **WHEN** `sdd diff abc123 def456` 명령을 실행하면
- **THEN** 두 커밋 간의 스펙 변경이 표시된다

### Scenario 3: 요구사항 변경 감지

- **GIVEN** REQ-001의 키워드가 SHOULD에서 SHALL로 변경되었을 때
- **WHEN** `sdd diff` 명령을 실행하면
- **THEN** 키워드 변경이 강조되어 표시된다
- **AND** 영향도 경고가 표시된다

### Scenario 4: 통계 요약

- **GIVEN** 여러 스펙 파일이 변경되었을 때
- **WHEN** `sdd diff --stat` 명령을 실행하면
- **THEN** 파일별 변경 요약이 표시된다

## CLI 인터페이스

```bash
# 작업 디렉토리 변경
sdd diff

# 스테이징된 변경
sdd diff --staged

# 커밋 간 비교
sdd diff <commit1> <commit2>

# 브랜치 비교
sdd diff main..feature/auth

# 특정 스펙만
sdd diff --spec user-auth

# 옵션
sdd diff --stat              # 통계 요약
sdd diff --name-only         # 파일명만
sdd diff --json              # JSON 출력
sdd diff --no-color          # 컬러 없음
```

## 출력 예시

### 기본 Diff

```
=== SDD Diff ===

.sdd/specs/user-auth/spec.md

  요구사항 변경:
  ~ REQ-001: 사용자 로그인
    - 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHOULD)
    + 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL)
    ⚠ 키워드 변경: SHOULD → SHALL (강화)

  + REQ-005: 소셜 로그인
    + 시스템은 Google OAuth 로그인을 지원해야 한다(MAY)

  시나리오 변경:
  + Scenario 3: Google 로그인
    + GIVEN 사용자가 Google 계정이 있을 때
    + WHEN Google 로그인 버튼을 클릭하면
    + THEN OAuth 인증 페이지로 리다이렉트된다
```

### 통계 요약 (--stat)

```
=== SDD Diff --stat ===

.sdd/specs/user-auth/spec.md
  요구사항: +1, ~1, -0
  시나리오: +1, ~0, -0
  키워드 변경: 1개 (SHOULD→SHALL)

.sdd/specs/user-profile/spec.md
  요구사항: +0, ~2, -1
  시나리오: +0, ~1, -0

총 변경: 2개 파일, 요구사항 +1 ~3 -1, 시나리오 +1 ~1 -0
```

## 기술 설계

### 핵심 모듈

```
src/core/diff/
├── index.ts
├── git-diff.ts         # Git diff 실행
├── spec-parser.ts      # 스펙 구조 파싱
├── structural-diff.ts  # 구조적 비교
├── keyword-diff.ts     # RFC 2119 키워드 변경 감지
└── formatter.ts        # 출력 포맷팅
```

### 데이터 구조

```typescript
interface SpecDiff {
  file: string;
  requirements: RequirementDiff[];
  scenarios: ScenarioDiff[];
  metadata: MetadataDiff;
  keywordChanges: KeywordChange[];
}

interface RequirementDiff {
  id: string;
  type: 'added' | 'modified' | 'removed';
  before?: string;
  after?: string;
}

interface KeywordChange {
  reqId: string;
  before: 'SHALL' | 'SHOULD' | 'MAY' | 'SHALL NOT';
  after: 'SHALL' | 'SHOULD' | 'MAY' | 'SHALL NOT';
  impact: 'strengthened' | 'weakened' | 'changed';
}
```
