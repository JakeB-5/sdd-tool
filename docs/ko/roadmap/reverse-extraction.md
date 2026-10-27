# 역방향 스펙 추출 (Reverse Spec Extraction)

> **대체됨**: 이 문서는 과거 설계 문서입니다. 아래의 Serena MCP 기반 설계는 더 이상 유효하지 않습니다. Serena 통합은 제거되었고, `sdd reverse`는 AI 주도 방식으로 바뀌었습니다. CLI는 구조 스캔과 리뷰 관리를 맡고, AI가 코드를 읽어 초안을 작성합니다. 현재 워크플로우는 [역추출 가이드](../guide/reverse-extraction.md)를 참고하세요. 아래의 Serena 필수 설명, `extract` 명령, `--ai`, 신뢰도 점수는 더 이상 적용되지 않습니다.

> **문서 상태**: 대체됨 (v1.2.0에서 최초 구현)
> **작성일**: 2024-12-24
> **업데이트**: 2025-12-29
> **목적**: 레거시/기존 프로젝트에 SDD 도입을 위한 코드 → 스펙 역추출 기능
> **핵심 전략**: ~~Serena MCP 활용~~ (대체됨, 아래 안내 참고)
> **관련 문서**: [CLI 레퍼런스](/cli/reverse), [슬래시 커맨드](/commands/sdd-reverse), [역추출 가이드](/guide/reverse-extraction)

---

## 핵심 전략: Serena MCP 활용

### Serena란?

