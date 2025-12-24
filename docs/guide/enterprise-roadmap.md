# 대규모 확장 로드맵

SDD Tool을 엔터프라이즈 규모 (15명+, 150개+ 스펙, 멀티팀)로 확장하기 위한 장기 로드맵입니다.

> **전제조건**: [스케일업 로드맵](./scaling-roadmap.md)의 Phase 1-5 완료 후 진행

## 목표

- 스펙 500개 이상 원활한 관리
- 지리적 분산 팀 지원
- 엔터프라이즈 보안/감사 요구사항 충족
- 조직 전체 거버넌스 체계

---

## 아키텍처 진화

### 현재: 파일 기반 (File-based)

```
.sdd/
├── constitution.md
├── index.json
└── specs/
    └── *.md
```

- 장점: 단순, Git 친화적
- 한계: 성능, 동시성, 쿼리 제한

### Phase 6: 하이브리드 (Hybrid)

```
.sdd/
├── specs/           # 원본 (Git 버전 관리)
└── .cache/
    └── sdd.db       # SQLite 캐시 (로컬)
```

- 파일은 여전히 진실의 원천
- SQLite로 빠른 쿼리/검색
- Git 충돌 없음 (캐시는 무시)

### Phase 7+: 서버 기반 (Server-based)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CLI/IDE    │────▶│  SDD Server │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │ Git Sync│   │ Webhooks│
              └─────────┘   └─────────┘
```

- 중앙 집중식 관리
- 실시간 협업
- 고급 분석/리포팅

---

## Phase 6: 로컬 데이터베이스

### 6.1 SQLite 캐시 레이어

**목표**: 복잡한 쿼리 성능 개선

```typescript
// src/core/cache/database.ts
interface SpecDatabase {
  // 테이블 구조
  specs: {
    id: string;
    path: string;
    hash: string;
    title: string;
    status: string;
    phase: number;
    domain: string;
    created: string;
    updated: string;
    content_fts: string;  // Full-text search
  };

  dependencies: {
    from_id: string;
    to_id: string;
    type: 'explicit' | 'inferred';
  };

  reviews: {
    spec_id: string;
    reviewer: string;
    status: string;
    date: string;
    comment: string;
  };

  history: {
    spec_id: string;
    version: number;
    author: string;
    action: string;
    date: string;
    diff: string;
  };
}
```

**CLI 변경**:

```bash
sdd cache rebuild        # 캐시 재구축
sdd cache status         # 캐시 상태
sdd cache clear          # 캐시 삭제

# 고급 쿼리 지원
sdd query "status:review AND phase:2"
sdd query "depends_on:user-auth"
sdd query "modified_after:2024-01-01"
sdd query "reviewer:@alice AND NOT approved"
```

**Full-text Search**:

```bash
sdd search "결제 실패 처리"           # 전문 검색
sdd search "OAuth" --domain auth     # 도메인 필터
sdd search "MUST validate" --type requirement
```

### 6.2 오프라인 우선 동기화

**시나리오**: 분산 팀, 네트워크 불안정 환경

```typescript
// src/core/sync/offline.ts
interface OfflineSync {
  // 로컬 변경 추적
  pendingChanges: {
    id: string;
    type: 'create' | 'update' | 'delete';
    timestamp: string;
    data: SpecData;
  }[];

  // 충돌 해결
  conflicts: {
    spec_id: string;
    local: SpecData;
    remote: SpecData;
    base: SpecData;  // 공통 조상
  }[];
}
```

**CLI**:

```bash
sdd sync status          # 동기화 상태
sdd sync push            # 로컬 → 원격
sdd sync pull            # 원격 → 로컬
sdd sync resolve         # 충돌 해결 (인터랙티브)
```

---

## Phase 7: 중앙 서버

### 7.1 SDD Server

**아키텍처**:

```
┌──────────────────────────────────────────────────────────┐
│                      SDD Server                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  REST API   │  │  WebSocket  │  │  GraphQL    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│         │                │                │              │
│  ┌──────┴────────────────┴────────────────┴──────┐      │
│  │              Core Services                     │      │
│  ├───────────────────────────────────────────────┤      │
│  │  • Spec Management    • Review Workflow       │      │
│  │  • Dependency Graph   • Impact Analysis       │      │
│  │  • Search Engine      • Notification          │      │
│  │  • Audit Log          • Access Control        │      │
│  └───────────────────────────────────────────────┘      │
│                          │                               │
│  ┌───────────────────────┴───────────────────────┐      │
│  │              Data Layer                        │      │
│  ├───────────────────────────────────────────────┤      │
│  │  PostgreSQL  │  Elasticsearch  │  Redis       │      │
│  │  (specs)     │  (search)       │  (cache)     │      │
│  └───────────────────────────────────────────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**기술 스택 옵션**:

