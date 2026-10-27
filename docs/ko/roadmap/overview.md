# SDD Tool 로드맵 v2 (고도화)

> **문서 버전**: v2.0
> **작성일**: 2024-12-24
> **기존 문서**: scaling-roadmap.md, enterprise-roadmap.md 통합 및 재구성

---

## 도구의 본질 재정의

### sdd-tool이 **아닌** 것

```
❌ CI/CD 도구
❌ 코드 분석 엔진
❌ 프로젝트 관리 도구
❌ 엔터프라이즈 개발 플랫폼
```

### sdd-tool이 **맞는** 것

```
✅ Claude에게 "어떻게 생각하고, 어떤 순서로 개발하라"고 강제하는 프레임
✅ 바이브 코딩 방지용 사고 구조화 툴
✅ 사양 → 설계 → 태스크 → 코드 생성 파이프라인
✅ AI와 인간의 합의점을 문서화하는 도구
```

### 핵심 강점 (유지해야 할 것)

```
• 설계 품질 상승
• 초기 구조 안정화
• 생각 누락 방지
• 문서와 코드 동시 생성
• 개인/소규모 생산성 향상
```

---

## 현실적 목표 재설정

### 기존 목표 (과도함)

```
Phase 0-5: 중규모 (5-15명)
Phase 6-10: 엔터프라이즈 (15명+, 500개+ 스펙)
```

### 수정된 목표 (현실적)

```
Phase 0-2: 소규모 최적화 (1-5명) ← 현재 최강 영역 강화
Phase 3-5: 중규모 도달 (2-10명) ← 실질적 천장
Phase 6+: 선택적 확장 (조건부) ← 필요시에만
```

### 규모별 적합성 (냉정한 평가)

| 규모 | 적합도 | 전략 |
|------|--------|------|
| **1인 / 사이드** | ⭐⭐⭐⭐⭐ | 최강 영역, 더 강화 |
| **소규모 (2-5명)** | ⭐⭐⭐⭐⭐ | 핵심 타겟 |
| **중규모 (5-10명)** | ⭐⭐⭐⭐ | 도달 가능 목표 |
| **중대규모 (10-20명)** | ⭐⭐⭐ | 기능 단위로만 |
| **대규모 (20명+)** | ⭐⭐ | 보조 도구로만 |
| **엔터프라이즈** | ⭐ | 주력 도입 불가 |

---

## Phase 재구성

### 개요

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 0: 협업 기반 (Git 워크플로우)          [기존 유지]   │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: 스펙 스코프 분리 ⭐⭐⭐                           │
│    ├─ 1-G: Greenfield (수동 도메인 설정)      [신규]       │
│    └─ 1-R: Reverse Extraction (레거시)        [신규]       │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: 코드 컨텍스트 연결                   [신규]       │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: 태스크 그래프 (DAG)                  [신규]       │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: 변경 기반 작업 유도                  [신규]       │
├─────────────────────────────────────────────────────────────┤
│  Phase 5: 성능 최적화                          [기존 조정]  │
├─────────────────────────────────────────────────────────────┤
│  Phase 6+: 선택적 확장                         [기존 축소]  │
└─────────────────────────────────────────────────────────────┘
```

### 프로젝트 유형별 경로

```
Greenfield (신규 프로젝트):
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Phase 0 │───▶│Phase 1-G│───▶│ Phase 2 │───▶│Phase 3-4│
│   Git   │    │ 수동설정 │    │코드연결 │    │태스크DAG│
└─────────┘    └─────────┘    └─────────┘    └─────────┘

Brownfield (레거시 프로젝트):
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Phase 0 │───▶│Phase 1-R│───▶│ Phase 2 │───▶│Phase 3-4│
│   Git   │    │ 역추출  │    │코드연결 │    │태스크DAG│
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │
                    ▼
              AI 주도 초안 작성
              (sdd-reverse 스킬)
