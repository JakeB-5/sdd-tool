# 스케일업 로드맵

SDD Tool을 중규모 SaaS (5-15명, 50-150개 스펙)로 확장하기 위한 기능 로드맵입니다.

## 목표

- 스펙 150개 이상에서도 원활한 성능
- 멀티팀 독립 운영 + 전역 일관성
- 체계적인 리뷰/승인 워크플로우
- 외부 도구와의 연동

---

## Phase 1: 성능 최적화

### 1.1 인덱스 캐시 시스템

**문제**: 매번 전체 스펙 파싱으로 인한 성능 저하

**해결책**: `.sdd/index.json` 캐시 도입

```typescript
// src/core/index/schema.ts
interface SpecIndex {
  version: string;           // 인덱스 스키마 버전
  generated: string;         // 생성 시각
  checksum: string;          // 전체 무결성 해시

  specs: {
    [id: string]: {
      path: string;          // 파일 경로
      hash: string;          // 파일 해시 (변경 감지)
      title: string;
      status: SpecStatus;
      phase: number;
      domain?: string;
      dependencies: string[];
      keywords: string[];    // 전문 검색용
      updated: string;
    }
  };

  graph: {
    edges: [string, string][];  // [from, to] 의존성
    reverse: {                   // 역방향 (영향 분석용)
      [id: string]: string[]
    };
    cycles: string[][];         // 순환 의존성 캐시
  };

  stats: {
    total: number;
    byStatus: Record<SpecStatus, number>;
    byPhase: Record<number, number>;
    byDomain: Record<string, number>;
  };
}
```

**CLI 변경**:

```bash
sdd index rebuild    # 인덱스 재생성
sdd index status     # 인덱스 상태 확인
sdd index verify     # 무결성 검증
```

**자동 갱신 전략**:

```typescript
// 변경 감지 및 부분 갱신
async function updateIndex(changedFiles: string[]) {
  const index = await loadIndex();

  for (const file of changedFiles) {
    const hash = await computeHash(file);
    if (index.specs[id]?.hash !== hash) {
      // 해당 스펙만 재파싱
      index.specs[id] = await parseSpec(file);
    }
  }

  // 그래프 재계산 (변경된 부분만)
  rebuildAffectedGraph(index, changedFiles);

  await saveIndex(index);
}
```

**예상 효과**:
- 검색 속도: O(n) → O(1)
- validate 시간: 10초 → 1초 미만
- impact 분석: 즉각적

---

### 1.2 인터랙티브 의존성 그래프

**현재**: 텍스트 기반 Mermaid 출력

**개선**: 브라우저 기반 인터랙티브 그래프

```bash
sdd graph                    # 브라우저에서 열기
sdd graph --domain auth      # 도메인 필터
sdd graph --focus user-auth  # 특정 스펙 중심
sdd graph --export svg       # 이미지 내보내기
```

**기술 스택**:
- D3.js 또는 Cytoscape.js
- 로컬 HTML 파일 생성 후 브라우저 오픈
- 줌/팬/필터/검색 지원

**UI 기능**:
- 노드 클릭: 스펙 상세 정보
- 엣지 하이라이트: 의존성 경로
- 색상 코딩: 상태별, Phase별, 도메인별
- 검색: 실시간 노드 필터링

---

## Phase 2: 도메인 분리

### 2.1 멀티 Constitution 구조

**현재**:
```
.sdd/
├── constitution.md
└── specs/
```

**개선**:
```
.sdd/
├── constitution.md           # 전역 원칙 (필수 준수)
├── config.yml                # 도메인 설정
└── domains/
    ├── auth/
    │   ├── constitution.md   # 도메인 원칙 (전역 + 확장)
    │   └── specs/
    ├── billing/
    │   ├── constitution.md
    │   └── specs/
    └── core/
        └── specs/            # constitution 없으면 전역만 적용
```

**설정 파일**:

```yaml
# .sdd/config.yml
version: "1.0"

domains:
  auth:
    name: "인증/인가"
    owners: ["@security-team"]
    constitution: domains/auth/constitution.md

  billing:
    name: "결제/구독"
    owners: ["@billing-team"]
    constitution: domains/billing/constitution.md

  core:
    name: "핵심 기능"
    owners: ["@core-team"]

# 도메인 간 의존성 규칙
dependencies:
  rules:
    - from: billing
      to: auth
      allowed: true
    - from: auth
      to: billing
      allowed: false  # 순환 방지
```

**CLI 변경**:

```bash
# 도메인 지정 스펙 생성
sdd new auth/login-flow
sdd new billing/subscription-model

# 도메인별 작업
sdd validate --domain auth
sdd status --domain billing
sdd list --domain core

# 전체 현황
sdd status --by-domain
```

**Constitution 상속**:

```markdown
<!-- domains/auth/constitution.md -->
# Auth 도메인 Constitution

상위: ../constitution.md (자동 상속)

## 추가 원칙

### 보안 요구사항
- 모든 인증 스펙은 OWASP 가이드라인을 MUST 준수
- 세션 관리 스펙은 만료 정책을 MUST 명시
```

---

### 2.2 자동 의존성 감지

**현재**: 수동 `dependencies` 필드

**개선**: 내용 기반 자동 감지 + 수동 오버라이드

```typescript
// src/core/dependency/detector.ts
interface DependencyDetector {
  // 패턴 기반 감지
  patterns: [
    // 명시적 참조
    /depends on [`']([a-z-]+)[`']/gi,
    /requires [`']([a-z-]+)[`']/gi,
    /see [`']([a-z-]+)[`'] spec/gi,

    // 요구사항 참조
    /REQ-([A-Z]+-\d+)/g,

    // 링크 참조
    /\[.*?\]\(\.\.\/([a-z-]+)\//gi,
  ];

  // 키워드 매칭
  keywords: {
    'user-auth': ['인증', '로그인', '세션', 'JWT', 'OAuth'],
    'billing': ['결제', '구독', '청구', 'subscription'],
  };
}
```

**검증 명령어**:

```bash
sdd deps check           # 의존성 일관성 검사
sdd deps suggest         # 누락된 의존성 제안
sdd deps auto-fix        # 자동 추가 (확인 후)
```

**출력 예시**:

```
🔍 의존성 분석: user-profile

감지된 의존성:
  ✅ user-auth (명시됨)
  ⚠️  data-model (감지됨, 미명시)
      └─ "User 엔티티의 프로필 필드" 참조 발견 (line 23)
  ⚠️  notification (감지됨, 미명시)
      └─ "프로필 변경 시 알림" 언급 (line 45)

제안: sdd deps add user-profile data-model notification
```

---

## Phase 3: 리뷰 워크플로우

### 3.1 승인 게이트 시스템

**설정**:

```yaml
# .sdd/config.yml
review:
  enabled: true

  gates:
    draft:
      next: review
      auto: true  # 자동 전환 가능

    review:
      next: approved
      requires:
        approvers: 2
        from_teams: ["owners"]  # 도메인 owners

    approved:
      next: implemented
      requires:
        tests: true      # 테스트 존재 확인
        sync_check: true # 코드 연결 확인

  notifications:
    slack: "#sdd-reviews"

  auto_assign:
    auth/*: ["@alice", "@bob"]
    billing/*: ["@charlie"]
```

**CLI 명령어**:

```bash
# 리뷰 요청
sdd review request user-auth
sdd review request user-auth --reviewers @alice @bob

# 리뷰 작업
sdd review list                    # 내 리뷰 목록
sdd review list --pending          # 대기 중
sdd review show user-auth          # 상세 보기

# 승인/반려
sdd review approve user-auth
sdd review approve user-auth --comment "LGTM"
sdd review reject user-auth --reason "보안 검토 필요"

# 상태 전환 (권한 필요)
sdd review promote user-auth       # 다음 단계로
```

**스펙 메타데이터 확장**:

```yaml
---
status: review
review:
  requested: 2024-01-15
  requested_by: "@developer"
  reviewers:
    - name: "@alice"
      status: approved
      date: 2024-01-16
      comment: "LGTM"
    - name: "@bob"
      status: pending
---
```

---

### 3.2 변경 이력 추적

**새 필드**:

```yaml
---
history:
  - date: 2024-01-10
    author: "@developer"
    action: created

  - date: 2024-01-12
    author: "@developer"
    action: modified
    changes: ["요구사항 REQ-003 추가", "시나리오 2개 추가"]

  - date: 2024-01-15
    author: "@developer"
    action: review_requested

  - date: 2024-01-16
    author: "@alice"
    action: approved
---
```

**CLI**:

```bash
sdd history user-auth              # 변경 이력
sdd history user-auth --diff       # 버전 간 diff
sdd blame user-auth                # 라인별 작성자
```

---

## Phase 4: 외부 연동

### 4.1 Issue Tracker 동기화

**지원 대상**:
- GitHub Issues
- Linear
- Jira (추후)

**설정**:

```yaml
# .sdd/config.yml
integrations:
  github:
    enabled: true
    repo: "owner/repo"
    sync:
      spec_to_issue: true      # 스펙 → 이슈 생성
      issue_to_spec: false     # 이슈 → 스펙 (수동)
    labels:
      prefix: "spec:"
      status_mapping:
        draft: "spec:draft"
        approved: "spec:ready"

  linear:
    enabled: true
    team: "ENG"
    sync:
      spec_to_issue: true
```

**CLI**:

```bash
sdd sync github                    # GitHub 동기화
sdd sync linear                    # Linear 동기화
sdd link user-auth --github 123    # 수동 연결
sdd link user-auth --linear ENG-456
```

**스펙 메타데이터**:

```yaml
---
external:
  github:
    issue: 123
    url: "https://github.com/owner/repo/issues/123"
  linear:
    id: "ENG-456"
    url: "https://linear.app/team/issue/ENG-456"
---
```

---

### 4.2 VSCode 확장

**기능 목록**:

| 기능 | 설명 |
|------|------|
| 스펙 미리보기 | 마크다운 렌더링 + 메타데이터 표시 |
| 사이드바 | 스펙 트리 뷰, 상태별 필터 |
| 자동완성 | `@spec REQ-xxx` 참조 자동완성 |
| 호버 정보 | 스펙 ID 호버 시 요약 표시 |
| Go to Definition | 스펙 참조에서 스펙 파일로 이동 |
| Find References | 코드에서 스펙 참조 찾기 |
| 검증 | 저장 시 자동 검증, 문제 패널 표시 |
| 스니펫 | 스펙 템플릿 스니펫 |

**구현 우선순위**:
1. 스펙 트리 뷰 + 미리보기
2. `@spec` 자동완성 + 호버
3. 실시간 검증
4. Go to Definition

---

## Phase 5: 분석 및 대시보드

### 5.1 터미널 대시보드

```bash
sdd dashboard
```

```
┌─────────────────────────────────────────────────────────────┐
│  SDD Dashboard - my-saas-project                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Overview          │  📈 Progress                        │
│  ──────────────────   │  ────────────────────────────────   │
│  Total Specs: 87      │  ████████████░░░░░░░░ 62% (54/87)   │
│  Constitution: v2.1   │                                     │
│                       │  By Phase:                          │
│  By Status:           │  P1: ██████████████████ 100%        │
│  ● Draft:      12     │  P2: ████████████░░░░░░  67%        │
│  ● Review:      8     │  P3: ████░░░░░░░░░░░░░░  22%        │
│  ● Approved:   13     │                                     │
│  ● Implemented: 54    │                                     │
│                       │                                     │
├───────────────────────┴─────────────────────────────────────┤
│  🔔 Pending Reviews (3)                                     │
│  ──────────────────────────────────────────────────────────│
│  • auth/mfa-setup        waiting: @alice (2 days)          │
│  • billing/refund-flow   waiting: @bob, @charlie           │
│  • core/audit-log        waiting: @security-team           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  Issues (2)                                             │
│  ──────────────────────────────────────────────────────────│
│  • Circular dependency: billing/invoice → billing/payment  │
│  • Stale spec: core/legacy-api (no updates 30+ days)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 HTML 리포트 강화

```bash
sdd report --format html --output report.html
```

**추가 섹션**:
- 트렌드 차트 (주간/월간 진행률)
- 도메인별 히트맵
- 의존성 복잡도 지표
- 리뷰 병목 분석

---

## 구현 우선순위 요약

| Phase | 기능 | 난이도 | 영향도 | 예상 작업 |
|-------|------|--------|--------|-----------|
| **1** | 인덱스 캐시 | 중 | 높음 | 스키마 + 빌더 + CLI |
| **1** | 인터랙티브 그래프 | 중 | 중 | D3.js 템플릿 |
| **2** | 도메인 분리 | 높음 | 높음 | 구조 변경 + CLI |
| **2** | 자동 의존성 감지 | 중 | 중 | 파서 확장 |
| **3** | 리뷰 워크플로우 | 높음 | 중 | 상태 관리 + CLI |
| **3** | 변경 이력 | 중 | 중 | 메타데이터 확장 |
| **4** | GitHub 연동 | 중 | 중 | API 연동 |
| **4** | VSCode 확장 | 높음 | 높음 | 별도 프로젝트 |
| **5** | 대시보드 | 중 | 중 | blessed/ink |

## 관련 문서

- [현재 한계점](./limitations.md) - 도구의 현실적 한계
- [모범 사례](./best-practices.md) - 효과적인 사용법