[Serena](https://github.com/oraios/serena)는 코드 분석을 위한 MCP 서버로:

```
✅ 30개+ 언어 지원 (Python, TS, Java, Go, Rust, C++ 등)
✅ 심볼 수준 코드 추출 (클래스, 함수, 변수)
✅ 참조/의존성 관계 분석
✅ IDE 수준의 시맨틱 분석
✅ Claude Code/Desktop 네이티브 통합
```

### 왜 Serena인가?

**직접 구현 vs Serena 활용 비교**:

| 항목 | 직접 구현 | Serena 활용 |
|------|----------|-------------|
| **AST 파서 개발** | 언어별 개별 구현 필요 | ❌ 불필요 |
| **지원 언어** | TS/JS만 (초기) | 30개+ 즉시 |
| **심볼 추출** | ts-morph 등 직접 | `find_symbol` API |
| **참조 분석** | 직접 구현 | `find_referencing_symbols` |
| **개발 기간** | 수개월 | 수주 |
| **유지보수** | 언어별 업데이트 필요 | Serena가 담당 |

**결론**: 직접 파서 구현 대신 Serena MCP에 위임

### 아키텍처 변경

```
기존 계획:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scanner    │────▶│  AST Parser │────▶│  Analyzer   │
│  (직접구현) │     │  (직접구현) │     │  (직접구현) │
└─────────────┘     └─────────────┘     └─────────────┘
        ↓                 ↓                   ↓
     개발 난이도: 높음, 언어별 구현 필요

변경된 계획:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scanner    │────▶│ Serena MCP  │────▶│  Analyzer   │
│  (간단)     │     │  (외부)     │     │  (집중)     │
└─────────────┘     └─────────────┘     └─────────────┘
        ↓                 ↓                   ↓
     파일목록만        심볼/참조 추출      스펙 생성에 집중
```

### Serena MCP 활용 방식

**1. MCP 클라이언트로 통합**:

```typescript
// src/core/reverse/serena-client.ts
import { Client } from '@anthropic/mcp';

class SerenaClient {
  private mcp: Client;

  async findSymbol(query: string): Promise<Symbol[]> {
    return this.mcp.callTool('find_symbol', { query });
  }

  async findReferences(symbol: string): Promise<Reference[]> {
    return this.mcp.callTool('find_referencing_symbols', { symbol });
  }

  async getSymbolDefinition(symbol: string): Promise<Definition> {
    return this.mcp.callTool('get_symbol_definition', { symbol });
  }
}
```

**2. 또는 Claude Code 세션에서 직접 활용**:

```bash
# Claude Code에서 Serena MCP 설정 후
sdd reverse extract --use-mcp serena
```

Claude가 Serena 도구를 직접 호출하여 분석 수행.

### 역할 분담

| 역할 | 담당 | 비고 |
|------|------|------|
| **파일 스캔** | SDD Tool | 디렉토리 트리, 파일 목록 |
| **심볼 추출** | Serena | find_symbol |
| **참조 분석** | Serena | find_referencing_symbols |
| **의존성 그래프** | Serena + SDD | Serena 데이터 가공 |
| **스펙 생성** | SDD Tool | 템플릿, 포맷팅 |
| **AI 의도 추론** | Claude | 프롬프트 기반 |
| **검토 워크플로우** | SDD Tool | CLI 인터랙션 |

---

## 배경 및 동기

### 현재 문제

```
SDD 도입의 가장 큰 장벽:
"이미 코드가 있는데, 스펙을 처음부터 다 작성해야 하나요?"

현실:
- 레거시 프로젝트에 스펙 문서 없음
- 수동으로 스펙 작성 = 막대한 초기 비용
- 비용 때문에 SDD 도입 포기
```

### 해결 방향

```
코드 → 스펙 역추출 자동화
"기존 코드를 분석해서 스펙 초안을 자동 생성"

효과:
- SDD 도입 장벽 대폭 감소
- 레거시 프로젝트도 점진적 SDD 전환 가능
- "문서화 부채" 해소
```

---

## 기능 개요

### 명령어 구조

```bash
# 전체 프로젝트 분석
sdd reverse scan                    # 코드베이스 스캔
sdd reverse extract                 # 스펙 초안 생성
sdd reverse review                  # 생성된 스펙 검토/수정

# 특정 모듈/파일 대상
sdd reverse extract src/auth/       # 디렉토리 단위
sdd reverse extract src/auth/AuthService.ts  # 파일 단위

# 옵션
sdd reverse extract --depth shallow # 얕은 분석 (빠름)
sdd reverse extract --depth deep    # 깊은 분석 (정확)
sdd reverse extract --ai            # AI 보조 분석
sdd reverse extract --dry-run       # 미리보기만
```

### 출력물

```
입력: 기존 코드베이스
      src/
      ├── auth/
      │   ├── AuthService.ts
      │   ├── LoginController.ts
      │   └── TokenRepository.ts
      └── order/
          ├── OrderService.ts
          └── PaymentAdapter.ts

출력: 스펙 초안 (검토 필요)
      .sdd/
      ├── domains.yml
      └── specs/
          ├── auth/
          │   ├── domain.md
          │   ├── user-authentication/
          │   │   ├── spec.md (초안)
          │   │   └── .reverse-meta.json
          │   └── token-management/
          │       └── spec.md (초안)
          └── order/
              ├── domain.md
              └── order-processing/
                  └── spec.md (초안)
```

---

## 추출 레벨 정의

### Level 1: 구조 추출 (Structure)

```
추출 대상:
- 디렉토리 구조 → 도메인 구조
- 파일/클래스 → 기능 단위
- public API → 인터페이스 정의

난이도: 낮음
정확도: 높음
자동화: 100% 가능
```

**예시 출력**:

```yaml
# .sdd/domains.yml (자동 생성)
domains:
  auth:
    name: "auth"
    inferred_from: "src/auth/"
    files: 3
    exports:
      - AuthService
      - LoginController
      - TokenRepository

  order:
    name: "order"
    inferred_from: "src/order/"
    files: 2
    exports:
      - OrderService
      - PaymentAdapter
```

### Level 2: 인터페이스 추출 (Interface)

```
추출 대상:
- 클래스/함수 시그니처
- 입출력 타입
- 의존성 관계
- 에러 타입

난이도: 중간
정확도: 높음
자동화: 90% 가능 (타입 정보 있을 경우)
```

**예시 출력**:

```markdown
<!-- spec.md 초안 -->
# User Authentication

## 추출된 인터페이스

### AuthService

| 메서드 | 입력 | 출력 | 설명 |
|--------|------|------|------|
| `login` | `email: string, password: string` | `Promise<Session>` | (추론 필요) |
| `logout` | `sessionId: string` | `Promise<void>` | (추론 필요) |
| `verify` | `token: string` | `Promise<User \| null>` | (추론 필요) |

### 의존성
- `TokenRepository` (직접)
- `UserRepository` (직접)
- `bcrypt` (외부)
```

### Level 3: 동작 추출 (Behavior)

```
추출 대상:
- 비즈니스 로직 패턴
- 조건문/분기 → 규칙
- 에러 처리 → 예외 케이스
- 테스트 케이스 → 시나리오

난이도: 높음
정확도: 중간 (AI 보조 필요)
자동화: 60-70%
```

**예시 출력**:

```markdown
## 추론된 요구사항

### REQ-001: 로그인 (추론됨)
- 이메일과 비밀번호로 인증
- 비밀번호는 bcrypt로 검증 (코드에서 확인)
- 성공 시 Session 반환
- 실패 시 AuthenticationError throw

### REQ-002: 세션 검증 (추론됨)
- JWT 토큰 검증
- 만료된 토큰은 null 반환
- 유효한 토큰은 User 객체 반환

## 추론된 시나리오

### SCENARIO-001: 정상 로그인 (테스트에서 추출)
```gherkin
GIVEN 유효한 이메일 "user@example.com"
AND 올바른 비밀번호 "password123"
WHEN login() 호출
THEN Session 객체 반환
AND Session.userId가 해당 사용자 ID
```

### SCENARIO-002: 잘못된 비밀번호 (테스트에서 추출)
```gherkin
GIVEN 유효한 이메일 "user@example.com"
AND 잘못된 비밀번호 "wrong"
WHEN login() 호출
THEN AuthenticationError throw
```
```

### Level 4: 의도 추출 (Intent) - AI 필수

```
추출 대상:
- "왜 이렇게 구현했는가"
- 비즈니스 컨텍스트
- 암묵적 규칙
- 주석/문서에서 힌트

난이도: 매우 높음
정확도: 낮음-중간 (반드시 검토 필요)
자동화: 40-50% (AI 보조)
```

**예시 출력**:

```markdown
## 추론된 비즈니스 컨텍스트 (검토 필요)

### 인증 정책 (AI 추론)
> ⚠️ AI가 코드와 주석에서 추론한 내용입니다. 반드시 검토하세요.

- 세션 만료: 24시간 (코드에서 `24 * 60 * 60 * 1000` 발견)
- Remember Me: 30일 연장 (주석 "extend to 30 days if remember" 발견)
- 동시 세션: 제한 없음 (관련 로직 미발견)

### 보안 요구사항 (AI 추론)
- 비밀번호 해싱: bcrypt, rounds=10
- 토큰 알고리즘: HS256 (jsonwebtoken 설정)
- Rate limiting: 미구현 (관련 코드 없음)
```

---

## 기술 구현 (Serena MCP 기반)

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    sdd reverse extract                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   SDD Tool (우리가 구현)              │   │
│  │  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │  File Scanner│  │  Test Parser │  ← 간단한 파싱   │   │
│  │  └──────┬───────┘  └──────┬───────┘                  │   │
│  │         └────────┬────────┘                          │   │
│  └──────────────────┼───────────────────────────────────┘   │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Serena MCP (외부 - 핵심 분석)            │   │
│  │                                                       │   │
│  │  • find_symbol          → 심볼 추출                  │   │
│  │  • find_referencing_symbols → 참조 분석             │   │
│  │  • get_symbol_definition → 정의 조회                │   │
│  │  • 30개+ 언어 자동 지원                              │   │
│  │                                                       │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SDD Tool (우리가 구현)                   │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              Spec Generator                     │  │   │
│  │  │  • Serena 결과 → 도메인 구조 변환              │  │   │
│  │  │  • 스펙 템플릿 적용                            │  │   │
│  │  │  • 신뢰도 계산                                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              AI Analyzer (Claude)              │  │   │
│  │  │  • 의도 추론                                   │  │   │
│  │  │  • 비즈니스 규칙 추출                          │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              Review Workflow                   │  │   │
│  │  │  • 검토 CLI                                    │  │   │
│  │  │  • 확정 프로세스                               │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 개발 범위 변경

**직접 구현 (최소화)**:
```
□ File Scanner - 디렉토리/파일 목록 (간단)
□ Test Parser - describe/it 구조만 (간단)
□ Serena Client - MCP 호출 래퍼 (간단)
□ Spec Generator - 템플릿 적용 (핵심)
□ Review Workflow - CLI 인터랙션 (핵심)
```

**Serena에 위임 (복잡한 부분)**:
```
✅ AST 파싱 - 30개+ 언어
✅ 심볼 추출 - 클래스, 함수, 변수
✅ 참조 분석 - 의존성 그래프
✅ 타입 정보 - 시그니처, 파라미터
```

### 지원 언어

| 언어 | Serena 지원 | 추가 구현 | 비고 |
|------|-------------|-----------|------|
| TypeScript | ✅ | 없음 | 즉시 사용 |
| JavaScript | ✅ | 없음 | 즉시 사용 |
| Python | ✅ | 없음 | 즉시 사용 |
| Go | ✅ | 없음 | 즉시 사용 |
| Java | ✅ | 없음 | 즉시 사용 |
| Rust | ✅ | 없음 | 즉시 사용 |
| C/C++ | ✅ | 없음 | 즉시 사용 |
| ... | ✅ | 없음 | 30개+ 언어 |

**결론**: 언어별 파서 구현 불필요

### 핵심 모듈

#### 1. File Scanner

```typescript
// src/core/reverse/scanner.ts
interface ScanResult {
  root: string;
  files: FileInfo[];
  structure: DirectoryTree;
  languages: LanguageStats;
  entryPoints: string[];
}

interface FileInfo {
  path: string;
  language: Language;
  size: number;
  exports: string[];
  imports: ImportInfo[];
}
```

#### 2. AST Parser (TypeScript 예시)

```typescript
// src/core/reverse/parsers/typescript.ts
interface ParseResult {
  classes: ClassInfo[];
  functions: FunctionInfo[];
  interfaces: InterfaceInfo[];
  types: TypeInfo[];
  dependencies: DependencyInfo[];
}

interface ClassInfo {
  name: string;
  file: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
  extends?: string;
  implements: string[];
  decorators: string[];
  jsdoc?: string;
}

interface MethodInfo {
  name: string;
  visibility: 'public' | 'private' | 'protected';
  async: boolean;
  parameters: ParameterInfo[];
  returnType: string;
  jsdoc?: string;
  body?: string;  // AI 분석용
}
```

#### 3. Test Parser

```typescript
// src/core/reverse/parsers/test-parser.ts
interface TestParseResult {
  suites: TestSuite[];
  scenarios: ExtractedScenario[];
}

interface TestSuite {
  name: string;
  file: string;
  tests: TestCase[];
}

interface TestCase {
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  assertions: Assertion[];
  // GIVEN-WHEN-THEN 추론
  given?: string;
  when?: string;
  then?: string;
}
```

#### 4. AI Analyzer

```typescript
// src/core/reverse/ai-analyzer.ts
interface AIAnalysisRequest {
  code: string;
  context: {
    file: string;
    className?: string;
    methodName?: string;
    relatedCode?: string[];
  };
  prompt: 'intent' | 'requirements' | 'scenarios' | 'rules';
}

interface AIAnalysisResult {
  content: string;
  confidence: number;  // 0-100
  sources: string[];   // 추론 근거
  needsReview: boolean;
}
```

#### 5. Spec Generator

```typescript
// src/core/reverse/generator.ts
interface GeneratorOptions {
  depth: 'shallow' | 'medium' | 'deep';
  includeAI: boolean;
  outputFormat: 'markdown' | 'yaml';
  reviewMode: boolean;  // 검토 필요 표시
}

interface GeneratedSpec {
  domain: DomainSpec;
  features: FeatureSpec[];
  confidence: ConfidenceReport;
  reviewItems: ReviewItem[];
}

interface ConfidenceReport {
  overall: number;
  bySection: {
    structure: number;
    interfaces: number;
    requirements: number;
    scenarios: number;
  };
}

interface ReviewItem {
  location: string;
  type: 'verify' | 'complete' | 'clarify';
  message: string;
  suggestion?: string;
}
```

---

## 출력 형식

### 스펙 초안 템플릿

```markdown
<!-- .sdd/specs/auth/user-authentication/spec.md -->
---
id: auth/user-authentication
status: draft
source: reverse-extracted
extracted_from:
  - src/auth/AuthService.ts
  - src/auth/LoginController.ts
extraction_date: 2024-12-24
confidence: 72
needs_review: true
---

# User Authentication

> ⚠️ **자동 추출된 스펙**: 이 문서는 코드에서 자동 추출되었습니다.
> 반드시 검토하고 누락된 내용을 보완하세요.

## 개요

<!-- AI 추론 또는 주석에서 추출 -->
사용자 인증을 처리하는 기능입니다.

**추출 신뢰도**: 72% (검토 필요)

## 추출된 인터페이스

### AuthService

| 메서드 | 시그니처 | 신뢰도 |
|--------|----------|--------|
| login | `(email: string, password: string) => Promise<Session>` | 100% |
| logout | `(sessionId: string) => Promise<void>` | 100% |
| verify | `(token: string) => Promise<User \| null>` | 100% |

### 의존성

- ✅ `TokenRepository` - 확인됨
- ✅ `UserRepository` - 확인됨
- ⚠️ `EmailService` - 추론됨 (검토 필요)

## 요구사항 (추론됨)

> ⚠️ 코드에서 추론한 요구사항입니다. 비즈니스 의도와 맞는지 확인하세요.

### REQ-001: 이메일/비밀번호 로그인 [신뢰도: 85%]

사용자는 이메일과 비밀번호로 로그인할 수 있어야 한다.

**근거**:
- `AuthService.login(email, password)` 시그니처
- bcrypt 비밀번호 검증 로직 존재

**검토 필요**:
- [ ] 이메일 형식 검증 규칙 확인
- [ ] 비밀번호 복잡도 규칙 확인

### REQ-002: JWT 토큰 발급 [신뢰도: 90%]

로그인 성공 시 JWT 토큰을 발급해야 한다.

**근거**:
- jsonwebtoken 패키지 사용
- `TokenRepository.create()` 호출

### REQ-003: 세션 만료 [신뢰도: 70%]

세션은 24시간 후 만료되어야 한다.

**근거**:
- 코드: `expiresIn: 24 * 60 * 60 * 1000`

**검토 필요**:
- [ ] 24시간이 비즈니스 요구사항과 일치하는지 확인
- [ ] Remember Me 기능 여부 확인

## 시나리오 (테스트에서 추출)

### SCENARIO-001: 정상 로그인 [신뢰도: 95%]

**출처**: `tests/auth/login.test.ts:15`

```gherkin
GIVEN 등록된 사용자 "user@example.com"
AND 올바른 비밀번호 "ValidPass123"
WHEN 로그인 시도
THEN 세션 토큰 반환
AND 세션 만료 시간 설정됨
```

### SCENARIO-002: 잘못된 비밀번호 [신뢰도: 95%]

**출처**: `tests/auth/login.test.ts:28`

```gherkin
GIVEN 등록된 사용자 "user@example.com"
AND 잘못된 비밀번호 "wrong"
WHEN 로그인 시도
THEN AuthenticationError 발생
AND 에러 메시지 "Invalid credentials"
```

### SCENARIO-003: 미등록 사용자 [신뢰도: 90%]

**출처**: `tests/auth/login.test.ts:41`

```gherkin
GIVEN 미등록 이메일 "unknown@example.com"
WHEN 로그인 시도
THEN UserNotFoundError 발생
```

## 누락 가능성 (검토 필요)

> 다음 항목들은 코드에서 명확히 확인되지 않았습니다.

- [ ] **Rate Limiting**: 로그인 시도 제한 로직 미발견
- [ ] **Account Lockout**: 연속 실패 시 계정 잠금 미발견
- [ ] **Password Reset**: 비밀번호 재설정 플로우 미발견
- [ ] **2FA/MFA**: 다중 인증 로직 미발견

## 코드 링크

```yaml
code_links:
  implements:
    - src/auth/AuthService.ts
    - src/auth/LoginController.ts
  tests:
    - tests/auth/login.test.ts
    - tests/auth/session.test.ts
  related:
    - src/auth/TokenRepository.ts
    - src/core/User.ts
```

---

## 추출 메타데이터

```json
// .reverse-meta.json
{
  "extracted_at": "2024-12-24T10:30:00Z",
  "tool_version": "2.0.0",
  "source_files": [
    "src/auth/AuthService.ts",
    "src/auth/LoginController.ts"
  ],
  "test_files": [
    "tests/auth/login.test.ts"
  ],
  "analysis_depth": "deep",
  "ai_assisted": true,
  "confidence_scores": {
    "structure": 100,
    "interfaces": 95,
    "requirements": 72,
    "scenarios": 88
  },
  "review_status": "pending",
  "reviewed_by": null,
  "reviewed_at": null
}
```
```

---

## 워크플로우

### 1단계: 스캔

```bash
$ sdd reverse scan

🔍 코드베이스 스캔 중...

발견된 구조:
  📁 src/
  ├── 📁 auth/ (3 files, 450 LOC)
  │   ├── AuthService.ts
  │   ├── LoginController.ts
  │   └── TokenRepository.ts
  ├── 📁 order/ (5 files, 890 LOC)
  │   └── ...
  └── 📁 core/ (8 files, 1200 LOC)
      └── ...

📊 요약:
  - 언어: TypeScript (100%)
  - 파일: 16개
  - LOC: 2,540
  - 테스트: 12개 파일

💡 추천 도메인:
  1. auth (3 files) - 인증 관련 추정
  2. order (5 files) - 주문 관련 추정
  3. core (8 files) - 공통 모듈 추정

계속하려면 'sdd reverse extract' 실행
```

### 2단계: 추출

```bash
$ sdd reverse extract --depth deep --ai

🔄 스펙 추출 중...

[1/3] auth 도메인 분석...
  ├── 구조 분석... ✅
  ├── 인터페이스 추출... ✅
  ├── 테스트 분석... ✅ (8 scenarios)
  └── AI 의도 추론... ✅

[2/3] order 도메인 분석...
  └── ...

[3/3] core 도메인 분석...
  └── ...

📝 생성된 스펙:
  .sdd/
  ├── domains.yml
  └── specs/
      ├── auth/
      │   ├── domain.md
      │   └── user-authentication/
      │       └── spec.md (신뢰도: 72%)
      ├── order/
      │   └── ...
      └── core/
          └── ...

⚠️ 검토 필요 항목: 12개
  - auth/user-authentication: 5개
  - order/checkout: 4개
  - core/user-model: 3개

다음 단계: 'sdd reverse review' 로 검토 시작
```

### 3단계: 검토

```bash
$ sdd reverse review

📋 검토 대기 스펙: 6개

[1/6] auth/user-authentication (신뢰도: 72%)

검토 항목:
  1. REQ-003: 세션 만료 24시간 - 맞습니까? (y/n/edit)
  > y

  2. Rate Limiting 미발견 - 의도적 누락입니까? (y/n/add)
  > add
  > 설명 입력: 로그인 5회 실패 시 10분 잠금

  3. 2FA 미발견 - 의도적 누락입니까? (y/n/add)
  > y (현재 미지원)

✅ auth/user-authentication 검토 완료
   신뢰도: 72% → 95% (검토됨)

[2/6] 다음 스펙...
```

### 4단계: 확정

```bash
$ sdd reverse finalize

✅ 검토 완료된 스펙:
  - auth/user-authentication (95%)
  - auth/token-management (88%)
  - order/checkout (91%)

⚠️ 검토 미완료:
  - order/payment (검토 필요)
  - core/user-model (검토 필요)

확정된 스펙을 적용하시겠습니까? (y/n)
> y

📁 스펙 확정 완료
  - status: draft → extracted
  - needs_review: true → false

다음 단계:
  1. 'sdd validate' 로 스펙 검증
  2. 필요시 수동 보완
  3. 'sdd status' 로 진행 상황 확인
```

---

## AI 연동 전략

### 프롬프트 설계

#### 의도 추론 프롬프트

```markdown
다음 TypeScript 코드를 분석하여 비즈니스 의도를 추론하세요.

## 코드
```typescript
{code}
```

## 컨텍스트
- 파일: {file_path}
- 클래스: {class_name}
- 관련 코드: {related_files}

## 요청
1. 이 코드의 비즈니스 목적은 무엇입니까?
2. 어떤 요구사항을 구현한 것입니까?
3. 암묵적으로 가정하는 규칙이 있습니까?

## 출력 형식
- 요구사항을 RFC 2119 키워드(MUST, SHOULD, MAY)로 작성
- 확신 수준을 0-100으로 표시
- 추론 근거를 명시
```

#### 시나리오 생성 프롬프트

```markdown
다음 테스트 코드를 GIVEN-WHEN-THEN 시나리오로 변환하세요.

## 테스트 코드
```typescript
{test_code}
```

## 출력 형식
```gherkin
GIVEN [사전 조건]
AND [추가 조건]
WHEN [동작]
THEN [결과]
AND [추가 검증]
```

## 규칙
- 기술 용어보다 비즈니스 용어 사용
- 구체적인 값보다 의미 있는 설명 사용
- 테스트가 검증하는 핵심 동작에 집중
```

### 비용 최적화

```yaml
ai_strategy:
  # 무조건 AI 사용
  always_ai:
    - intent_inference
    - business_rule_extraction

  # 휴리스틱 실패 시에만 AI
  fallback_ai:
    - requirement_extraction
    - scenario_enhancement

  # AI 사용 안 함
  no_ai:
    - structure_analysis
    - interface_extraction
    - test_parsing

  # 토큰 제한
  limits:
    max_tokens_per_file: 4000
    max_files_per_batch: 10
    cache_results: true
```

---

## 구현 우선순위 (Serena 기반 - 대폭 간소화)

### 개발 기간 비교

| 항목 | 직접 구현 | Serena 활용 |
|------|----------|-------------|
| Phase 1 (구조) | 4-6주 | 1-2주 |
| Phase 2 (인터페이스) | 4-6주 | 1-2주 |
| Phase 3 (AI 분석) | 2-3주 | 2-3주 (동일) |
| Phase 4 (추가 언어) | 6-8주 | 0주 (불필요) |
| **총합** | **16-23주** | **4-7주** |

### Phase 1: Serena 통합 + 구조 추출 (MVP) ✅ 완료

```
✅ Serena MCP 통합
  ✅ MCP 클라이언트 설정
  ✅ find_symbol 래핑
  ✅ find_referencing_symbols 래핑
  ✅ 연결 테스트

✅ File Scanner (간단)
  ✅ 디렉토리 트리 생성
  ✅ 파일 목록 (언어 감지는 Serena)

✅ Spec Generator (기본)
  ✅ Serena 결과 → domains.yml 변환
  ✅ domain.md 템플릿
  ✅ 기본 spec.md 생성

✅ CLI
  ✅ sdd reverse scan
  ✅ sdd reverse extract --shallow
```

**완료**: v1.2.0
**구현 파일**: `src/core/reverse/scanner.ts`, `src/core/reverse/extractor.ts`

### Phase 2: 상세 추출 + 테스트 연동 ✅ 완료

```
✅ Serena 심화 활용
  ✅ 메서드 시그니처 상세 추출
  ✅ 참조 관계 → 의존성 그래프
  ✅ 에러 타입 추출

✅ 테스트 파서 (간단 - 구조만)
  ✅ describe/it 블록 파싱
  ✅ 테스트명 → 시나리오 힌트
  ✅ GIVEN-WHEN-THEN 추론 (AI)

✅ 코드 링크 자동화
  ✅ spec ↔ code 자동 연결
  ✅ .reverse-meta.json 생성
```

**완료**: v1.2.0
**구현 파일**: `src/core/reverse/spec-generator.ts`, `src/core/reverse/meta.ts`

### Phase 3: AI 분석 + 검토 워크플로우 ✅ 완료

```
✅ Claude 연동 분석
  ✅ 의도 추론 프롬프트
  ✅ 요구사항 생성 프롬프트
  ✅ 시나리오 보강 프롬프트

✅ 신뢰도 시스템
  ✅ 섹션별 신뢰도 계산
  ✅ 검토 필요 항목 자동 표시

✅ 검토 워크플로우
  ✅ sdd reverse review (인터랙티브)
  ✅ sdd reverse finalize
  ✅ 상태 전환 (extracted → draft)
```

**완료**: v1.2.0
**구현 파일**: `src/core/reverse/review.ts`, `src/core/reverse/finalizer.ts`, `src/core/reverse/intent-inferrer.ts`

### Phase 4: ~~추가 언어 지원~~ → 삭제

```
✅ Serena가 30개+ 언어 지원
✅ 추가 구현 불필요
✅ Phase 4 삭제됨
```

**예상 기간**: 0주
**이유**: Serena가 이미 처리

---

## 성공 지표

### 정량 지표

```
- 구조 추출 정확도: > 95%
- 인터페이스 추출 정확도: > 90%
- 테스트 → 시나리오 변환율: > 80%
- AI 요구사항 추론 정확도: > 70%
- 검토 후 최종 정확도: > 95%
```

### 정성 지표

```
- "스펙 작성 시간 50% 이상 단축"
- "레거시 프로젝트 SDD 도입 가능"
- "기존 코드 이해도 향상"
```

---

## 리스크 및 완화

### Serena 관련 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| Serena 프로젝트 중단 | 높음 | 추상화 레이어로 교체 가능하게 설계 |
| Serena API 변경 | 중간 | 버전 고정 + 래퍼 레이어 |
| MCP 연결 실패 | 중간 | 폴백 모드 (기본 파서) 제공 |
| Serena 미설치 환경 | 중간 | 설치 가이드 + 자동 감지 |

**완화 전략: 추상화 레이어**

```typescript
// src/core/reverse/analyzer.ts
interface CodeAnalyzer {
  findSymbols(query: string): Promise<Symbol[]>;
  findReferences(symbol: string): Promise<Reference[]>;
  getDefinition(symbol: string): Promise<Definition>;
}

// Serena 구현
class SerenaAnalyzer implements CodeAnalyzer { ... }

// 폴백: 기본 TS 파서 (Serena 없을 때)
class FallbackAnalyzer implements CodeAnalyzer { ... }
```

### 기타 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| AI 추론 오류 | 높음 | 신뢰도 표시 + 필수 검토 |
| 복잡한 코드 패턴 | 중간 | Serena가 대부분 처리 |
| 대용량 코드베이스 | 중간 | 청크 처리 + 캐싱 |
| 다양한 코딩 스타일 | 중간 | Serena가 대부분 처리 |
| 테스트 없는 코드 | 높음 | 시나리오 수동 추가 유도 |

### Serena 의존성 평가

```
장점:
✅ 개발 기간 70% 단축 (16-23주 → 4-7주)
✅ 30개+ 언어 즉시 지원
✅ IDE 수준 정확도
✅ 유지보수 부담 없음

단점:
⚠️ 외부 의존성 추가
⚠️ MCP 설정 필요
⚠️ Serena 프로젝트 의존

결론:
→ 장점이 압도적으로 큼
→ 추상화 레이어로 리스크 완화 가능
→ Serena 활용 권장
```

---

## 관련 문서

- [로드맵 개요](./overview.md) - Phase 2 코드 컨텍스트 연결과 연계
- [현재 한계점](./current-limits.md) - 브라운필드 지원 강화