```

**핵심 인사이트**:
- Phase 1-G와 1-R은 **동일한 출력물**을 생성 (domains.yml, domain.md, spec.md)
- Phase 1-R은 코드에서 **자동 추출**하여 초안 생성
- Phase 2부터는 경로가 **합류** (동일한 프로세스)

---

## Phase 0: 협업 기반 (Git 워크플로우)

> **상태**: 기존 유지, 내용 동일
> **문서**: [scaling.md#phase-0](./scaling.md#phase-0-협업-기반-git-워크플로우)

### 요약

- 0.1 커밋 컨벤션 (spec, spec-update, constitution 타입)
- 0.2 브랜치 전략 (spec/domain/name 패턴)
- 0.3 스펙 변경 워크플로우
- 0.4 Git Hooks 자동화
- 0.5 .gitignore 및 Git 설정
- 0.6 CI 연동

### 우선순위

```
난이도: 낮음
영향도: 높음 (협업의 기반)
선행조건: 없음
```

---

## Phase 1: 스펙 스코프 분리 ⭐⭐⭐

> **중규모 성공의 50%를 결정하는 핵심**
> **두 가지 경로**: Greenfield(수동) vs Brownfield(역추출)

### 문제 정의

```
현재:
- 스펙 하나가 프로젝트 전체를 덮음
- 컨텍스트 폭발 (Claude가 전체를 기억 못함)
- 수정 시 영향 범위 불명확
- 레거시 프로젝트는 스펙 도입 장벽 높음

결과:
- Claude가 "다 만들었다"고 하지만 빠진 게 있음
- 기존 코드 컨텍스트를 자동으로 이해 못함
- 사람이 "컨텍스트 큐레이터" 역할 강제
- 레거시 프로젝트 SDD 도입 포기
```

### 공통 출력물 (1-G, 1-R 동일)

Phase 1의 두 경로 모두 **동일한 구조**를 생성합니다:

**디렉토리 구조**:

```
현재:
.sdd/
├── constitution.md
└── specs/
    └── <feature>/
        ├── spec.md
        ├── plan.md
        └── tasks.md

변경 후:
.sdd/
├── constitution.md
├── domains.yml              # 도메인 정의
└── specs/
    ├── core/                # 도메인
    │   ├── domain.md        # 도메인 개요
    │   └── data-model/      # 기능
    │       ├── spec.md
    │       └── ...
    ├── auth/                # 도메인
    │   ├── domain.md
    │   ├── user-login/
    │   ├── oauth/
    │   └── session/
    └── order/               # 도메인
        ├── domain.md
        ├── checkout/
        └── payment/
```

**도메인 정의 파일**:

```yaml
# .sdd/domains.yml
domains:
  core:
    name: "핵심 기능"
    description: "데이터 모델, 공통 유틸리티"
    owners: ["@core-team"]

  auth:
    name: "인증/인가"
    description: "사용자 인증, 권한 관리"
    owners: ["@security-team"]
    dependencies: [core]

  order:
    name: "주문/결제"
    description: "주문 처리, 결제 연동"
    owners: ["@commerce-team"]
    dependencies: [core, auth]

# 도메인 간 의존성 규칙
rules:
  - from: order
    to: auth
    allowed: true
  - from: auth
    to: order
    allowed: false  # 순환 방지
```

**도메인 개요 파일**:

```markdown
<!-- .sdd/specs/auth/domain.md -->
# Auth 도메인

## 개요
사용자 인증 및 권한 관리를 담당하는 도메인

## 범위
- 사용자 로그인/로그아웃
- OAuth 2.0 연동
- 세션 관리
- 권한 검증

## 의존성
- core: User 엔티티, 공통 유틸리티

## 공개 인터페이스
- AuthService.login()
- AuthService.logout()
- AuthService.verify()
- SessionManager.create()
- SessionManager.validate()
```

### CLI 변경

```bash
# 도메인 관리
sdd domain list                    # 도메인 목록
sdd domain show auth               # 도메인 상세
sdd domain create billing          # 새 도메인

# 도메인 기반 스펙 생성
sdd new auth/mfa-setup             # auth 도메인에 mfa-setup 스펙
sdd new order/refund               # order 도메인에 refund 스펙

# 도메인 기반 작업
sdd validate --domain auth         # auth 도메인만 검증
sdd status --domain order          # order 도메인 상태
sdd impact auth/user-login         # 도메인 내 영향도

# 컨텍스트 제한 (핵심!)
sdd context auth                   # Claude에 auth 도메인만 로드
sdd context auth order             # 복수 도메인 로드
sdd context --current              # 현재 로드된 컨텍스트 확인
```

### Claude 프롬프트 생성 변경

```markdown
현재:
"전체 스펙을 읽고 구현하세요"

