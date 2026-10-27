---
name: dev-test
description: Vitest를 사용하여 테스트를 작성하거나 실행합니다. 대상 파일을 분석하여 테스트 케이스를 생성하고 커버리지를 확인합니다. 사용자가 "테스트 작성", "테스트 실행", "커버리지", "vitest" 등을 요청할 때 사용합니다.
argument-hint: <file>
allowed-tools: Read Write Edit Glob Grep Bash(pnpm vitest *)
---

# 테스트 작성 및 실행

## Instructions

### 1. 테스트 대상 분석

대상 파일에서 테스트할 함수/클래스 식별:
- export된 함수/클래스
- 주요 로직 흐름
- 엣지 케이스

### 2. 테스트 케이스 생성

스펙의 Scenario를 참조하여 테스트 작성:
- describe: 테스트 그룹
- it: 개별 테스트 케이스
- GIVEN-WHEN-THEN 구조

### 3. 테스트 실행

```bash
# 전체 테스트
pnpm vitest run

# 특정 파일
pnpm vitest run tests/unit/path/to/file.test.ts

# 감시 모드
pnpm vitest

# 커버리지
pnpm vitest run --coverage
```

### 4. 결과 분석

- 통과/실패 현황
- 커버리지 부족 영역
- 개선 제안

## Examples

**사용자**: "validation.ts 테스트 작성해줘"

**응답**:
````
## 테스트 분석: src/core/validation.ts

### 발견된 함수
- validateLength(value, min, max)
- validateRequired(obj, fields)

### 생성할 테스트

```typescript
describe('validateLength', () => {
  it('범위 내 문자열은 유효하다', () => {
    expect(validateLength('hello', 1, 10).valid).toBe(true);
  });

  it('최소 길이 미달 시 실패한다', () => {
    expect(validateLength('hi', 5, 10).valid).toBe(false);
  });
});
```

테스트 파일을 생성하시겠습니까?
````
