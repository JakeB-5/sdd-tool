# GIVEN-WHEN-THEN

GIVEN-WHEN-THEN은 시나리오를 구조화하여 검증 가능하게 만드는 형식입니다.

## 구조

```markdown
### Scenario: 시나리오 제목

- **GIVEN** 전제 조건 (시스템 상태)
- **WHEN** 동작 (사용자 행동)
- **THEN** 예상 결과 (시스템 반응)
- **AND** 추가 조건/결과
```

## 각 요소 설명

### GIVEN (전제 조건)

시나리오 시작 시 시스템의 상태:

```markdown
- **GIVEN** 사용자가 로그인되어 있을 때
- **GIVEN** 장바구니에 상품이 있을 때
- **GIVEN** 유효한 API 키가 설정되어 있을 때
```

### WHEN (동작)

사용자 또는 시스템의 행동:

```markdown
- **WHEN** 로그인 버튼을 클릭하면
- **WHEN** 결제 API를 호출하면
- **WHEN** 1분이 경과하면
```

### THEN (예상 결과)

시스템의 예상 반응:

```markdown
- **THEN** 대시보드로 이동한다
- **THEN** 성공 메시지가 표시된다
- **THEN** 이메일이 발송된다
```

### AND (추가 조건/결과)

추가적인 조건이나 결과:

```markdown
- **AND** 로그인 시간이 기록된다
- **AND** 세션이 생성된다
```

## 예시

### 로그인 시나리오

```markdown
### Scenario 1: 성공적인 로그인

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
- **AND** 토큰 만료 시간이 설정된다
- **AND** 로그인 로그가 기록된다

### Scenario 2: 잘못된 비밀번호

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 잘못된 비밀번호로 로그인하면
- **THEN** 401 에러가 반환된다
- **AND** "비밀번호가 일치하지 않습니다" 메시지가 표시된다
- **AND** 실패 횟수가 증가한다
```

## 테스트 코드 변환

GIVEN-WHEN-THEN은 테스트 코드로 직접 변환됩니다:

```typescript
describe('로그인', () => {
  it('성공적인 로그인', async () => {
    // GIVEN
    const user = await createUser({ email: 'test@test.com' });

    // WHEN
    const result = await login('test@test.com', 'password');

    // THEN
    expect(result.token).toBeDefined();
    expect(result.expiresAt).toBeDefined();
  });
});
```

## 모범 사례

1. **구체적으로 작성**
   - ❌ "사용자가 뭔가를 하면"
   - ✅ "사용자가 '저장' 버튼을 클릭하면"

2. **하나의 시나리오에 하나의 흐름**
   - 여러 분기가 있으면 별도 시나리오로 분리

3. **검증 가능하게 작성**
   - 결과가 측정/확인 가능해야 함

4. **비즈니스 언어 사용**
   - 기술 용어보다 도메인 용어 사용