변경 후:
"현재 컨텍스트: auth 도메인
- 도메인 개요: auth/domain.md
- 작업 대상: auth/user-login/spec.md
- 의존성: core 도메인 (읽기 전용)

다른 도메인은 무시하세요. auth 범위 내에서만 작업하세요."
```

### 효과

```
✅ Claude 컨텍스트 크기 제어 가능
✅ "현재 작업 범위" 명확화
✅ 팀별 독립 작업 가능
✅ 영향 범위 추적 용이
✅ 누락 가능성 대폭 감소
✅ 레거시 프로젝트 SDD 도입 가능 (1-R)
```

---

### Phase 1-G: Greenfield (수동 도메인 설정)

> **신규 프로젝트용 - 수동으로 도메인 구조 설계**

**대상**:
- 새로 시작하는 프로젝트
- 기존 코드 없음 또는 리팩토링

**워크플로우**:

```bash
# 1. 도메인 설계
sdd domain create core          # 핵심 도메인
sdd domain create auth          # 인증 도메인
sdd domain create order         # 주문 도메인

# 2. 도메인 의존성 설정
sdd domain link order --depends-on auth
sdd domain link auth --depends-on core

# 3. 스펙 작성
sdd new auth/user-login         # 수동 스펙 작성
sdd new auth/oauth-google
sdd new order/checkout
```

**구현 체크리스트 (1-G)**:

```
□ sdd domain create <name>
□ sdd domain link --depends-on
□ sdd new <domain>/<feature>
□ domains.yml 수동 편집 지원
□ domain.md 템플릿
```

**우선순위 (1-G)**:

```
난이도: 낮음
영향도: 높음
선행조건: Phase 0
```

---

### Phase 1-R: Reverse Extraction (역방향 스펙 추출)

> **레거시/브라운필드용 - 코드에서 스펙 자동 생성**
> **현재 방식: AI 주도.** 원래 계획했던 Serena MCP 기반 설계는 대체되었고 Serena 통합은 제거되었습니다. [역추출 가이드](../guide/reverse-extraction.md)를 참고하세요.

**대상**:
- 기존 코드베이스가 있는 프로젝트
- 스펙 문서 없이 운영 중인 레거시
- SDD 도입 장벽을 낮추고 싶은 팀

**워크플로우**:

```bash
# 1. 구조 스캔 (결정적: 파일, 라인, 언어, 제안 도메인)
sdd reverse scan --json

# 2. AI(/sdd.reverse)가 코드를 읽고 초안을
#    .sdd/.reverse-drafts/<도메인>/<기능>/spec.md 에 작성

# 3. 검증, 검토, 확정
sdd validate .sdd/.reverse-drafts
sdd reverse review --list
sdd reverse review <ref> --approve
sdd reverse finalize
```

**구현 체크리스트 (1-R)**:

```
[x] sdd reverse scan 명령어
[x] sdd reverse review (목록/조회/승인/거부)
[x] sdd reverse finalize
[x] AI 작성 초안 (sdd-reverse 스킬, /sdd.reverse)
```

**우선순위 (1-R)**:

```
난이도: 중
영향도: ⭐⭐⭐ 최상 (레거시 도입 장벽 해소)
선행조건: Phase 0
```

**상세 계획**: [역방향 스펙 추출 계획](./reverse-extraction.md)

---

### Phase 1 공통 구현

```
□ domains.yml 스키마 정의
□ domain.md 템플릿
□ sdd domain list/show 명령어
□ sdd context 명령어 (컨텍스트 제한)
□ 도메인 간 의존성 검증
□ 슬래시 커맨드 업데이트
```

### Phase 1 우선순위 요약

| 경로 | 대상 | 난이도 | 영향도 | 선행조건 |
|------|------|--------|--------|----------|
| **1-G** | Greenfield | 낮음 | 높음 | Phase 0 |
| **1-R** | Brownfield | 중 | ⭐최상 | Phase 0 |

**권장 구현 순서**:
1. Phase 1 공통 (domains.yml, domain.md) - **먼저**
2. Phase 1-G (수동 도메인 설정) - **그다음** (간단)
3. Phase 1-R (역추출) - **마지막**

---

## Phase 2: 코드 컨텍스트 연결

> **신규 추가 - 기존 코드 누락 문제 해결**

### 문제 정의

```
현재:
- 스펙만 있고 기존 코드와의 연결 없음
- Claude가 "어떤 파일을 수정해야 하는지" 모름
- 유지보수 시 변경 대상 누락

