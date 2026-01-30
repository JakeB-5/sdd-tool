# 다중 스펙 변경 워크플로우

여러 관련 스펙을 함께 변경할 때의 워크플로우입니다.

## 언제 사용하나요?

- **Breaking Change**: 한 스펙 변경이 다른 스펙에 영향
- **기능 묶음**: 관련된 여러 스펙을 함께 개발
- **대규모 리팩토링**: 도메인 구조 변경

---

## 개요

```
번들 브랜치 생성 → 여러 스펙 작성 → 영향 분석 → 커밋 → PR → 리뷰 → 병합
```

---

## 단계별 가이드

### 1. 번들 브랜치 생성

```bash
git checkout main
git pull origin main
git checkout -b spec-bundle/payment-v2
```

**명명 규칙**: `spec-bundle/<설명적-이름>`

### 2. 관련 스펙 작성

```bash
# 여러 스펙 생성/수정
sdd new billing/payment-gateway-v2
sdd new billing/refund-policy-v2

# 기존 스펙 수정
# .sdd/specs/billing/checkout/spec.md 편집
# .sdd/specs/billing/subscription/spec.md 편집
```

### 3. 영향 분석

```bash
# 변경된 스펙의 영향 확인
sdd impact billing/payment-gateway-v2

# 전체 의존성 확인
sdd deps check

# 순환 의존성 검사
sdd deps check --cycles
```

**출력 예시**:
```
📊 영향 분석: billing/payment-gateway-v2

직접 영향:
  ├── billing/checkout (의존)
  ├── billing/subscription (의존)
  └── billing/invoice (참조)

간접 영향:
  └── order/order-complete (billing/checkout 통해)

⚠️  Breaking Change 가능성: 3개 스펙
```

### 4. 스펙별 커밋

각 스펙을 별도 커밋으로 분리합니다:

```bash
# 신규 스펙 커밋
git add .sdd/specs/billing/payment-gateway-v2/
git commit -m "spec(billing/payment-gateway-v2): add new payment gateway specification

새 PG 연동 명세:
- Stripe, Toss 지원
- 웹훅 처리 정의
- 에러 복구 시나리오"

# 수정 스펙 커밋
git add .sdd/specs/billing/checkout/
git commit -m "spec-update(billing/checkout): update for payment-gateway-v2

결제 흐름 변경:
- 새 PG 인터페이스 적용
- 결제 실패 처리 개선

Breaking-Spec: billing/invoice"

# 추가 스펙 커밋
git add .sdd/specs/billing/refund-policy-v2/
git commit -m "spec(billing/refund-policy-v2): add refund policy specification

환불 정책 명세:
- 자동 환불 조건
- 수동 검토 케이스
- 부분 환불 처리"
```

### 5. 최종 검증

```bash
# 전체 검증
sdd validate

# Constitution 준수 확인
sdd validate --constitution

# 의존성 최종 확인
sdd deps check
```

### 6. 푸시 & PR

```bash
git push -u origin spec-bundle/payment-v2

gh pr create \
  --title "spec-bundle: Payment System v2" \
  --body "$(cat <<EOF
## 개요
결제 시스템 전면 개편

## 변경 범위
### 신규
- billing/payment-gateway-v2: 새 PG 연동
- billing/refund-policy-v2: 환불 정책

### 수정
- billing/checkout: 결제 흐름 변경
- billing/subscription: 결제 주기 변경

### 영향
- billing/invoice: 인보이스 형식 변경 필요
- order/order-complete: 결제 확인 로직 변경 필요

## Breaking Changes
- checkout 스펙의 payment_method 필드 구조 변경
- subscription 스펙의 billing_cycle 열거형 추가

## 마이그레이션 가이드
docs/migration/payment-v2.md 참조

## 체크리스트
- [x] sdd validate 통과
- [x] 영향 분석 완료
- [x] Breaking Changes 문서화
- [ ] 영향받는 팀 리뷰
EOF
)"
```

### 7. 리뷰

번들 PR은 더 신중한 리뷰가 필요합니다:

- **영향받는 팀**: 각 도메인 담당자 리뷰
- **아키텍트**: 전체 구조 검토
- **Breaking Changes**: 마이그레이션 계획 확인

### 8. 병합 & 정리

```bash
# 병합 (squash 또는 merge commit)
gh pr merge --merge  # 커밋 이력 유지 권장

# 정리
git checkout main
git pull
git branch -d spec-bundle/payment-v2
```

---

## Breaking Change 처리

### 식별

```bash
# 영향 분석으로 식별
sdd impact billing/payment-gateway --code

# Footer에 명시
Breaking-Spec: billing/checkout, billing/invoice
```

### 문서화

```markdown
<!-- PR 본문에 포함 -->
## Breaking Changes

### billing/checkout
- `payment_method` 필드 구조 변경
  - 이전: `string`
  - 이후: `{ type: string, provider: string }`

### billing/subscription
- `billing_cycle` 열거형 추가
  - 새 값: `WEEKLY`, `BIWEEKLY`
```

### 마이그레이션 가이드

```bash
# 마이그레이션 문서 생성
mkdir -p docs/migration
```

```markdown
<!-- docs/migration/payment-v2.md -->
# Payment System v2 마이그레이션

## 변경 요약
...

## 마이그레이션 단계
1. payment-gateway-v2 인터페이스 구현
2. checkout 로직 업데이트
3. invoice 생성 로직 수정
4. 기존 데이터 마이그레이션

## 롤백 계획
...
```

---

## 모범 사례

### 번들 구성

- **관련 스펙만**: 논리적으로 연결된 스펙만 포함
- **적정 크기**: 3-7개 스펙 권장, 너무 크면 분리
- **명확한 범위**: PR 설명에 변경 범위 명시

### 커밋 전략

- **스펙별 커밋**: 각 스펙 변경을 별도 커밋
- **논리적 순서**: 의존성 순서대로 커밋
- **상세한 메시지**: Breaking Change 명시

### 리뷰 요청

- **조기 리뷰**: Draft PR로 먼저 피드백
- **담당자 지정**: 영향받는 도메인 오너 포함
- **충분한 시간**: 복잡한 변경은 여유 있게

---

## 관련 문서

- [단일 스펙 워크플로우](./workflow-single-spec.md)
- [Constitution 변경](./workflow-constitution.md)
- [커밋 컨벤션](./commit-convention.md)
