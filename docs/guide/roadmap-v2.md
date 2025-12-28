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
│  Phase 1: 스펙 스코프 분리 ⭐⭐⭐              [신규 최우선] │
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

---

## Phase 0: 협업 기반 (Git 워크플로우)

> **상태**: 기존 유지, 내용 동일
> **문서**: [scaling-roadmap.md#phase-0](./scaling-roadmap.md#phase-0-협업-기반-git-워크플로우)

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

> **신규 추가 - 중규모 성공의 50%를 결정하는 핵심**

### 문제 정의

```
현재:
- 스펙 하나가 프로젝트 전체를 덮음
- 컨텍스트 폭발 (Claude가 전체를 기억 못함)
- 수정 시 영향 범위 불명확

결과:
- Claude가 "다 만들었다"고 하지만 빠진 게 있음
- 기존 코드 컨텍스트를 자동으로 이해 못함
- 사람이 "컨텍스트 큐레이터" 역할 강제
```

### 해결책: 도메인/기능 단위 스펙 분리

**디렉토리 구조 변경**:

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
```

### 구현 체크리스트

```
□ domains.yml 스키마 정의
□ domain.md 템플릿
□ sdd domain CLI 명령어
□ sdd new <domain>/<feature> 지원
□ sdd context 명령어 (컨텍스트 제한)
□ 도메인 간 의존성 검증
□ 슬래시 커맨드 업데이트
□ 기존 프로젝트 마이그레이션 가이드
```

### 우선순위

```
난이도: 중
영향도: ⭐⭐⭐ 최상 (중규모 성공의 50%)
선행조건: Phase 0
```

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
| **1** | 스펙 스코프 분리 | 중 | ⭐최상 | ✅ 필수 |
| **2** | 코드 컨텍스트 연결 | 중 | 높음 | ✅ 필수 |
| **3** | 태스크 그래프 (DAG) | 중 | 높음 | ✅ 필수 |
| **4** | 변경 기반 작업 유도 | 중 | 높음 | ✅ 필수 |
| **5** | 성능 최적화 | 중 | 중 | ⚠️ 조건부 |
| **6** | GitHub 연동 | 중 | 중 | ❌ 선택 |
| **6** | VSCode 확장 | 높음 | 높음 | ❌ 선택 |

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

### v2.0: 중규모 기반 (Phase 0-2)

```
□ Phase 0: Git 워크플로우
□ Phase 1: 스펙 스코프 분리 (도메인 시스템)
□ Phase 2: 코드 컨텍스트 연결
```

**목표**: 2-5명 팀에서 안정적 사용

### v2.5: 중규모 완성 (Phase 3-4)

```
□ Phase 3: 태스크 그래프 (DAG)
□ Phase 4: 변경 기반 작업 유도
```

**목표**: 5-10명 팀까지 확장

### v3.0: 선택적 확장 (Phase 5-6)

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
| roadmap-v2.md (본 문서) | 신규 | 고도화된 로드맵 |

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
✅ Phase 1: 스펙 스코프 분리 (중규모 성공의 50%)
✅ Phase 2-4: 기존 코드 연결 + 변경 관리
❌ 엔터프라이즈 기능 욕심 버리기
```

---

## 관련 문서

- [현재 한계점](./limitations.md)
- [스케일업 로드맵 (Phase 0 상세)](./scaling-roadmap.md)
- [엔터프라이즈 로드맵 (참고용)](./enterprise-roadmap.md)