결과:
- "기존 코드에 이미 있는데 새로 만듦"
- "수정해야 할 파일을 빠뜨림"
- 사람이 직접 파일 목록을 알려줘야 함
```

### 해결책: 스펙 ↔ 코드 링크 메타데이터

**스펙 파일에 코드 링크 추가**:

```yaml
# spec.md frontmatter
---
id: auth/user-login
status: approved
code_links:
  implements:
    - src/auth/AuthService.ts
    - src/auth/LoginController.ts
  tests:
    - tests/auth/login.test.ts
  related:
    - src/core/User.ts
    - src/session/SessionManager.ts
---
```

**코드 컨텍스트 인덱스** (가벼운 수준):

```json
// .sdd/code-index.json (자동 생성)
{
  "files": {
    "src/auth/AuthService.ts": {
      "type": "service",
      "exports": ["AuthService", "login", "logout", "verify"],
      "specs": ["auth/user-login", "auth/oauth"]
    },
    "src/auth/LoginController.ts": {
      "type": "controller",
      "exports": ["LoginController"],
      "specs": ["auth/user-login"]
    }
  },
  "modules": {
    "auth": ["AuthService", "LoginController", "TokenRepo"],
    "order": ["OrderService", "PaymentAdapter"]
  }
}
```

### CLI 변경

```bash
# 코드 인덱스 관리
sdd code index                     # 코드 인덱스 생성/갱신
sdd code index --watch             # 변경 감지 자동 갱신
sdd code show auth/user-login      # 스펙의 연결된 코드 표시

# 링크 관리
sdd link auth/user-login src/auth/AuthService.ts
sdd unlink auth/user-login src/old/OldAuth.ts

# 영향도 분석 (코드 포함)
sdd impact auth/user-login --code  # 코드 파일까지 영향도 분석
```

**Claude 프롬프트에 코드 컨텍스트 포함**:

```markdown
## 현재 작업: auth/user-login 수정

### 수정 대상 파일
- src/auth/AuthService.ts (implements)
- src/auth/LoginController.ts (implements)

### 관련 파일 (참조만)
- src/core/User.ts
- src/session/SessionManager.ts

### 기존 코드 시그니처
AuthService:
- login(email: string, password: string): Promise<Session>
- logout(sessionId: string): Promise<void>
- verify(token: string): Promise<User>

이 파일들을 수정하세요. 다른 파일은 건드리지 마세요.
```

### 구현 체크리스트

```
□ code_links frontmatter 스키마
□ sdd code index 명령어
□ 코드 인덱스 자동 생성 (AST 파싱)
□ sdd link/unlink 명령어
□ sdd impact --code 확장
□ Claude 프롬프트에 코드 컨텍스트 삽입
□ 주석 기반 역방향 링크 (@spec auth/user-login)
```

### 우선순위

```
난이도: 중
영향도: 높음 (유지보수 현실화)
선행조건: Phase 1
```

---

## Phase 3: 태스크 그래프 (DAG)

> **신규 추가 - 선형 태스크 → 의존성 그래프**

### 문제 정의

```
현재:
- tasks.md가 선형 체크리스트
- "1번 끝나면 2번, 2번 끝나면 3번"

문제:
- 병렬 작업 불가능
- 팀원 간 작업 분배 어려움
- Claude에게 "지금 뭐부터 할지" 불명확
```

### 해결책: DAG 기반 태스크 관리

**tasks.md 형식 변경**:

```yaml
# tasks.md
tasks:
  - id: AUTH-01
    title: "User 엔티티 정의"
    depends_on: []
    assignee: "@alice"
    status: done

  - id: AUTH-02
    title: "AuthService 인터페이스"
    depends_on: [AUTH-01]
    assignee: "@bob"
    status: in_progress

  - id: AUTH-03
    title: "LoginController 구현"
    depends_on: [AUTH-02]
    status: pending

  - id: AUTH-04
    title: "OAuth 연동"
    depends_on: [AUTH-02]  # AUTH-03과 병렬 가능!
    status: pending

  - id: AUTH-05
    title: "통합 테스트"
    depends_on: [AUTH-03, AUTH-04]  # 둘 다 끝나야 시작
    status: blocked
