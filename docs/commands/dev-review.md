# /dev-review

구현된 코드가 스펙을 충족하는지 검증하는 개발 스킬입니다.

## 개요

`/dev-review`는 구현된 코드가 스펙을 충족하는지 검증하고 코드 품질, 타입 안전성, 에러 처리를 검토합니다.

## 사용법

```
/dev-review                       # 최근 변경 리뷰
/dev-review auth/login            # 특정 스펙 리뷰
/dev-review src/auth/login.ts     # 특정 파일 리뷰
```

## 검토 항목

1. **스펙 충족**: 모든 요구사항 구현 여부
2. **시나리오 커버리지**: GIVEN-WHEN-THEN 테스트 존재 여부
3. **코드 품질**: 가독성, 유지보수성
4. **타입 안전성**: TypeScript 타입 적절성
5. **에러 처리**: 예외 케이스 처리

## 출력 예시

```
User: /dev-review auth/login

Claude: 📋 코드 리뷰: auth/login

## 스펙 충족 검사

| 요구사항 | 상태 |
|----------|------|
| REQ-001: 이메일/비밀번호 로그인 | ✅ 충족 |
| REQ-002: JWT 토큰 발급 | ✅ 충족 |
| REQ-003: 로그인 실패 처리 | ⚠️ 부분 충족 |

## 시나리오 커버리지

| 시나리오 | 테스트 |
|----------|--------|
| 정상 로그인 | ✅ 있음 |
| 잘못된 비밀번호 | ✅ 있음 |
| 미등록 사용자 | ❌ 없음 |

## 개선 제안

1. **누락된 테스트 추가**
   - 미등록 사용자 시나리오 테스트 필요

2. **에러 처리 개선**
   ```typescript
   // 현재
   throw new Error('Login failed');

   // 권장
   throw new AuthenticationError('INVALID_CREDENTIALS');
   ```

3. **타입 개선**
   - `any` 타입 사용 제거 권장

## 점수: 85/100

✅ 대부분 충족
⚠️ 일부 개선 필요
```

## 관련 명령어

- [`/dev-implement`](/commands/dev-implement) - 스펙 구현
- [`/dev-test`](/commands/dev-test) - 테스트 실행
- [`/sdd.validate`](/commands/sdd-validate) - 스펙 검증
