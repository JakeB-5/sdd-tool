# /dev-test

Vitest를 사용하여 테스트를 작성하거나 실행합니다.

## 사용법

```
/dev-test run                    # 전체 테스트 실행
/dev-test run <pattern>          # 특정 패턴의 테스트 실행
/dev-test write <file>           # 파일에 대한 테스트 작성
/dev-test coverage               # 커버리지 리포트 생성
```

## 테스트 작성 워크플로우

1. 대상 파일을 분석합니다
2. 함수/클래스의 시그니처를 파악합니다
3. 경계값과 에지 케이스를 식별합니다
4. 테스트 케이스를 작성합니다
5. 테스트를 실행하여 검증합니다

## 테스트 구조

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { targetFunction } from './target.js';

describe('targetFunction', () => {
  it('정상 입력에 대해 올바른 결과 반환', () => {
    const result = targetFunction(validInput);
    expect(result).toBe(expectedOutput);
  });

  it('잘못된 입력에 대해 에러 반환', () => {
    expect(() => targetFunction(invalidInput)).toThrow();
  });
});
```

## 예시

```
/dev-test run                    # 모든 테스트 실행
/dev-test run unit               # 단위 테스트만 실행
/dev-test run e2e                # E2E 테스트만 실행
/dev-test write src/utils/fs.ts  # fs.ts에 대한 테스트 작성
/dev-test coverage               # 커버리지 확인
```

## 참고사항

- `test-writer` 에이전트를 활용합니다
- TDD 방식으로 테스트를 먼저 작성합니다
- 테스트 파일은 `tests/unit/` 또는 `tests/e2e/`에 위치합니다
- 파일명은 `*.test.ts` 또는 `*.e2e.test.ts` 패턴을 따릅니다