```

**시각화**:

```
AUTH-01 (User 엔티티)
    │
    ▼
AUTH-02 (AuthService)
    │
    ├────────────┐
    ▼            ▼
AUTH-03       AUTH-04
(Controller)  (OAuth)
    │            │
    └─────┬──────┘
          ▼
      AUTH-05
    (통합 테스트)
```

### CLI 변경

```bash
# 태스크 상태
sdd tasks auth/user-login          # 태스크 목록 (그래프 표시)
sdd tasks auth/user-login --ready  # 지금 시작 가능한 태스크
sdd tasks auth/user-login --blocked # 블록된 태스크

# 태스크 진행
sdd task start AUTH-03             # 태스크 시작
sdd task done AUTH-03              # 태스크 완료
sdd task block AUTH-05 "AUTH-04 대기 중"

# 그래프 시각화
sdd tasks auth/user-login --graph  # Mermaid 출력
sdd tasks auth/user-login --visual # 브라우저에서 보기
```

**Claude 프롬프트 개선**:

```markdown
## 현재 실행 가능한 태스크

다음 태스크 중 하나를 선택하여 구현하세요:

1. AUTH-03: LoginController 구현
   - 선행 완료: AUTH-02 ✅
   - 예상 파일: src/auth/LoginController.ts

2. AUTH-04: OAuth 연동
   - 선행 완료: AUTH-02 ✅
   - 예상 파일: src/auth/OAuthProvider.ts

## 블록된 태스크 (아직 안 됨)
- AUTH-05: 통합 테스트 (AUTH-03, AUTH-04 완료 필요)
```

### 구현 체크리스트

```
□ tasks.yaml 스키마 (DAG 구조)
□ 의존성 검증 (순환 감지)
□ sdd tasks --ready 명령어
□ sdd task start/done/block
□ Mermaid 그래프 출력
□ 브라우저 시각화
□ Claude 프롬프트에 실행 가능 태스크 강조
```

### 우선순위

```
난이도: 중
영향도: 높음 (팀 병렬 작업)
선행조건: Phase 1
```

---

## Phase 4: 변경 기반 작업 유도

> **신규 추가 - 전체 재생성 ❌, 변경분만 처리 ⭕**

### 문제 정의

```
현재:
- 스펙 변경 시 "전체 다시 검토"
- Claude가 변경되지 않은 부분도 재생성 시도

문제:
- 불필요한 토큰 소비
- 기존 코드 덮어쓰기 위험
- "뭐가 바뀌었는지" 파악 어려움
```

### 해결책: Spec Diff 기반 작업 유도

**스펙 변경 감지**:

```bash
sdd diff auth/user-login           # 마지막 커밋 대비 변경
sdd diff auth/user-login --staged  # 스테이징 대비 변경
```

**변경분 출력 예시**:

```diff
## Requirements

- REQ-001: Password must be 8 chars
+ REQ-001: Password must be 12 chars (MODIFIED)

+ REQ-004: Support biometric login (ADDED)

- REQ-003: Remember me checkbox (REMOVED)
```

**자동 태스크 생성**:

```bash
sdd diff auth/user-login --tasks   # 변경분 기반 태스크 생성
```

```yaml
# 자동 생성된 태스크
tasks:
  - id: CHANGE-01
    type: modify
    target: REQ-001
    description: "비밀번호 길이 8 → 12로 변경"
    affected_code:
      - src/auth/validators/password.ts

  - id: CHANGE-02
    type: add
    target: REQ-004
    description: "생체 인증 로그인 추가"

  - id: CHANGE-03
    type: remove
    target: REQ-003
    description: "Remember me 기능 제거"
    affected_code:
      - src/auth/LoginController.ts
      - src/auth/components/RememberMe.tsx
```

**Claude 프롬프트**:

```markdown
## 스펙 변경 사항 (이것만 처리하세요)

