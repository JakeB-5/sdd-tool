# dev-test (Skill)

Vitest를 사용하여 테스트를 작성하거나 실행하는 개발 스킬입니다.

> **Note**: 이것은 슬래시 커맨드가 아닌 **스킬**입니다. Claude가 작업 컨텍스트에 따라 자동으로 선택하여 사용합니다.

## 개요

`dev-test` 스킬은 대상 파일을 분석하여 테스트 케이스를 생성하고 커버리지를 확인합니다.

## 트리거 조건

Claude가 다음과 같은 요청을 받으면 자동으로 이 스킬을 사용합니다:

- "테스트 작성", "테스트 실행", "커버리지"
- "vitest", "run tests"

## 테스트 생성 예시

```
User: src/auth/login.ts 테스트 작성해줘

Claude: 🧪 테스트 분석: src/auth/login.ts

## 발견된 함수
- login(email, password)
- validateCredentials(email, password)
- createSession(user)

## 생성할 테스트

### login
```typescript
describe('login', () => {
  it('유효한 자격증명으로 세션을 반환한다', async () => {
    const result = await login('user@test.com', 'pass123');
    expect(result.success).toBe(true);
  });

  it('잘못된 비밀번호면 에러를 반환한다', async () => {
    const result = await login('user@test.com', 'wrong');
    expect(result.success).toBe(false);
  });
});
```

테스트 파일을 생성하시겠습니까?
→ tests/auth/login.test.ts
```

## 테스트 실행 예시

```
User: 테스트 실행해줘

Claude: 🧪 테스트 실행 중...

 ✓ tests/auth/login.test.ts (5 tests)
 ✓ tests/core/validation.test.ts (12 tests)
 ✗ tests/payment/checkout.test.ts (3 tests)
   - ✗ 결제 금액 계산

결과: 19/20 통과 (95%)

실패한 테스트:
  tests/payment/checkout.test.ts:45
  Expected: 10000
  Received: 9900

수정이 필요합니다.
```

## 커버리지 예시

```
User: 커버리지 확인해줘

Claude: 📊 테스트 커버리지

| 파일 | 라인 | 브랜치 | 함수 |
|------|------|--------|------|
| src/auth/login.ts | 95% | 80% | 100% |
| src/core/validation.ts | 100% | 100% | 100% |
| src/payment/checkout.ts | 72% | 60% | 85% |

전체 커버리지: 89%

커버리지 부족:
- src/payment/checkout.ts:50-65 (에러 처리)
```

## 관련 스킬

- [`dev-implement`](/commands/dev-implement) - 스펙 구현
- [`dev-review`](/commands/dev-review) - 코드 리뷰
