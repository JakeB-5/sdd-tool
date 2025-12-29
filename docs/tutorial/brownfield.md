# 브라운필드 프로젝트에 SDD 도입하기

기존 프로젝트에 SDD를 점진적으로 도입하는 튜토리얼입니다.

## 개요

브라운필드(Brownfield) 프로젝트는 이미 코드가 존재하는 프로젝트입니다. 역추출(Reverse Extraction)을 통해 기존 코드에서 스펙을 추출하고, 점진적으로 SDD를 도입할 수 있습니다.

## 시나리오

기존 Express API 프로젝트에 SDD를 도입해보겠습니다.

### 현재 구조

```
my-api/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── orderController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   └── orderService.js
│   ├── models/
│   │   ├── User.js
│   │   └── Order.js
│   └── utils/
│       └── validation.js
└── package.json
```

## Step 1: SDD 초기화

```bash
cd my-api
sdd init --brownfield
```

`--brownfield` 옵션은 기존 코드를 유지하면서 SDD 구조만 추가합니다.

## Step 2: 코드베이스 분석

### 빠른 스캔

```bash
sdd analyze
```

```
📊 프로젝트 분석 결과

파일: 12개
언어: JavaScript (100%)

추정 도메인:
  - auth (높음) - 2개 파일
  - user (높음) - 2개 파일
  - order (높음) - 2개 파일
  - core (중간) - 2개 파일

복잡도: B (양호)
```

### 도메인 제안

```bash
sdd analyze --suggest-domains
```

```
📁 도메인 제안

1. auth (신뢰도: 92%)
   경로: src/controllers/authController.js, src/services/authService.js
   이유: 네이밍 패턴, 관련 함수 밀집
   스펙 후보:
     - login
     - register
     - logout

2. user (신뢰도: 88%)
   경로: src/controllers/userController.js, src/services/userService.js
   스펙 후보:
     - get-user
     - update-user
     - delete-user

3. order (신뢰도: 85%)
   스펙 후보:
     - create-order
     - get-order
     - list-orders
```

## Step 3: 도메인 생성

분석 결과를 바탕으로 도메인을 생성합니다.

```bash
sdd domain create core --description "공통 유틸리티" --path "src/utils"
sdd domain create auth --description "인증" --path "src" --depends-on core
sdd domain create user --description "사용자 관리" --depends-on core --depends-on auth
sdd domain create order --description "주문 관리" --depends-on core --depends-on auth
```

## Step 4: 역추출 실행

### 상세 스캔

```bash
sdd reverse scan --depth deep
```

```
📊 스캔 결과

분석된 파일: 12개
발견된 심볼: 45개

스펙 후보: 12개
  높은 신뢰도 (>80%): 8개
  중간 신뢰도 (50-80%): 3개
  낮은 신뢰도 (<50%): 1개

스캔 결과 저장: .sdd/reverse/scan-result.json
```

### 스펙 추출

```bash
sdd reverse extract --min-confidence 70
```

```
📝 추출된 스펙: 11개

auth 도메인:
  ✓ login (신뢰도: 95%)
  ✓ register (신뢰도: 92%)
  ✓ logout (신뢰도: 88%)

user 도메인:
  ✓ get-user (신뢰도: 90%)
  ✓ update-user (신뢰도: 85%)
  ✓ delete-user (신뢰도: 82%)

order 도메인:
  ✓ create-order (신뢰도: 88%)
  ✓ get-order (신뢰도: 85%)
  ✓ list-orders (신뢰도: 80%)
  ✓ update-order (신뢰도: 75%)
  ✓ cancel-order (신뢰도: 72%)

draft 스펙 저장: .sdd/drafts/
```

## Step 5: 스펙 검토

### 대화형 검토

```bash
sdd reverse review
```

```
📋 스펙 검토: auth/login

이름: login
설명: 사용자 로그인 처리
신뢰도: 95%

추출된 시나리오:
  1. 유효한 자격증명으로 로그인 성공
  2. 잘못된 비밀번호로 로그인 실패
  3. 존재하지 않는 사용자

추출된 계약:
  입력: { email: string, password: string }
  출력: { token: string, user: User }

[a] 승인  [e] 편집  [s] 건너뛰기  [r] 거부  [q] 종료
> a

✓ auth/login 승인됨
```