### 수정됨: REQ-001
변경 전: Password must be 8 chars
변경 후: Password must be 12 chars

영향 파일: src/auth/validators/password.ts
→ 이 파일의 PASSWORD_MIN_LENGTH를 12로 변경하세요.

### 추가됨: REQ-004
새 요구사항: Support biometric login
→ 새 파일 생성이 필요합니다.

### 제거됨: REQ-003
제거: Remember me checkbox
영향 파일: src/auth/LoginController.ts
→ rememberMe 관련 코드를 제거하세요.

⚠️ 위 변경 사항 외에는 기존 코드를 수정하지 마세요.
```

### 구현 체크리스트

```
□ sdd diff 명령어 (스펙 diff)
□ 변경 타입 분류 (ADDED/MODIFIED/REMOVED)
□ sdd diff --tasks (자동 태스크 생성)
□ 영향받는 코드 자동 연결 (Phase 2 연동)
□ Claude 프롬프트에 변경분만 강조
□ "변경 없는 부분 건드리지 마" 강제
```

### 우선순위

```
난이도: 중
영향도: 높음 (유지보수 핵심)
선행조건: Phase 2
```

---

## Phase 5: 성능 최적화

> **기존 Phase 1 조정 - 우선순위 하향**

### 변경 사항

```
기존: Phase 1 (최우선)
변경: Phase 5 (Phase 1-4 이후)

이유:
- 스펙 100개 미만에서는 성능 문제 미미
- 스코프 분리(Phase 1)가 성능보다 중요
- 중규모에서도 인덱싱 없이 충분히 동작
```

### 포함 내용 (축소)

```
5.1 인덱스 캐시 (선택적)
    - .sdd/index.json
    - 스펙 100개+ 시에만 필요

5.2 검색 최적화 (선택적)
    - 전문 검색
    - 쿼리 DSL
```

### 우선순위

```
난이도: 중
영향도: 중 (100개+ 스펙에서만 유의미)
선행조건: Phase 1-4
```

---

## Phase 6+: 선택적 확장 (대폭 축소)

> **기존 Phase 2-10 재평가**

### 현실적 판단

```
기존 계획:
- 도메인 분리 → Phase 1로 이동 (필수)
- 리뷰 워크플로우 → 삭제 (Git PR로 충분)
- 외부 연동 → 축소 (GitHub만)
- 대시보드 → 삭제 (오버엔지니어링)
- 서버 기반 → 삭제 (범위 초과)
- RBAC → 삭제 (범위 초과)
- 감사 로그 → 삭제 (범위 초과)
```

### 남는 것 (선택적)

```
6.1 GitHub Issues 연동 (선택)
    - 스펙 → 이슈 동기화
    - 간단한 수준만

6.2 VSCode 확장 (선택)
    - 스펙 미리보기
    - @spec 자동완성

6.3 멀티 에이전트 (미래)
    - Spec Agent, Architect Agent 분리
    - 대규모 필수지만, 현재 범위 초과
```

### 삭제/보류된 것

```
❌ SDD Server (플랫폼화 필요 = 새 제품)
❌ PostgreSQL/Elasticsearch (오버엔지니어링)
❌ RBAC/감사 로그 (엔터프라이즈 = 범위 초과)
❌ 실시간 협업 (Git으로 충분)
❌ 웹 대시보드 (터미널로 충분)
```

---

## 우선순위 최종 정리

| Phase | 기능 | 난이도 | 영향도 | 필수 여부 |
|-------|------|--------|--------|-----------|
| **0** | Git 워크플로우 | 낮음 | 높음 | ✅ 필수 |
| **1 공통** | 도메인 스키마 | 낮음 | 높음 | ✅ 필수 |
| **1-G** | Greenfield (수동) | 낮음 | 높음 | ✅ 필수 |
| **1-R** | Brownfield (역추출) | 중 | ⭐최상 | ⚠️ 조건부 |
| **2** | 코드 컨텍스트 연결 | 중 | 높음 | ✅ 필수 |
| **3** | 태스크 그래프 (DAG) | 중 | 높음 | ✅ 필수 |
| **4** | 변경 기반 작업 유도 | 중 | 높음 | ✅ 필수 |
| **5** | 성능 최적화 | 중 | 중 | ⚠️ 조건부 |
| **6** | GitHub 연동 | 중 | 중 | ❌ 선택 |
| **6** | VSCode 확장 | 높음 | 높음 | ❌ 선택 |

### 의존성 그래프

```
Phase 0 (Git)
    │
    ├───────────────────────┐
    ▼                       ▼
