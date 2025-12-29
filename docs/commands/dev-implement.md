# /dev-implement

스펙 기반 TDD 구현을 수행하는 개발 스킬입니다.

## 개요

`/dev-implement`는 `.sdd/specs/`의 스펙 문서를 읽고 TDD 방식으로 TypeScript 코드를 구현합니다. GIVEN-WHEN-THEN 시나리오를 테스트로 변환하고 코드를 작성합니다.

## 사용법

```
/dev-implement                    # 다음 구현할 스펙 자동 선택
/dev-implement auth/login         # 특정 스펙 구현
/dev-implement --domain auth      # 특정 도메인 스펙 구현
```

## 워크플로우

1. **스펙 로드**: 지정된 스펙 문서 읽기
2. **테스트 생성**: GIVEN-WHEN-THEN을 Vitest 테스트로 변환
3. **코드 구현**: 테스트를 통과하는 코드 작성
4. **리팩토링**: 코드 품질 개선
5. **검증**: 테스트 실행 및 확인

## 예시

```
User: /dev-implement auth/login

Claude: 📋 스펙 로드: auth/login

## 사용자 로그인

### 시나리오 1: 정상 로그인
GIVEN 유효한 이메일과 비밀번호
WHEN 로그인 요청
THEN 세션 토큰 반환

### 시나리오 2: 잘못된 비밀번호
GIVEN 유효한 이메일
AND 잘못된 비밀번호
WHEN 로그인 요청
THEN 인증 오류 반환

---

🧪 테스트 생성 중...

// tests/auth/login.test.ts
describe('로그인', () => {
  it('유효한 자격증명으로 로그인하면 세션 토큰을 반환한다', async () => {
    // Arrange
    const email = 'user@example.com';
    const password = 'ValidPass123';

    // Act
    const result = await login(email, password);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.token).toBeDefined();
  });
});

---

💻 구현 중...

// src/auth/login.ts
export async function login(
  email: string,
  password: string
): Promise<Result<Session, AuthError>> {
  // 구현...
}

---

✅ 테스트 통과: 2/2
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--dry-run` | 실제 파일 생성 없이 미리보기 |
| `--test-only` | 테스트만 생성 |
| `--skip-tests` | 테스트 건너뛰고 구현만 |

## 관련 명령어

- [`/dev-next`](/commands/dev-next) - 다음 구현할 스펙 추천
- [`/dev-test`](/commands/dev-test) - 테스트 실행
- [`/dev-review`](/commands/dev-review) - 코드 리뷰
