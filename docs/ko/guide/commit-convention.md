# 커밋 컨벤션

SDD 프로젝트에서 사용하는 Git 커밋 메시지 규칙입니다.

## 기본 형식

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- **type**: 커밋 유형 (필수)
- **scope**: 영향 범위 (선택, 하지만 스펙 커밋에선 권장)
- **subject**: 간결한 설명, 50자 이내 (필수)
- **body**: 상세 설명, 72자 줄바꿈 (선택)
- **footer**: 참조, 영향 정보 (선택)

---

## 스펙 커밋 타입

SDD 워크플로우에서 사용하는 전용 커밋 타입입니다.

| 타입 | 설명 | 예시 |
|------|------|------|
| `spec` | 스펙 신규 생성 | `spec(auth): add user-login specification` |
| `spec-update` | 스펙 내용 수정 | `spec-update(auth): add MFA requirements` |
| `spec-status` | 스펙 상태 변경 | `spec-status(auth): user-login draft → review` |
| `plan` | 구현 계획 추가/수정 | `plan(auth): add implementation plan` |
| `tasks` | 작업 분해 추가/수정 | `tasks(auth): break down into 5 tasks` |
| `constitution` | Constitution 변경 | `constitution: add security principles (v1.1)` |
| `sdd-config` | SDD 설정 변경 | `sdd-config: add billing domain` |

### 일반 커밋 타입

스펙 외 코드/문서 변경에는 Conventional Commits를 따릅니다.

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷팅 |
| `refactor` | 리팩토링 |
| `perf` | 성능 개선 |
| `test` | 테스트 |
| `build` | 빌드 시스템 / 의존성 |
| `ci` | CI 설정 |
| `chore` | 기타 작업 |
| `revert` | 커밋 되돌리기 |

---

## 스코프 규칙

스코프는 영향받는 도메인/스펙을 명시합니다.

### 기본 패턴

```bash
# 도메인 전체
spec(auth): ...

# 특정 스펙
spec(auth/user-login): ...

# 다중 도메인
spec(auth,billing): ...

# 전체 영향
spec(*): ...
```

### 예시

```bash
# 새 스펙 생성
spec(auth/user-login): add user login specification

# 스펙 수정
spec-update(auth/user-login): add OAuth requirements

# 상태 변경
spec-status(billing/subscription): draft → approved

# 구현 계획
plan(auth/user-login): add implementation plan with 3 phases

# 작업 분해
tasks(auth/user-login): break down into 8 implementation tasks

# Constitution (스코프 없음)
constitution: add API versioning principle (v1.2.0)
```

---

## Footer 활용

Footer는 추가 메타데이터를 기록합니다.

### 지원 키워드

| 키워드 | 용도 | 예시 |
|--------|------|------|
| `Refs` | 이슈 참조 | `Refs: #123, #456` |
| `Breaking-Spec` | 영향받는 스펙 | `Breaking-Spec: billing/checkout` |
| `Depends-On` | 의존 스펙 | `Depends-On: auth/user-login` |
| `Reviewed-By` | 리뷰어 | `Reviewed-By: @alice` |

### 전체 예시

```
spec(billing/subscription): add subscription management specification

구독 관리 기능 명세:
- 월간/연간 플랜 정의
- 업그레이드/다운그레이드 규칙
- 프로모션 코드 처리
- 자동 갱신 정책

Refs: #123
Depends-On: auth/user-login, billing/payment-gateway
Breaking-Spec: billing/checkout
```

---

## 커밋 메시지 템플릿

프로젝트에서 `.gitmessage` 템플릿을 사용할 수 있습니다.

### 설정 방법

```bash
# SDD CLI로 설정
sdd git template install

# 또는 수동 설정
git config commit.template .gitmessage
```

### 템플릿 내용

```
# <type>(<scope>): <subject>
# |<----  50자 이내로 작성하세요  ---->|
#
# 스펙 타입: spec, spec-update, spec-status, plan, tasks, constitution, sdd-config
# 일반 타입: feat, fix, docs, style, refactor, test, chore
#
# 스코프 예시:
#   spec(auth): ...              - 도메인 전체
#   spec(auth/user-login): ...   - 특정 스펙
#   spec(auth,billing): ...      - 다중 도메인
#   constitution: ...            - 스코프 없음

# 본문 (선택사항, 72자 줄바꿈)

# Footer (선택사항)
# Refs: #이슈번호
# Breaking-Spec: 영향받는-스펙
# Depends-On: 의존-스펙
# Reviewed-By: @리뷰어
```

---

## 검증

커밋 메시지는 `commit-msg` Git 훅이 자동 검증합니다.

### 검증 규칙

훅은 메시지의 **첫 줄**을 검사합니다(빈 줄과 `#` 주석 줄은 건너뜀):

1. **타입 필수**: `<type>(<scope>): <message>` 또는 `<type>: <message>`. `<type>`은 스펙 타입
   (`spec`, `spec-update`, `spec-status`, `plan`, `tasks`, `constitution`, `sdd-config`) 또는 Conventional Commits 타입
   (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`) 중 하나
2. **스코프**: 선택. 괄호 안에 비어 있지 않은 텍스트면 됩니다(위의 소문자/슬래시 형식은 관례일 뿐 강제되지 않음)
3. **머지/리버트 메시지**: `Merge `나 `Revert `로 시작하는 메시지는 그대로 허용

제목 길이(50자)와 본문 줄바꿈(72자)은 스타일 가이드이며 훅이 강제하지 않습니다. 형식이 맞지 않으면 종료 코드 1로
거부됩니다.

### 설정 방법

```bash
# Git Hooks 설치
sdd git hooks install
```

### 검증 실패 예시

```
❌ 커밋 메시지 형식 오류

올바른 형식:
  스펙 커밋: spec(<scope>): <message>
  일반 커밋: feat(<scope>): <message>

스펙 타입: spec, spec-update, spec-status, plan, tasks, constitution, sdd-config
일반 타입: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

자세한 내용: https://jakeb-5.github.io/sdd-tool/ko/guide/commit-convention
```

---

## 모범 사례

### 좋은 예

```bash
# 명확한 의도
spec(auth/mfa): add multi-factor authentication specification

# 적절한 스코프
spec-update(billing/subscription): add annual plan discount rules

# 상세한 본문
spec(order/checkout): add checkout flow specification

주문 체크아웃 프로세스 정의:
- 장바구니 → 배송지 → 결제 → 완료 흐름
- 각 단계별 검증 규칙
- 에러 처리 시나리오

Depends-On: auth/user-login, billing/payment-gateway
```

### 피해야 할 예

```bash
# ❌ 모호한 메시지
spec: update

# ⚠️ 스코프 누락 (훅은 허용하지만 스펙 커밋에는 스코프를 권장)
spec: add login feature

# ❌ 너무 긴 제목
spec(auth): add user login with email password oauth google github apple sso saml

# ❌ 한글 타입 (타입은 영문)
스펙(auth): 로그인 추가
```

---

## 관련 문서

- [브랜치 전략](./branch-strategy.md)
- [단일 스펙 워크플로우](./workflow-single-spec.md)
- [Git Hooks 설정](/cli/git)