### AI 보조 검토

```bash
sdd reverse review --ai-assist
```

```
📋 스펙 검토: auth/login (AI 보조)

AI 제안:
  💡 시나리오 추가 제안:
     - "계정 잠금 상태에서 로그인 시도"
     - "비활성화된 계정으로 로그인 시도"

  💡 계약 개선 제안:
     - 출력에 refreshToken 추가 권장

질문:
  ❓ 로그인 실패 시 최대 시도 횟수가 있나요?
  ❓ 세션 만료 시간은 어떻게 되나요?

[a] 승인  [e] 편집  [s] 건너뛰기  [r] 거부  [q] 종료
> e

편집 모드 진입...
```

### 편집 예시

```bash
# 시나리오 추가
> add scenario "계정 잠금 상태" \
    --given "5회 이상 실패한 계정" \
    --when "로그인 시도" \
    --then "계정 잠금 에러 반환"

# 계약 수정
> edit contract output --add "refreshToken: string"

# 저장
> save
```

## Step 6: 스펙 확정

### 승인된 스펙 확정

```bash
sdd reverse finalize --status approved
```

```
✅ 스펙 확정 완료

저장된 스펙: 11개
  .sdd/specs/auth/login.md
  .sdd/specs/auth/register.md
  .sdd/specs/auth/logout.md
  .sdd/specs/user/get-user.md
  ...

domains.yml 업데이트됨

다음 단계:
  sdd list              # 스펙 확인
  sdd validate          # 검증 실행
```

### 임시 파일 정리

```bash
sdd reverse cleanup
```

## Step 7: 검증 및 정리

```bash
sdd validate
```

```
✅ 검증 완료

스펙: 11개
도메인: 4개
의존성: 유효

경고: 2개
  ⚠ auth/login: 출력 타입 User가 정의되지 않음
  ⚠ order/create-order: 의존성 payment 누락 가능성

오류: 0개
```

경고 해결:

```bash
# User 타입 정의 스펙 추가
sdd new core/user-model

# 의존성 추가
sdd domain depends order --on payment
```

## Step 8: 점진적 개선

### 우선순위 결정

```bash
sdd status --priority
```

```
📊 우선순위 스펙

높음:
  ⚠ auth/login - 테스트 없음
  ⚠ order/create-order - 에러 처리 불완전

중간:
  📝 user/update-user - 검증 로직 분리 필요
  📝 order/list-orders - 페이지네이션 명세 없음

낮음:
  ✓ auth/logout - 양호
  ✓ user/get-user - 양호
```

### 점진적 개선 전략

1. **높은 우선순위**: 테스트 추가, 버그 수정
2. **중간 우선순위**: 리팩토링, 스펙 보강
3. **새 기능**: SDD 방식으로 처음부터 작성

## 진행 상황 추적

```bash
sdd status
```

```
📊 프로젝트 현황

스펙: 11개
  ✅ 구현됨 (레거시): 11개 (100%)
  🔄 테스트 추가 필요: 4개
  📝 스펙 보강 필요: 3개

도메인:
  core: 1/1 (100%)
  auth: 3/3 (100%)
  user: 3/3 (100%)
  order: 4/5 (80%)
```

## 다음 단계

1. 테스트 추가로 스펙 검증
2. 새 기능은 SDD 방식으로 개발
3. 점진적으로 레거시 코드 리팩토링

## 관련 문서

- [역추출 가이드](../guide/reverse-extraction.md)
- [도메인 시스템](../guide/domains.md)
- [대규모 프로젝트](../guide/large-projects.md)

## 요약

1. `sdd init --brownfield`로 초기화
2. `sdd analyze`로 코드베이스 분석
3. 도메인 구조 설계 및 생성
4. `sdd reverse scan/extract`로 스펙 추출
5. `sdd reverse review`로 검토 및 수정
6. `sdd reverse finalize`로 확정
7. 점진적으로 테스트 추가 및 개선
