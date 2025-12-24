---
id: phase4-sync
title: "sdd sync - 스펙-코드 동기화 검증"
status: approved
version: 0.8.0
created: 2025-12-24
author: Claude
dependencies: []
---

# sdd sync - 스펙-코드 동기화 검증

> 스펙 문서와 실제 구현 코드 간의 동기화 상태를 검증합니다.

## 개요

스펙에 정의된 요구사항이 코드에 구현되어 있는지, 코드에 스펙에 없는 기능이 있는지 검증하는 명령어입니다.

## 요구사항

### REQ-01: 스펙-코드 매핑 분석

- 시스템은 스펙의 요구사항 ID(REQ-xxx)와 코드의 주석/테스트를 매핑해야 한다(SHALL)
- 시스템은 `@spec REQ-001` 형식의 코드 주석을 인식해야 한다(SHALL)
- 시스템은 테스트 파일의 `it('REQ-001: ...')` 형식을 인식해야 한다(SHOULD)

### REQ-02: 동기화 상태 보고

- 시스템은 구현된 요구사항 목록을 표시해야 한다(SHALL)
- 시스템은 미구현 요구사항 목록을 표시해야 한다(SHALL)
- 시스템은 스펙에 없는 코드(orphan) 목록을 표시해야 한다(SHOULD)
- 시스템은 동기화율(%)을 계산해야 한다(SHALL)

### REQ-03: 출력 형식

- 시스템은 터미널에 컬러 출력을 지원해야 한다(SHALL)
- 시스템은 `--json` 옵션으로 JSON 출력을 지원해야 한다(SHALL)
- 시스템은 `--markdown` 옵션으로 마크다운 리포트를 지원해야 한다(MAY)

### REQ-04: 필터링

- 시스템은 특정 스펙만 검증하는 옵션을 제공해야 한다(SHALL)
- 시스템은 특정 디렉토리만 스캔하는 옵션을 제공해야 한다(SHOULD)

## 시나리오

### Scenario 1: 전체 동기화 검증

- **GIVEN** 스펙 파일과 소스 코드가 존재할 때
- **WHEN** `sdd sync` 명령을 실행하면
- **THEN** 전체 동기화 상태가 출력된다
- **AND** 동기화율이 표시된다

### Scenario 2: 특정 스펙 검증

- **GIVEN** user-auth 스펙이 존재할 때
- **WHEN** `sdd sync user-auth` 명령을 실행하면
- **THEN** 해당 스펙의 동기화 상태만 출력된다

### Scenario 3: 미구현 요구사항 발견

- **GIVEN** REQ-003이 코드에 구현되지 않았을 때
- **WHEN** `sdd sync` 명령을 실행하면
- **THEN** REQ-003이 "미구현" 목록에 표시된다
- **AND** 종료 코드가 1이다

### Scenario 4: CI 통합

- **GIVEN** CI 환경에서 실행할 때
- **WHEN** `sdd sync --ci` 명령을 실행하면
- **THEN** 동기화율이 임계값 미만이면 실패한다

## CLI 인터페이스

```bash
# 전체 동기화 검증
sdd sync

# 특정 스펙 검증
sdd sync <feature-id>

# 옵션
sdd sync --json              # JSON 출력
sdd sync --markdown          # 마크다운 리포트
sdd sync --ci                # CI 모드 (임계값 검사)
sdd sync --threshold 80      # 동기화율 임계값 (기본: 100)
sdd sync --src ./src         # 소스 디렉토리 지정
sdd sync --include "**/*.ts" # 포함 패턴
sdd sync --exclude "**/*.test.ts" # 제외 패턴
```

## 출력 예시

```
=== SDD Sync: 스펙-코드 동기화 검증 ===

스펙: 3개, 요구사항: 15개

✓ 구현됨 (12/15)
  - REQ-001: 사용자 로그인 (src/auth/login.ts:45)
  - REQ-002: 토큰 발급 (src/auth/token.ts:23)
  ...

✗ 미구현 (3/15)
  - REQ-010: 비밀번호 재설정
  - REQ-011: 2FA 인증
  - REQ-012: 세션 관리

⚠ 스펙 없는 코드 (2개)
  - src/auth/legacy.ts (orphan)
  - src/utils/deprecated.ts (orphan)

동기화율: 80% (12/15)
```

## 코드 주석 규칙

```typescript
/**
 * 사용자 로그인 처리
 * @spec REQ-001
 * @spec REQ-002
 */
export async function login(email: string, password: string) {
  // ...
}
```

```typescript
// 테스트에서의 매핑
describe('로그인', () => {
  it('REQ-001: 올바른 자격 증명으로 로그인한다', () => {
    // ...
  });
});
```

## 기술 설계

### 핵심 모듈

```
src/core/sync/
├── index.ts
├── spec-parser.ts      # 스펙에서 요구사항 추출
├── code-scanner.ts     # 코드에서 @spec 주석 스캔
├── test-scanner.ts     # 테스트에서 REQ-xxx 스캔
├── matcher.ts          # 스펙-코드 매칭
└── reporter.ts         # 결과 리포트 생성
```

### 데이터 구조

```typescript
interface SyncResult {
  specs: SpecSummary[];
  requirements: RequirementStatus[];
  syncRate: number;
  implemented: string[];
  missing: string[];
  orphans: CodeLocation[];
}

interface RequirementStatus {
  id: string;           // REQ-001
  specId: string;       // user-auth
  title: string;
  status: 'implemented' | 'missing' | 'partial';
  locations: CodeLocation[];
}

interface CodeLocation {
  file: string;
  line: number;
  type: 'code' | 'test';
}
```
