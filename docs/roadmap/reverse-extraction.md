# Reverse Spec Extraction

> **Document Status**: Implemented (v1.2.0)
> **Created**: 2024-12-24
> **Updated**: 2025-12-29
> **Purpose**: Code -> Spec reverse extraction for SDD adoption in legacy/existing projects
> **Core Strategy**: Leveraging Serena MCP significantly reduces development difficulty
> **Related Docs**: [CLI Reference](/cli/reverse), [Slash Commands](/commands/sdd-reverse), [Reverse Extraction Guide](/guide/reverse-extraction)

---

## Core Strategy: Leveraging Serena MCP

### What is Serena?

[Serena](https://github.com/oraios/serena) is an MCP server for code analysis:

```
  30+ language support (Python, TS, Java, Go, Rust, C++ etc.)
  Symbol-level code extraction (classes, functions, variables)
  Reference/dependency relationship analysis
  IDE-level semantic analysis
  Native Claude Code/Desktop integration
```

### Why Serena?

**Direct Implementation vs Serena Usage Comparison**:

| Item | Direct Implementation | Serena Usage |
|------|----------------------|--------------|
| **AST parser development** | Implement per language | Not needed |
| **Supported languages** | TS/JS only (initial) | 30+ immediately |
| **Symbol extraction** | Direct with ts-morph etc. | `find_symbol` API |
| **Reference analysis** | Implement directly | `find_referencing_symbols` |
| **Development period** | Several months | A few weeks |
| **Maintenance** | Language-specific updates needed | Serena handles |

**Conclusion**: Delegate to Serena MCP instead of direct parser implementation

### Architecture Change

```
Original Plan:
+-----------+     +-----------+     +-----------+
|  Scanner  |---->| AST Parser|---->|  Analyzer |
| (direct)  |     |  (direct) |     |  (direct) |
+-----------+     +-----------+     +-----------+
        |               |                 |
     Development difficulty: High, per-language implementation needed

Changed Plan:
+-----------+     +-----------+     +-----------+
|  Scanner  |---->|Serena MCP |---->|  Analyzer |
|  (simple) |     | (external)|     |  (focus)  |
+-----------+     +-----------+     +-----------+
        |               |                 |
     File list     Symbol/ref       Focus on
       only        extraction       spec generation
```

### Serena MCP Usage Methods

**1. Integrate as MCP Client**:

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

**2. Or use directly in Claude Code session**:

```bash
# After configuring Serena MCP in Claude Code
sdd reverse extract --use-mcp serena
```

Claude directly calls Serena tools for analysis.

### Role Distribution

| Role | Owner | Notes |
|------|-------|-------|
| **File scanning** | SDD Tool | Directory tree, file list |
| **Symbol extraction** | Serena | find_symbol |
| **Reference analysis** | Serena | find_referencing_symbols |
| **Dependency graph** | Serena + SDD | Process Serena data |
| **Spec generation** | SDD Tool | Templates, formatting |
| **AI intent inference** | Claude | Prompt-based |
| **Review workflow** | SDD Tool | CLI interaction |

---

## Background and Motivation

### Current Problem

```
Biggest barrier to SDD adoption:
"We already have code, do we need to write specs from scratch?"

Reality:
- Legacy projects have no spec documents
- Manual spec writing = huge initial cost
- Teams abandon SDD adoption due to cost
```

### Solution Direction

```
Code -> Spec reverse extraction automation
"Automatically generate spec drafts by analyzing existing code"

Effects:
- Greatly reduced SDD adoption barrier
- Legacy projects can gradually transition to SDD
- Resolve "documentation debt"
```

---

## Feature Overview

### Command Structure

```bash
# Full project analysis
sdd reverse scan                    # Scan codebase
sdd reverse extract                 # Generate spec drafts
sdd reverse review                  # Review/modify generated specs

# Target specific module/file
sdd reverse extract src/auth/       # Directory unit
sdd reverse extract src/auth/AuthService.ts  # File unit

# Options
sdd reverse extract --depth shallow # Shallow analysis (fast)
sdd reverse extract --depth deep    # Deep analysis (accurate)
sdd reverse extract --ai            # AI-assisted analysis
sdd reverse extract --dry-run       # Preview only
```

### Output

```
Input: Existing codebase
      src/
      +-- auth/
      |   +-- AuthService.ts
      |   +-- LoginController.ts
      |   +-- TokenRepository.ts
      +-- order/
          +-- OrderService.ts
          +-- PaymentAdapter.ts

Output: Spec drafts (review needed)
      .sdd/
      +-- domains.yml
      +-- specs/
          +-- auth/
          |   +-- domain.md
          |   +-- user-authentication/
          |   |   +-- spec.md (draft)
          |   |   +-- .reverse-meta.json
          |   +-- token-management/
          |       +-- spec.md (draft)
          +-- order/
              +-- domain.md
              +-- order-processing/
                  +-- spec.md (draft)
```

---

## Extraction Level Definitions

### Level 1: Structure Extraction

```
Target:
- Directory structure -> Domain structure
- File/class -> Feature unit
- Public API -> Interface definition

Difficulty: Low
Accuracy: High
Automation: 100% possible
```

**Example Output**:

```yaml
# .sdd/domains.yml (auto-generated)
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

### Level 2: Interface Extraction

```
Target:
- Class/function signatures
- Input/output types
- Dependency relationships
- Error types

Difficulty: Medium
Accuracy: High
Automation: 90% possible (when type info available)
```

**Example Output**:

```markdown
<!-- spec.md draft -->
# User Authentication

## Extracted Interface

### AuthService

| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `login` | `email: string, password: string` | `Promise<Session>` | (inference needed) |
| `logout` | `sessionId: string` | `Promise<void>` | (inference needed) |
| `verify` | `token: string` | `Promise<User \| null>` | (inference needed) |

### Dependencies
- `TokenRepository` (direct)
- `UserRepository` (direct)
- `bcrypt` (external)
```

### Level 3: Behavior Extraction

```
Target:
- Business logic patterns
- Conditionals/branches -> Rules
- Error handling -> Exception cases
- Test cases -> Scenarios

Difficulty: High
Accuracy: Medium (AI assistance needed)
Automation: 60-70%
```

**Example Output**:

```markdown
## Inferred Requirements

### REQ-001: Login (inferred)
- Authenticate with email and password
- Password verified with bcrypt (confirmed in code)
- Return Session on success
- Throw AuthenticationError on failure

### REQ-002: Session Verification (inferred)
- Verify JWT token
- Return null for expired token
- Return User object for valid token

## Inferred Scenarios

### SCENARIO-001: Normal login (extracted from tests)
```gherkin
GIVEN valid email "user@example.com"
AND correct password "password123"
WHEN login() called
THEN Session object returned
AND Session.userId is the user's ID
```

### SCENARIO-002: Wrong password (extracted from tests)
```gherkin
GIVEN valid email "user@example.com"
AND wrong password "wrong"
WHEN login() called
THEN AuthenticationError thrown
```
```

### Level 4: Intent Extraction - AI Required

```
Target:
- "Why was it implemented this way"
- Business context
- Implicit rules
- Hints from comments/documentation

Difficulty: Very high
Accuracy: Low-Medium (review mandatory)
Automation: 40-50% (AI assisted)
```

**Example Output**:

```markdown
## Inferred Business Context (Review Needed)

### Authentication Policy (AI inference)
> AI inferred this from code and comments. Please review.

- Session expiry: 24 hours (found `24 * 60 * 60 * 1000` in code)
- Remember Me: 30 day extension (found comment "extend to 30 days if remember")
- Concurrent sessions: No limit (no related logic found)

### Security Requirements (AI inference)
- Password hashing: bcrypt, rounds=10
- Token algorithm: HS256 (jsonwebtoken config)
- Rate limiting: Not implemented (no related code)
```

---

## Technical Implementation (Serena MCP Based)

### Architecture

```
+-------------------------------------------------------------+
|                    sdd reverse extract                        |
+-------------------------------------------------------------+
|                                                               |
|  +------------------------------------------------------+    |
|  |               SDD Tool (we implement)                 |    |
|  |  +--------------+  +--------------+                   |    |
|  |  | File Scanner |  | Test Parser  |  <- Simple parsing|    |
|  |  +------+-------+  +------+-------+                   |    |
|  |         +--------+--------+                           |    |
|  +------------------+----------------------------------------+
|                     v                                         |
|  +------------------------------------------------------+    |
|  |            Serena MCP (external - core analysis)      |    |
|  |                                                        |    |
|  |  * find_symbol          -> Symbol extraction          |    |
|  |  * find_referencing_symbols -> Reference analysis     |    |
|  |  * get_symbol_definition -> Definition lookup         |    |
|  |  * 30+ languages auto support                         |    |
|  |                                                        |    |
|  +------------------+------------------------------------+    |
|                     v                                         |
|  +------------------------------------------------------+    |
|  |              SDD Tool (we implement)                  |    |
|  |  +------------------------------------------------+   |    |
|  |  |              Spec Generator                     |   |    |
|  |  |  * Serena result -> Domain structure conversion |   |    |
|  |  |  * Spec template application                    |   |    |
|  |  |  * Confidence calculation                       |   |    |
|  |  +------------------------------------------------+   |    |
|  |  +------------------------------------------------+   |    |
|  |  |              AI Analyzer (Claude)              |   |    |
|  |  |  * Intent inference                            |   |    |
|  |  |  * Business rule extraction                    |   |    |
|  |  +------------------------------------------------+   |    |
|  |  +------------------------------------------------+   |    |
|  |  |              Review Workflow                   |   |    |
|  |  |  * Review CLI                                  |   |    |
|  |  |  * Finalization process                        |   |    |
|  |  +------------------------------------------------+   |    |
|  +------------------------------------------------------+    |
|                                                               |
+-------------------------------------------------------------+
```

### Development Scope Change

**Direct Implementation (Minimized)**:
```
[ ] File Scanner - Directory/file list (simple)
[ ] Test Parser - describe/it structure only (simple)
[ ] Serena Client - MCP call wrapper (simple)
[ ] Spec Generator - Template application (core)
[ ] Review Workflow - CLI interaction (core)
```

**Delegated to Serena (Complex Parts)**:
```
  AST parsing - 30+ languages
  Symbol extraction - Classes, functions, variables
  Reference analysis - Dependency graph
  Type info - Signatures, parameters
```

### Supported Languages

| Language | Serena Support | Additional Implementation | Notes |
|----------|---------------|--------------------------|-------|
| TypeScript | Yes | None | Ready |
| JavaScript | Yes | None | Ready |
| Python | Yes | None | Ready |
| Go | Yes | None | Ready |
| Java | Yes | None | Ready |
| Rust | Yes | None | Ready |
| C/C++ | Yes | None | Ready |
| ... | Yes | None | 30+ languages |

**Conclusion**: No per-language parser implementation needed

### Core Modules

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

#### 2. AST Parser (TypeScript example)

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
  body?: string;  // For AI analysis
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
  // GIVEN-WHEN-THEN inference
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
  sources: string[];   // Inference basis
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
  reviewMode: boolean;  // Show review needed markers
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

## Output Format

### Spec Draft Template

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

> **Auto-extracted spec**: This document was auto-extracted from code.
> Please review and supplement missing content.

## Overview

<!-- AI inference or extracted from comments -->
Functionality that handles user authentication.

**Extraction confidence**: 72% (review needed)

## Extracted Interface

### AuthService

| Method | Signature | Confidence |
|--------|-----------|------------|
| login | `(email: string, password: string) => Promise<Session>` | 100% |
| logout | `(sessionId: string) => Promise<void>` | 100% |
| verify | `(token: string) => Promise<User \| null>` | 100% |

### Dependencies

- `TokenRepository` - Confirmed
- `UserRepository` - Confirmed
- `EmailService` - Inferred (review needed)

## Requirements (Inferred)

> Requirements inferred from code. Verify if they match business intent.

### REQ-001: Email/Password Login [Confidence: 85%]

Users should be able to log in with email and password.

**Basis**:
- `AuthService.login(email, password)` signature
- bcrypt password verification logic exists

**Review Needed**:
- [ ] Confirm email format validation rules
- [ ] Confirm password complexity rules

### REQ-002: JWT Token Issuance [Confidence: 90%]

JWT token should be issued on successful login.

**Basis**:
- jsonwebtoken package used
- `TokenRepository.create()` called

### REQ-003: Session Expiration [Confidence: 70%]

Session should expire after 24 hours.

**Basis**:
- Code: `expiresIn: 24 * 60 * 60 * 1000`

**Review Needed**:
- [ ] Confirm 24 hours matches business requirement
- [ ] Confirm Remember Me feature existence

## Scenarios (Extracted from Tests)

### SCENARIO-001: Normal Login [Confidence: 95%]

**Source**: `tests/auth/login.test.ts:15`

```gherkin
GIVEN registered user "user@example.com"
AND correct password "ValidPass123"
WHEN login attempt
THEN session token returned
AND session expiration time set
```

### SCENARIO-002: Wrong Password [Confidence: 95%]

**Source**: `tests/auth/login.test.ts:28`

```gherkin
GIVEN registered user "user@example.com"
AND wrong password "wrong"
WHEN login attempt
THEN AuthenticationError thrown
AND error message "Invalid credentials"
```

### SCENARIO-003: Unregistered User [Confidence: 90%]

**Source**: `tests/auth/login.test.ts:41`

```gherkin
GIVEN unregistered email "unknown@example.com"
WHEN login attempt
THEN UserNotFoundError thrown
```

## Possible Omissions (Review Needed)

> The following items were not clearly confirmed in code.

- [ ] **Rate Limiting**: No login attempt limiting logic found
- [ ] **Account Lockout**: No account lockout after consecutive failures found
- [ ] **Password Reset**: No password reset flow found
- [ ] **2FA/MFA**: No multi-factor authentication logic found

## Code Links

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

## Extraction Metadata

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

## Workflow

### Step 1: Scan

```bash
$ sdd reverse scan

Scanning codebase...

Discovered structure:
  src/
  +-- auth/ (3 files, 450 LOC)
  |   +-- AuthService.ts
  |   +-- LoginController.ts
  |   +-- TokenRepository.ts
  +-- order/ (5 files, 890 LOC)
  |   +-- ...
  +-- core/ (8 files, 1200 LOC)
      +-- ...

Summary:
  - Language: TypeScript (100%)
  - Files: 16
  - LOC: 2,540
  - Tests: 12 files

Suggested domains:
  1. auth (3 files) - Authentication related
  2. order (5 files) - Order related
  3. core (8 files) - Common modules

Run 'sdd reverse extract' to continue
```

### Step 2: Extract

```bash
$ sdd reverse extract --depth deep --ai

Extracting specs...

[1/3] Analyzing auth domain...
  +-- Structure analysis... done
  +-- Interface extraction... done
  +-- Test analysis... done (8 scenarios)
  +-- AI intent inference... done

[2/3] Analyzing order domain...
  +-- ...

[3/3] Analyzing core domain...
  +-- ...

Generated specs:
  .sdd/
  +-- domains.yml
  +-- specs/
      +-- auth/
      |   +-- domain.md
      |   +-- user-authentication/
      |       +-- spec.md (confidence: 72%)
      +-- order/
      |   +-- ...
      +-- core/
          +-- ...

Review items: 12
  - auth/user-authentication: 5
  - order/checkout: 4
  - core/user-model: 3

Next step: 'sdd reverse review' to start review
```

### Step 3: Review

```bash
$ sdd reverse review

Specs pending review: 6

[1/6] auth/user-authentication (confidence: 72%)

Review items:
  1. REQ-003: Session expiration 24 hours - Is this correct? (y/n/edit)
  > y

  2. Rate Limiting not found - Intentionally omitted? (y/n/add)
  > add
  > Enter description: Lock for 10 minutes after 5 failed login attempts

  3. 2FA not found - Intentionally omitted? (y/n/add)
  > y (not supported currently)

auth/user-authentication review complete
   Confidence: 72% -> 95% (reviewed)

[2/6] Next spec...
```

### Step 4: Finalize

```bash
$ sdd reverse finalize

Reviewed specs:
  - auth/user-authentication (95%)
  - auth/token-management (88%)
  - order/checkout (91%)

Not reviewed:
  - order/payment (needs review)
  - core/user-model (needs review)

Apply finalized specs? (y/n)
> y

Specs finalized
  - status: draft -> extracted
  - needs_review: true -> false

Next steps:
  1. 'sdd validate' to validate specs
  2. Manual supplementation if needed
  3. 'sdd status' to check progress
```

---

## AI Integration Strategy

### Prompt Design

#### Intent Inference Prompt

```markdown
Analyze the following TypeScript code and infer business intent.

## Code
```typescript
{code}
```

## Context
- File: {file_path}
- Class: {class_name}
- Related code: {related_files}

## Request
1. What is the business purpose of this code?
2. What requirements does it implement?
3. Are there any implicit rules?

## Output Format
- Write requirements with RFC 2119 keywords (MUST, SHOULD, MAY)
- Show confidence level 0-100
- State inference basis
```

#### Scenario Generation Prompt

```markdown
Convert the following test code to GIVEN-WHEN-THEN scenarios.

## Test Code
```typescript
{test_code}
```

## Output Format
```gherkin
GIVEN [precondition]
AND [additional condition]
WHEN [action]
THEN [result]
AND [additional verification]
```

## Rules
- Use business terms over technical terms
- Use meaningful descriptions over concrete values
- Focus on core behavior being tested
```

### Cost Optimization

```yaml
ai_strategy:
  # Always use AI
  always_ai:
    - intent_inference
    - business_rule_extraction

  # Use AI only when heuristics fail
  fallback_ai:
    - requirement_extraction
    - scenario_enhancement

  # Never use AI
  no_ai:
    - structure_analysis
    - interface_extraction
    - test_parsing

  # Token limits
  limits:
    max_tokens_per_file: 4000
    max_files_per_batch: 10
    cache_results: true
```

---

## Implementation Priority (Serena Based - Significantly Simplified)

### Development Period Comparison

| Item | Direct Implementation | Serena Usage |
|------|----------------------|--------------|
| Phase 1 (Structure) | 4-6 weeks | 1-2 weeks |
| Phase 2 (Interface) | 4-6 weeks | 1-2 weeks |
| Phase 3 (AI Analysis) | 2-3 weeks | 2-3 weeks (same) |
| Phase 4 (Additional languages) | 6-8 weeks | 0 weeks (not needed) |
| **Total** | **16-23 weeks** | **4-7 weeks** |

### Phase 1: Serena Integration + Structure Extraction (MVP) - Complete

```
  Serena MCP integration
    MCP client setup
    find_symbol wrapping
    find_referencing_symbols wrapping
    Connection test

  File Scanner (simple)
    Directory tree generation
    File list (language detection via Serena)

  Spec Generator (basic)
    Serena result -> domains.yml conversion
    domain.md template
    Basic spec.md generation

  CLI
    sdd reverse scan
    sdd reverse extract --shallow
```

**Complete**: v1.2.0
**Implementation files**: `src/core/reverse/scanner.ts`, `src/core/reverse/extractor.ts`

### Phase 2: Detailed Extraction + Test Integration - Complete

```
  Serena deep usage
    Detailed method signature extraction
    Reference relationship -> Dependency graph
    Error type extraction

  Test parser (simple - structure only)
    describe/it block parsing
    Test name -> Scenario hint
    GIVEN-WHEN-THEN inference (AI)

  Code link automation
    spec <-> code auto-linking
    .reverse-meta.json generation
```

**Complete**: v1.2.0
**Implementation files**: `src/core/reverse/spec-generator.ts`, `src/core/reverse/meta.ts`

### Phase 3: AI Analysis + Review Workflow - Complete

```
  Claude integration analysis
    Intent inference prompt
    Requirement generation prompt
    Scenario enhancement prompt

  Confidence system
    Per-section confidence calculation
    Auto-mark review items

  Review workflow
    sdd reverse review (interactive)
    sdd reverse finalize
    Status transition (extracted -> draft)
```

**Complete**: v1.2.0
**Implementation files**: `src/core/reverse/review.ts`, `src/core/reverse/finalizer.ts`, `src/core/reverse/intent-inferrer.ts`

### Phase 4: ~~Additional Language Support~~ -> Deleted

```
  Serena supports 30+ languages
  No additional implementation needed
  Phase 4 deleted
```

**Expected period**: 0 weeks
**Reason**: Serena handles it

---

## Success Metrics

### Quantitative Metrics

```
- Structure extraction accuracy: > 95%
- Interface extraction accuracy: > 90%
- Test -> Scenario conversion rate: > 80%
- AI requirement inference accuracy: > 70%
- Post-review final accuracy: > 95%
```

### Qualitative Metrics

```
- "Spec writing time reduced by 50%+"
- "Legacy projects can now adopt SDD"
- "Improved understanding of existing code"
```

---

## Risks and Mitigation

### Serena-related Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Serena project discontinued | High | Design abstraction layer for replaceable |
| Serena API changes | Medium | Version pinning + wrapper layer |
| MCP connection failure | Medium | Provide fallback mode (basic parser) |
| Environment without Serena | Medium | Installation guide + auto-detection |

**Mitigation Strategy: Abstraction Layer**

```typescript
// src/core/reverse/analyzer.ts
interface CodeAnalyzer {
  findSymbols(query: string): Promise<Symbol[]>;
  findReferences(symbol: string): Promise<Reference[]>;
  getDefinition(symbol: string): Promise<Definition>;
}

// Serena implementation
class SerenaAnalyzer implements CodeAnalyzer { ... }

// Fallback: Basic TS parser (without Serena)
class FallbackAnalyzer implements CodeAnalyzer { ... }
```

### Other Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI inference errors | High | Confidence display + mandatory review |
| Complex code patterns | Medium | Serena handles most |
| Large codebases | Medium | Chunk processing + caching |
| Various coding styles | Medium | Serena handles most |
| Code without tests | High | Guide manual scenario addition |

### Serena Dependency Assessment

```
Advantages:
  70% development period reduction (16-23 weeks -> 4-7 weeks)
  30+ languages immediately
  IDE-level accuracy
  No maintenance burden

Disadvantages:
  External dependency added
  MCP setup required
  Depends on Serena project

Conclusion:
-> Advantages are overwhelmingly greater
-> Risks mitigated through abstraction layer
-> Serena usage recommended
```

---

## Related Documentation

- [Roadmap Overview](./overview.md) - Links with Phase 2 Code Context Connection
- [Current Limitations](./current-limits.md) - Brownfield support enhancement