| 컴포넌트 | 옵션 A (Node.js) | 옵션 B (Go) |
|----------|------------------|-------------|
| API Server | Fastify/NestJS | Fiber/Echo |
| Database | PostgreSQL | PostgreSQL |
| Search | MeiliSearch | Elasticsearch |
| Cache | Redis | Redis |
| Queue | BullMQ | NATS |

**API 설계**:

```typescript
// REST API 엔드포인트
interface SddServerAPI {
  // Specs
  'GET    /api/specs': ListSpecs;
  'GET    /api/specs/:id': GetSpec;
  'POST   /api/specs': CreateSpec;
  'PUT    /api/specs/:id': UpdateSpec;
  'DELETE /api/specs/:id': DeleteSpec;

  // Dependencies
  'GET    /api/specs/:id/dependencies': GetDependencies;
  'GET    /api/specs/:id/dependents': GetDependents;
  'GET    /api/graph': GetDependencyGraph;

  // Reviews
  'POST   /api/specs/:id/reviews': RequestReview;
  'PUT    /api/reviews/:id': UpdateReview;
  'GET    /api/reviews/pending': GetPendingReviews;

  // Search
  'GET    /api/search': SearchSpecs;
  'POST   /api/search/advanced': AdvancedSearch;

  // Analytics
  'GET    /api/analytics/overview': GetOverview;
  'GET    /api/analytics/trends': GetTrends;
  'GET    /api/analytics/team/:id': GetTeamMetrics;

  // Audit
  'GET    /api/audit/logs': GetAuditLogs;
  'GET    /api/specs/:id/history': GetSpecHistory;
}
```

### 7.2 실시간 협업

**WebSocket 이벤트**:

```typescript
interface RealtimeEvents {
  // 스펙 변경
  'spec:created': { spec: Spec; by: User };
  'spec:updated': { spec: Spec; by: User; diff: Diff };
  'spec:deleted': { specId: string; by: User };

  // 리뷰
  'review:requested': { spec: Spec; reviewers: User[] };
  'review:approved': { spec: Spec; by: User };
  'review:rejected': { spec: Spec; by: User; reason: string };

  // 협업
  'spec:locked': { specId: string; by: User };
  'spec:unlocked': { specId: string };
  'user:viewing': { specId: string; users: User[] };

  // 시스템
  'notification': { type: string; message: string };
}
```

**동시 편집 방지**:

```bash
sdd edit user-auth           # 락 획득 후 편집
sdd edit user-auth --force   # 강제 락 해제 (관리자)
sdd lock status              # 현재 락 상태
```

### 7.3 Git 동기화 브릿지

**양방향 동기화**:

```
Git Repository  ←──────→  SDD Server
     │                         │
     │   push/pull hooks       │
     │   ─────────────→        │
     │                         │
     │   server webhooks       │
     │   ←─────────────        │
     │                         │
```

**설정**:

```yaml
# .sdd/server.yml
server:
  url: "https://sdd.company.com"
  project: "my-project"

sync:
  mode: bidirectional    # git-primary | server-primary | bidirectional
  auto_push: true        # 로컬 변경 시 자동 푸시
  auto_pull: true        # 서버 변경 시 자동 풀

  conflict_resolution: prompt  # prompt | local | remote | merge
```

---

## Phase 8: 엔터프라이즈 기능

### 8.1 접근 제어 (RBAC)

**역할 정의**:

```yaml
# 역할 계층
roles:
  viewer:
    permissions:
      - specs:read
      - search:use
      - reports:view

  contributor:
    inherits: viewer
    permissions:
      - specs:create
      - specs:update_own
      - reviews:request

  reviewer:
    inherits: contributor
    permissions:
      - reviews:approve
      - reviews:reject
      - specs:update_reviewed

  domain_admin:
    inherits: reviewer
    scope: domain    # 도메인 내에서만
    permissions:
      - specs:delete
      - constitution:update
      - members:manage

  org_admin:
    permissions:
      - "*"          # 모든 권한
```

**도메인별 권한**:

```yaml
# .sdd/access.yml
domains:
  auth:
    admins: ["@alice", "@security-team"]
    reviewers: ["@bob", "@charlie"]
    contributors: ["@dev-team"]

  billing:
    admins: ["@finance-lead"]
    reviewers: ["@finance-team"]
    contributors: ["@dev-team"]

  # 민감 도메인
  compliance:
    admins: ["@legal-team"]
    reviewers: ["@legal-team"]
    contributors: []           # 외부 기여 불가
    visibility: restricted     # 권한 있는 사람만 조회
```

### 8.2 감사 로그

**추적 항목**:

```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    ip: string;
    userAgent: string;
  };
  action: AuditAction;
  resource: {
    type: 'spec' | 'review' | 'constitution' | 'config';
    id: string;
    domain?: string;
  };
  details: {
    before?: any;
    after?: any;
    diff?: string;
    reason?: string;
  };
  metadata: {
    requestId: string;
    sessionId: string;
    source: 'cli' | 'web' | 'api' | 'automation';
  };
}

type AuditAction =
  | 'spec.create' | 'spec.update' | 'spec.delete'
  | 'spec.view'   | 'spec.export'
  | 'review.request' | 'review.approve' | 'review.reject'
  | 'constitution.update'
  | 'access.grant' | 'access.revoke'
  | 'config.change';
```

**CLI**:

```bash
sdd audit logs                           # 최근 로그
sdd audit logs --actor @alice            # 특정 사용자
sdd audit logs --action spec.delete      # 특정 액션
sdd audit logs --resource user-auth      # 특정 리소스
sdd audit logs --since 2024-01-01        # 기간 필터
sdd audit export --format csv            # 내보내기
```

**보존 정책**:

```yaml
audit:
  retention:
    default: 2y          # 기본 2년
    sensitive: 7y        # 민감 데이터 7년
    compliance: 10y      # 규정 준수 10년

  export:
    schedule: daily
    destination: s3://audit-logs/
    encryption: AES-256
```

### 8.3 규정 준수 (Compliance)

**지원 프레임워크**:

| 프레임워크 | 지원 기능 |
|-----------|----------|
| SOC 2 | 감사 로그, 접근 제어, 변경 추적 |
| GDPR | 데이터 내보내기, 삭제권, 동의 추적 |
| HIPAA | 암호화, 접근 로그, 최소 권한 |
| ISO 27001 | 문서화, 위험 평가, 지속적 개선 |

**컴플라이언스 대시보드**:

```bash
sdd compliance status                    # 준수 현황
sdd compliance report --framework soc2   # 프레임워크별 리포트
sdd compliance gaps                      # 미충족 항목
```

### 8.4 SSO/SAML 통합

**지원 IdP**:

- Okta
- Azure AD
- Google Workspace
- OneLogin
- 커스텀 SAML 2.0

**설정**:

```yaml
# 서버 설정
auth:
  provider: saml

  saml:
    entry_point: "https://idp.company.com/sso/saml"
    issuer: "sdd-server"
    cert: "/etc/sdd/idp-cert.pem"
    attribute_mapping:
      email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      groups: "http://schemas.xmlsoap.org/claims/Group"

  group_mapping:
    "SDD-Admins": org_admin
    "SDD-Reviewers": reviewer
    "SDD-Contributors": contributor
    "SDD-Viewers": viewer
```

---

## Phase 9: 분석 플랫폼

### 9.1 메트릭스 수집

**수집 데이터**:

```typescript
interface SpecMetrics {
  // 볼륨
  totalSpecs: number;
  specsByStatus: Record<Status, number>;
  specsByDomain: Record<string, number>;
  specsByPhase: Record<number, number>;

  // 속도
  avgTimeToApproval: number;      // draft → approved
  avgTimeToImplement: number;     // approved → implemented
  reviewCycleTime: number;        // 리뷰 사이클

  // 품질
  avgQualityScore: number;
  specsWithTests: number;
  syncCoverage: number;           // 코드 연결률

  // 활동
  createdThisWeek: number;
  updatedThisWeek: number;
  reviewsCompleted: number;

  // 복잡도
  avgDependencies: number;
  maxDependencyDepth: number;
  circularDependencies: number;
}

interface TeamMetrics {
  team: string;
  members: number;
  ownedSpecs: number;
  pendingReviews: number;
  avgResponseTime: number;
  completionRate: number;
}
```

### 9.2 대시보드 UI