Phase 1 공통 ◄───────────────┘
(domains.yml, domain.md)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 1-G          Phase 1-R
(수동 설정)        (역추출)
    │                  │
    └────────┬─────────┘
             ▼
         Phase 2 ◄──────── (합류 지점)
    (코드 컨텍스트 연결)
             │
             ▼
         Phase 3
      (태스크 DAG)
             │
             ▼
         Phase 4
    (변경 기반 작업)
             │
    ┌────────┴────────┐
    ▼                 ▼
Phase 5            Phase 6
(성능, 조건부)     (확장, 선택)
```

---

## 마일스톤

### v1.x: 소규모 최적화 (현재)

```
✅ 기본 CLI
✅ 스펙 검증 (RFC 2119, GIVEN-WHEN-THEN)
✅ Constitution 시스템
✅ 영향도 분석 (기본)
✅ 내보내기 (HTML/JSON/MD)
```

### v2.0: 중규모 기반 (Phase 0 + 1)

```
□ Phase 0: Git 워크플로우
□ Phase 1 공통: domains.yml, domain.md 스키마
□ Phase 1-G: Greenfield 도메인 설정
```

**목표**: 신규 프로젝트에서 도메인 단위 스펙 관리

### v2.1: 레거시 도입 경로 (Phase 1-R)

```
□ Phase 1-R: 역방향 스펙 추출
  □ sdd reverse scan/review/finalize + AI 작성 초안
  □ 검토 워크플로우
```

**목표**: 레거시 프로젝트 SDD 도입 장벽 해소

### v2.5: 유지보수 강화 (Phase 2 + 3)

```
□ Phase 2: 코드 컨텍스트 연결
  □ spec ↔ code 링크
  □ sdd code index
□ Phase 3: 태스크 그래프 (DAG)
  □ 의존성 기반 태스크
  □ 병렬 작업 지원
```

**목표**: 2-5명 팀 안정적 운영

### v3.0: 중규모 완성 (Phase 4)

```
□ Phase 4: 변경 기반 작업 유도
  □ sdd diff (스펙 변경 감지)
  □ 변경분 → 자동 태스크
```

**목표**: 5-10명 팀까지 확장

### v3.5: 선택적 확장 (Phase 5-6)

```
□ Phase 5: 성능 최적화 (조건부)
□ Phase 6: GitHub 연동, VSCode 확장 (선택)
```

**목표**: 사용성 개선 및 생태계 확장

---

## 기존 문서와의 관계

| 기존 문서 | 상태 | 비고 |
|-----------|------|------|
| scaling-roadmap.md | 유지 | Phase 0 상세 내용 참조 |
| enterprise-roadmap.md | 보류 | 범위 초과, 참고용으로만 |
| limitations.md | 유지 | 현실적 한계 명시 |
| reverse-spec-plan.md | 신규 | Phase 1-R 상세 계획 |
| roadmap-v2.md (본 문서) | 신규 | 고도화된 로드맵 (통합) |

---

## 핵심 메시지

### 이 도구의 올바른 위치

```
"작지만 똑똑한 메스"
"엔터프라이즈를 베는 전기톱은 아님"
```

### 현실적 목표

```
소규모~중규모 신규 개발용으로 최강의 도구
범용 대형 프로젝트 프레임으로는 한계
```

### 집중할 것

```
✅ Phase 1-G: 도메인 분리 (Greenfield 기반)
✅ Phase 1-R: 역방향 추출 (Brownfield 도입 장벽 해소)
✅ Phase 2-4: 기존 코드 연결 + 변경 관리
❌ 엔터프라이즈 기능 욕심 버리기
```

---

## 관련 문서

- [현재 한계점](./current-limits.md)
- [스케일업 로드맵 (Phase 0 상세)](./scaling.md)
- [역방향 스펙 추출 계획 (Phase 1-R 상세)](./reverse-extraction.md)
- [엔터프라이즈 로드맵 (참고용)](./enterprise.md)