**웹 대시보드**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  SDD Analytics Dashboard                              🔔  👤 Admin  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Overview                                     Last 30 days ▼│   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │   247          89%           4.2 days        12             │   │
│  │   Total       Completion    Avg Cycle      Pending         │   │
│  │   Specs       Rate          Time           Reviews         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │  Progress by Phase       │  │  Specs by Domain             │   │
│  │  ────────────────────    │  │  ────────────────────────    │   │
│  │                          │  │                              │   │
│  │  P1 ████████████ 100%    │  │  auth     ████████  32       │   │
│  │  P2 █████████░░░  78%    │  │  billing  ██████    24       │   │
│  │  P3 ██████░░░░░░  52%    │  │  core     ████████████ 48    │   │
│  │  P4 ███░░░░░░░░░  25%    │  │  api      ██████████  40     │   │
│  │                          │  │  ...                         │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Activity Timeline                                          │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │     ╭─╮                   ╭─╮                               │   │
│  │    ╭╯ ╰╮      ╭──╮      ╭╯ ╰╮      ╭──╮                    │   │
│  │  ──╯   ╰──────╯  ╰──────╯   ╰──────╯  ╰────                │   │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun  Mon  Tue               │   │
│  │                                                             │   │
│  │  — Created  — Updated  — Approved                          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │  Team Performance        │  │  Review Queue                │   │
│  │  ────────────────────    │  │  ────────────────────────    │   │
│  │                          │  │                              │   │
│  │  Core Team      A  98%   │  │  • billing/refund    2d      │   │
│  │  Auth Team      A  95%   │  │  • auth/mfa-setup    3d      │   │
│  │  Billing Team   B  87%   │  │  • api/rate-limit    5d ⚠️  │   │
│  │  Platform Team  B  82%   │  │  • core/migration    7d 🔴  │   │
│  │                          │  │                              │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.3 알림 시스템

**채널**:

- Slack / Microsoft Teams
- Email
- Webhook
- In-app notifications

**알림 규칙**:

```yaml
notifications:
  rules:
    - name: "Review SLA Warning"
      condition: "review.pending_days >= 5"
      channels: [slack, email]
      recipients: ["@reviewer", "@domain-admin"]
      message: "Review pending for {spec.title} - {review.pending_days} days"

    - name: "Circular Dependency Alert"
      condition: "graph.new_cycle_detected"
      channels: [slack]
      recipients: ["#sdd-alerts"]
      priority: high

    - name: "Quality Score Drop"
      condition: "spec.quality_score < 60"
      channels: [email]
      recipients: ["@author"]

    - name: "Daily Digest"
      schedule: "0 9 * * 1-5"  # 평일 오전 9시
      channels: [email]
      recipients: ["@all-contributors"]
      template: daily_digest
```

---

## Phase 10: 생태계 확장

### 10.1 플러그인 시스템

**플러그인 타입**:

```typescript
interface SddPlugin {
  name: string;
  version: string;
  type: 'validator' | 'exporter' | 'importer' | 'analyzer' | 'integration';

  // 라이프사이클 훅
  hooks: {
    'spec:beforeCreate'?: (spec: Spec) => Promise<Spec>;
    'spec:afterCreate'?: (spec: Spec) => Promise<void>;
    'spec:beforeUpdate'?: (old: Spec, new: Spec) => Promise<Spec>;
    'spec:afterUpdate'?: (spec: Spec) => Promise<void>;
    'validate:custom'?: (spec: Spec) => Promise<ValidationResult>;
    'export:format'?: (specs: Spec[], options: any) => Promise<Buffer>;
  };

  // CLI 확장
  commands?: {
    name: string;
    description: string;
    handler: (args: any) => Promise<void>;
  }[];

  // UI 확장 (웹)
  components?: {
    slot: 'sidebar' | 'toolbar' | 'detail-panel';
    component: React.ComponentType;
  }[];
}
```

**공식 플러그인**:

| 플러그인 | 설명 |
|----------|------|
| `@sdd/plugin-jira` | Jira 이슈 동기화 |
| `@sdd/plugin-confluence` | Confluence 문서 내보내기 |
| `@sdd/plugin-figma` | Figma 디자인 스펙 연결 |
| `@sdd/plugin-openapi` | OpenAPI 스펙 생성/검증 |
| `@sdd/plugin-dbml` | 데이터 모델 시각화 |
| `@sdd/plugin-mermaid` | 다이어그램 자동 생성 |
| `@sdd/plugin-ai` | AI 기반 스펙 제안/검토 |

### 10.2 API SDK

**언어별 SDK**:

```typescript
// TypeScript/JavaScript
import { SddClient } from '@sdd/sdk';

const client = new SddClient({
  serverUrl: 'https://sdd.company.com',
  apiKey: process.env.SDD_API_KEY,
});

// 스펙 조회
const specs = await client.specs.list({ domain: 'auth' });

// 스펙 생성
const newSpec = await client.specs.create({
  title: 'New Feature',
  domain: 'core',
  content: '...',
});

// 리뷰 요청
await client.reviews.request(newSpec.id, {
  reviewers: ['@alice', '@bob'],
});

// 실시간 구독
client.subscribe('spec:updated', (event) => {
  console.log(`Spec ${event.spec.id} updated by ${event.by.name}`);
});
```

```python
# Python
from sdd import SddClient

client = SddClient(
    server_url="https://sdd.company.com",
    api_key=os.environ["SDD_API_KEY"]
)

# 스펙 검색
specs = client.specs.search("결제", domain="billing")

# 영향 분석
impact = client.analysis.impact("user-auth")
print(f"Affected specs: {impact.affected_count}")
```

### 10.3 CI/CD 통합 강화

**GitHub Actions**:

```yaml
# .github/workflows/sdd.yml
name: SDD Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: SDD Validate
        uses: sdd-tool/action-validate@v2
        with:
          server: ${{ secrets.SDD_SERVER }}
          token: ${{ secrets.SDD_TOKEN }}
          fail_on: error    # error | warning | none

      - name: SDD Sync Check
        uses: sdd-tool/action-sync@v2
        with:
          threshold: 80
          report: true

      - name: SDD Impact Report
        if: github.event_name == 'pull_request'
        uses: sdd-tool/action-impact@v2
        with:
          comment: true     # PR에 코멘트
```

**GitLab CI**:

```yaml
sdd:validate:
  image: sdd-tool/cli:latest
  script:
    - sdd validate --ci
    - sdd sync --ci --threshold 80
  rules:
    - changes:
      - ".sdd/**/*"
      - "src/**/*"
```

---

## 배포 옵션

### Self-hosted

```yaml
# docker-compose.yml
version: '3.8'
services:
  sdd-server:
    image: sdd-tool/server:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      - ELASTICSEARCH_URL=http://...
    volumes:
      - ./config:/etc/sdd

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7

  elasticsearch:
    image: elasticsearch:8.11.0
```

### Kubernetes

```yaml
# Helm values
sdd:
  server:
    replicas: 3
    resources:
      requests:
        cpu: 500m
        memory: 512Mi

  postgresql:
    enabled: true
    persistence:
      size: 100Gi

  elasticsearch:
    enabled: true
    replicas: 3

  ingress:
    enabled: true
    host: sdd.company.com
    tls: true
```

### Cloud (SaaS)

- SDD Cloud (향후 제공 예정)
- 관리형 서비스
- SOC 2 Type II 인증
- 99.9% SLA

---

## 구현 우선순위

| Phase | 기능 | 복잡도 | 가치 | 의존성 |
|-------|------|--------|------|--------|
| **6** | SQLite 캐시 | 중 | 높음 | - |
| **6** | 오프라인 동기화 | 중 | 중 | 6.1 |
| **7** | SDD Server (MVP) | 높음 | 높음 | 6 |
| **7** | 실시간 협업 | 높음 | 중 | 7.1 |
| **7** | Git 브릿지 | 중 | 높음 | 7.1 |
| **8** | RBAC | 중 | 높음 | 7.1 |
| **8** | 감사 로그 | 중 | 높음 | 7.1 |
| **8** | SSO/SAML | 중 | 중 | 8.1 |
| **9** | 분석 대시보드 | 중 | 중 | 7.1 |
| **9** | 알림 시스템 | 중 | 중 | 7.1 |
| **10** | 플러그인 시스템 | 높음 | 중 | 7 |
| **10** | SDK | 중 | 중 | 7.1 |

---

## 마이그레이션 경로

### 파일 기반 → 하이브리드

```bash
# 1. 캐시 초기화
sdd cache init

# 2. 기존 스펙 인덱싱
sdd cache rebuild

# 3. 검증
sdd cache verify
```

### 하이브리드 → 서버 기반

```bash
# 1. 서버 연결
sdd server connect https://sdd.company.com

# 2. 프로젝트 마이그레이션
sdd server migrate --project my-project

# 3. 팀 초대
sdd server invite @team --role contributor

# 4. 동기화 모드 설정
sdd config set sync.mode bidirectional
```

---

## 관련 문서

- [현재 한계점](./limitations.md) - 도구의 현실적 한계
- [스케일업 로드맵](./scaling-roadmap.md) - 중규모 확장 (Phase 1-5)
- [모범 사례](./best-practices.md) - 효과적인 사용법
