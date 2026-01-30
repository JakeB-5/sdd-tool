# SDD Tool Roadmap v2 (Enhancement)

> **Document Version**: v2.0
> **Created**: 2024-12-24
> **Previous Documents**: scaling-roadmap.md, enterprise-roadmap.md merged and reorganized

---

## Redefining the Tool's Essence

### What sdd-tool is **NOT**

```
  CI/CD tool
  Code analysis engine
  Project management tool
  Enterprise development platform
```

### What sdd-tool **IS**

```
  A frame that forces Claude to "think in a certain way and develop in a certain order"
  Anti-vibe coding thought structuring tool
  Specification -> Design -> Task -> Code generation pipeline
  A tool for documenting agreement points between AI and humans
```

### Core Strengths (What to Maintain)

```
- Improved design quality
- Early structure stabilization
- Prevention of missed considerations
- Simultaneous documentation and code generation
- Individual/small team productivity improvement
```

---

## Realistic Goal Reset

### Original Goals (Excessive)

```
Phase 0-5: Medium-scale (5-15 people)
Phase 6-10: Enterprise (15+ people, 500+ specs)
```

### Revised Goals (Realistic)

```
Phase 0-2: Small-scale optimization (1-5 people) <- Strengthen current best area
Phase 3-5: Reach medium-scale (2-10 people) <- Practical ceiling
Phase 6+: Optional expansion (conditional) <- Only when needed
```

### Suitability by Scale (Honest Assessment)

| Scale | Suitability | Strategy |
|-------|-------------|----------|
| **1 person / Side project** | 5/5 | Best area, strengthen further |
| **Small (2-5 people)** | 5/5 | Core target |
| **Medium (5-10 people)** | 4/5 | Achievable goal |
| **Medium-large (10-20 people)** | 3/5 | Feature units only |
| **Large (20+ people)** | 2/5 | Supplementary tool only |
| **Enterprise** | 1/5 | Not viable as primary tool |

---

## Phase Reorganization

### Overview

```
+-------------------------------------------------------------+
|  Phase 0: Collaboration Foundation (Git Workflow)  [Existing] |
+-------------------------------------------------------------+
|  Phase 1: Spec Scope Separation ***                          |
|    +-- 1-G: Greenfield (Manual domain setup)      [New]      |
|    +-- 1-R: Reverse Extraction (Legacy)           [New]      |
+-------------------------------------------------------------+
|  Phase 2: Code Context Connection                  [New]      |
+-------------------------------------------------------------+
|  Phase 3: Task Graph (DAG)                         [New]      |
+-------------------------------------------------------------+
|  Phase 4: Change-based Work Guidance               [New]      |
+-------------------------------------------------------------+
|  Phase 5: Performance Optimization          [Existing adj.]   |
+-------------------------------------------------------------+
|  Phase 6+: Optional Expansion              [Existing reduced] |
+-------------------------------------------------------------+
```

### Paths by Project Type

```
Greenfield (New Projects):
+---------+    +---------+    +---------+    +---------+
| Phase 0 |--->|Phase 1-G|--->| Phase 2 |--->|Phase 3-4|
|   Git   |    | Manual  |    |Code Link|    |Task DAG |
+---------+    +---------+    +---------+    +---------+

Brownfield (Legacy Projects):
+---------+    +---------+    +---------+    +---------+
| Phase 0 |--->|Phase 1-R|--->| Phase 2 |--->|Phase 3-4|
|   Git   |    | Reverse |    |Code Link|    |Task DAG |
+---------+    +---------+    +---------+    +---------+
                    |
                    v
              Serena MCP Usage
              (30+ language support)
```

**Key Insight**:
- Phase 1-G and 1-R produce the **same output** (domains.yml, domain.md, spec.md)
- Phase 1-R **auto-extracts** from code to generate drafts
- Paths **converge** from Phase 2 (same process)

---

## Phase 0: Collaboration Foundation (Git Workflow)

> **Status**: Existing, content unchanged
> **Document**: [scaling.md#phase-0](./scaling.md#phase-0-collaboration-based-git-workflow)

### Summary

- 0.1 Commit conventions (spec, spec-update, constitution types)
- 0.2 Branch strategy (spec/domain/name pattern)
- 0.3 Spec change workflow
- 0.4 Git Hooks automation
- 0.5 .gitignore and Git configuration
- 0.6 CI integration

### Priority

```
Difficulty: Low
Impact: High (foundation for collaboration)
Prerequisites: None
```

---

## Phase 1: Spec Scope Separation ***

> **Determines 50% of medium-scale success**
> **Two paths**: Greenfield (manual) vs Brownfield (reverse extraction)

### Problem Definition

```
Current:
- Single spec covers entire project
- Context explosion (Claude can't remember everything)
- Unclear impact scope on modifications
- High barrier to SDD adoption for legacy projects

Result:
- Claude says "all done" but things are missing
- Can't automatically understand existing code context
- Humans forced to be "context curators"
- Legacy projects abandon SDD adoption
```

### Common Output (Same for 1-G and 1-R)

Both Phase 1 paths produce the **same structure**:

**Directory Structure**:

```
Current:
.sdd/
├── constitution.md
└── specs/
    └── <feature>/
        ├── spec.md
        ├── plan.md
        └── tasks.md

After change:
.sdd/
├── constitution.md
├── domains.yml              # Domain definitions
└── specs/
    ├── core/                # Domain
    │   ├── domain.md        # Domain overview
    │   └── data-model/      # Feature
    │       ├── spec.md
    │       └── ...
    ├── auth/                # Domain
    │   ├── domain.md
    │   ├── user-login/
    │   ├── oauth/
    │   └── session/
    └── order/               # Domain
        ├── domain.md
        ├── checkout/
        └── payment/
```

**Domain Definition File**:

```yaml
# .sdd/domains.yml
domains:
  core:
    name: "Core Features"
    description: "Data models, common utilities"
    owners: ["@core-team"]

  auth:
    name: "Authentication/Authorization"
    description: "User authentication, permission management"
    owners: ["@security-team"]
    dependencies: [core]

  order:
    name: "Order/Payment"
    description: "Order processing, payment integration"
    owners: ["@commerce-team"]
    dependencies: [core, auth]

# Inter-domain dependency rules
rules:
  - from: order
    to: auth
    allowed: true
  - from: auth
    to: order
    allowed: false  # Prevent cycles
```

**Domain Overview File**:

```markdown
<!-- .sdd/specs/auth/domain.md -->
# Auth Domain

## Overview
Domain responsible for user authentication and permission management

## Scope
- User login/logout
- OAuth 2.0 integration
- Session management
- Permission verification

## Dependencies
- core: User entity, common utilities

## Public Interface
- AuthService.login()
- AuthService.logout()
- AuthService.verify()
- SessionManager.create()
- SessionManager.validate()
```

### CLI Changes

```bash
# Domain management
sdd domain list                    # List domains
sdd domain show auth               # Domain details
sdd domain create billing          # New domain

# Domain-based spec creation
sdd new auth/mfa-setup             # mfa-setup spec in auth domain
sdd new order/refund               # refund spec in order domain

# Domain-based operations
sdd validate --domain auth         # Validate auth domain only
sdd status --domain order          # order domain status
sdd impact auth/user-login         # Impact within domain

# Context limiting (key!)
sdd context auth                   # Load only auth domain for Claude
sdd context auth order             # Load multiple domains
sdd context --current              # Check currently loaded context
```

### Claude Prompt Generation Change

```markdown
Current:
"Read all specs and implement"

After change:
"Current context: auth domain
- Domain overview: auth/domain.md
- Work target: auth/user-login/spec.md
- Dependencies: core domain (read-only)

Ignore other domains. Work only within auth scope."
```

### Effects

```
  Claude context size controllable
  Clear "current work scope"
  Teams can work independently
  Easy to track impact scope
  Greatly reduced chance of omissions
  Legacy projects can adopt SDD (1-R)
```

---

### Phase 1-G: Greenfield (Manual Domain Setup)

> **For new projects - Manual domain structure design**

**Target**:
- Projects starting fresh
- No existing code or refactoring

**Workflow**:

```bash
# 1. Domain design
sdd domain create core          # Core domain
sdd domain create auth          # Auth domain
sdd domain create order         # Order domain

# 2. Set domain dependencies
sdd domain link order --depends-on auth
sdd domain link auth --depends-on core

# 3. Write specs
sdd new auth/user-login         # Manual spec writing
sdd new auth/oauth-google
sdd new order/checkout
```

**Implementation Checklist (1-G)**:

```
[ ] sdd domain create <name>
[ ] sdd domain link --depends-on
[ ] sdd new <domain>/<feature>
[ ] domains.yml manual editing support
[ ] domain.md template
```

**Priority (1-G)**:

```
Difficulty: Low
Impact: High
Prerequisites: Phase 0
```

---

### Phase 1-R: Reverse Extraction (Reverse Spec Extraction)

> **For legacy/brownfield - Auto-generate specs from code**
> **Core Strategy: Serena MCP Usage**

**Target**:
- Projects with existing codebase
- Legacy operating without spec documents
- Teams wanting to lower SDD adoption barrier

**Serena MCP Usage**:

[Serena](https://github.com/oraios/serena) is an MCP server for code analysis:

```
  30+ language support (Python, TS, Java, Go, Rust, C++ etc.)
  Symbol-level code extraction (classes, functions, variables)
  Reference/dependency relationship analysis
  IDE-level semantic analysis
  Native Claude Code/Desktop integration
```

**Direct Implementation vs Serena Usage**:

| Item | Direct Implementation | Serena Usage |
|------|----------------------|--------------|
| Development period | 16-23 weeks | **4-7 weeks** |
| Supported languages | TS/JS only | **30+** |
| AST parsing | Implement directly | Not needed |
| Maintenance | Language-specific updates | Serena handles |

**Workflow**:

```bash
# 1. Scan codebase
sdd reverse scan

# Output:
# src/
# +-- auth/ (3 files, 450 LOC)
# +-- order/ (5 files, 890 LOC)
# +-- core/ (8 files, 1200 LOC)
# Suggested domains: auth, order, core

# 2. Extract specs (using Serena MCP)
sdd reverse extract --depth deep --ai

# Output:
# .sdd/
# +-- domains.yml (auto-generated)
# +-- specs/
#     +-- auth/
#     |   +-- domain.md
#     |   +-- user-authentication/
#     |       +-- spec.md (confidence: 72%)
#     +-- order/
#         +-- ...

# 3. Review and finalize
sdd reverse review              # Interactive review
sdd reverse finalize            # Finalize
```

**Extraction Levels**:

| Level | Target | Automation | Confidence |
|-------|--------|------------|------------|
| Structure | Directory -> Domain | 100% | High |
| Interface | Function signatures, types | 90% | High |
| Behavior | Business logic, rules | 70% | Medium |
| Intent | "Why implemented this way?" | 50% | Low (AI required) |

**Architecture**:

```
+-----------------------------------------------------+
|                 sdd reverse extract                   |
+-----------------------------------------------------+
|  SDD Tool        Serena MCP           SDD Tool       |
|  +---------+     +-------------+     +-----------+   |
|  | Scanner |--->| Symbol/Ref  |--->| Generator |   |
|  |(file    |     | Extract(30+)|     |(Spec gen) |   |
|  | list)   |     +-------------+     +-----------+   |
|  +---------+           |                             |
|                        v                             |
|              Claude (Intent inference)               |
+-----------------------------------------------------+
```

**Risk Mitigation**:

```typescript
// Abstraction layer to manage Serena dependency
interface CodeAnalyzer {
  findSymbols(query: string): Promise<Symbol[]>;
  findReferences(symbol: string): Promise<Reference[]>;
}

class SerenaAnalyzer implements CodeAnalyzer { ... }
class FallbackAnalyzer implements CodeAnalyzer { ... }  // TS only
```

**Implementation Checklist (1-R)**:

```
[ ] Serena MCP client integration
[ ] sdd reverse scan command
[ ] sdd reverse extract command
  [ ] --depth (shallow/medium/deep)
  [ ] --ai (Claude intent inference)
[ ] sdd reverse review (interactive)
[ ] sdd reverse finalize
[ ] Confidence display system
[ ] .reverse-meta.json generation
[ ] Abstraction layer (Serena fallback)
```

**Priority (1-R)**:

```
Difficulty: Medium (reduced thanks to Serena)
Impact: *** Highest (removes legacy adoption barrier)
Prerequisites: Phase 0, Serena MCP installation
```

**Detailed Plan**: [Reverse Spec Extraction Plan](./reverse-extraction.md)

---

### Phase 1 Common Implementation

```
[ ] domains.yml schema definition
[ ] domain.md template
[ ] sdd domain list/show commands
[ ] sdd context command (context limiting)
[ ] Inter-domain dependency validation
[ ] Slash command updates
```

### Phase 1 Priority Summary

| Path | Target | Difficulty | Impact | Prerequisites |
|------|--------|------------|--------|---------------|
| **1-G** | Greenfield | Low | High | Phase 0 |
| **1-R** | Brownfield | Medium | *** Highest | Phase 0 + Serena |

**Recommended Implementation Order**:
1. Phase 1 Common (domains.yml, domain.md) - **First**
2. Phase 1-G (manual domain setup) - **Next** (simple)
3. Phase 1-R (reverse extraction) - **Last** (requires Serena integration)

---

## Phase 2: Code Context Connection

> **New addition - Solve existing code omission problem**

### Problem Definition

```
Current:
- Only specs exist, no connection to existing code
- Claude doesn't know "which files to modify"
- Missing change targets during maintenance

Result:
- "Already exists in code but creates new one"
- "Missed files that should be modified"
- Humans must manually provide file lists
```

### Solution: Spec <-> Code Link Metadata

**Add code links to spec files**:

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

**Code Context Index** (lightweight):

```json
// .sdd/code-index.json (auto-generated)
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

### CLI Changes

```bash
# Code index management
sdd code index                     # Create/update code index
sdd code index --watch             # Auto-update on change detection
sdd code show auth/user-login      # Show linked code for spec

# Link management
sdd link auth/user-login src/auth/AuthService.ts
sdd unlink auth/user-login src/old/OldAuth.ts

# Impact analysis (including code)
sdd impact auth/user-login --code  # Impact analysis including code files
```

**Include code context in Claude prompts**:

```markdown
## Current Task: auth/user-login modification

### Files to Modify
- src/auth/AuthService.ts (implements)
- src/auth/LoginController.ts (implements)

### Related Files (reference only)
- src/core/User.ts
- src/session/SessionManager.ts

### Existing Code Signatures
AuthService:
- login(email: string, password: string): Promise<Session>
- logout(sessionId: string): Promise<void>
- verify(token: string): Promise<User>

Modify these files. Do not touch other files.
```

### Implementation Checklist

```
[ ] code_links frontmatter schema
[ ] sdd code index command
[ ] Auto-generate code index (AST parsing)
[ ] sdd link/unlink commands
[ ] sdd impact --code extension
[ ] Insert code context into Claude prompts
[ ] Comment-based reverse link (@spec auth/user-login)
```

### Priority

```
Difficulty: Medium
Impact: High (makes maintenance realistic)
Prerequisites: Phase 1
```

---

## Phase 3: Task Graph (DAG)

> **New addition - Linear tasks -> Dependency graph**

### Problem Definition

```
Current:
- tasks.md is a linear checklist
- "When 1 is done, do 2, when 2 is done, do 3"

Problem:
- Parallel work not possible
- Difficult to distribute work among team members
- Unclear to Claude "what to do first now"
```

### Solution: DAG-based Task Management

**tasks.md format change**:

```yaml
# tasks.md
tasks:
  - id: AUTH-01
    title: "Define User entity"
    depends_on: []
    assignee: "@alice"
    status: done

  - id: AUTH-02
    title: "AuthService interface"
    depends_on: [AUTH-01]
    assignee: "@bob"
    status: in_progress

  - id: AUTH-03
    title: "LoginController implementation"
    depends_on: [AUTH-02]
    status: pending

  - id: AUTH-04
    title: "OAuth integration"
    depends_on: [AUTH-02]  # Can run parallel with AUTH-03!
    status: pending

  - id: AUTH-05
    title: "Integration tests"
    depends_on: [AUTH-03, AUTH-04]  # Both must finish to start
    status: blocked
```

**Visualization**:

```
AUTH-01 (User entity)
    |
    v
AUTH-02 (AuthService)
    |
    +------------+
    v            v
AUTH-03       AUTH-04
(Controller)  (OAuth)
    |            |
    +-----+------+
          v
      AUTH-05
    (Integration tests)
```

### CLI Changes

```bash
# Task status
sdd tasks auth/user-login          # Task list (graph display)
sdd tasks auth/user-login --ready  # Tasks ready to start now
sdd tasks auth/user-login --blocked # Blocked tasks

# Task progress
sdd task start AUTH-03             # Start task
sdd task done AUTH-03              # Complete task
sdd task block AUTH-05 "Waiting for AUTH-04"

# Graph visualization
sdd tasks auth/user-login --graph  # Mermaid output
sdd tasks auth/user-login --visual # View in browser
```

**Claude prompt improvement**:

```markdown
## Currently Executable Tasks

Choose one of the following tasks to implement:

1. AUTH-03: LoginController implementation
   - Prerequisite complete: AUTH-02
   - Expected file: src/auth/LoginController.ts

2. AUTH-04: OAuth integration
   - Prerequisite complete: AUTH-02
   - Expected file: src/auth/OAuthProvider.ts

## Blocked Tasks (not yet)
- AUTH-05: Integration tests (needs AUTH-03, AUTH-04 complete)
```

### Implementation Checklist

```
[ ] tasks.yaml schema (DAG structure)
[ ] Dependency validation (cycle detection)
[ ] sdd tasks --ready command
[ ] sdd task start/done/block
[ ] Mermaid graph output
[ ] Browser visualization
[ ] Highlight executable tasks in Claude prompts
```

### Priority

```
Difficulty: Medium
Impact: High (team parallel work)
Prerequisites: Phase 1
```

---

## Phase 4: Change-based Work Guidance

> **New addition - Full regeneration NO, process only changes YES**

### Problem Definition

```
Current:
- When spec changes, "review everything again"
- Claude tries to regenerate unchanged parts too

Problem:
- Unnecessary token consumption
- Risk of overwriting existing code
- Hard to understand "what changed"
```

### Solution: Spec Diff-based Work Guidance

**Spec change detection**:

```bash
sdd diff auth/user-login           # Changes from last commit
sdd diff auth/user-login --staged  # Changes from staging
```

**Change output example**:

```diff
## Requirements

- REQ-001: Password must be 8 chars
+ REQ-001: Password must be 12 chars (MODIFIED)

+ REQ-004: Support biometric login (ADDED)

- REQ-003: Remember me checkbox (REMOVED)
```

**Auto task generation**:

```bash
sdd diff auth/user-login --tasks   # Generate tasks based on changes
```

```yaml
# Auto-generated tasks
tasks:
  - id: CHANGE-01
    type: modify
    target: REQ-001
    description: "Change password length 8 -> 12"
    affected_code:
      - src/auth/validators/password.ts

  - id: CHANGE-02
    type: add
    target: REQ-004
    description: "Add biometric login"

  - id: CHANGE-03
    type: remove
    target: REQ-003
    description: "Remove Remember me feature"
    affected_code:
      - src/auth/LoginController.ts
      - src/auth/components/RememberMe.tsx
```

**Claude prompt**:

```markdown
## Spec Changes (process only these)

### Modified: REQ-001
Before: Password must be 8 chars
After: Password must be 12 chars

Affected file: src/auth/validators/password.ts
-> Change PASSWORD_MIN_LENGTH to 12 in this file.

### Added: REQ-004
New requirement: Support biometric login
-> New file creation needed.

### Removed: REQ-003
Removed: Remember me checkbox
Affected file: src/auth/LoginController.ts
-> Remove rememberMe related code.

Do not modify existing code beyond the changes above.
```

### Implementation Checklist

```
[ ] sdd diff command (spec diff)
[ ] Change type classification (ADDED/MODIFIED/REMOVED)
[ ] sdd diff --tasks (auto task generation)
[ ] Auto-link affected code (Phase 2 integration)
[ ] Highlight only changes in Claude prompts
[ ] Enforce "don't touch unchanged parts"
```

### Priority

```
Difficulty: Medium
Impact: High (maintenance core)
Prerequisites: Phase 2
```

---

## Phase 5: Performance Optimization

> **Existing Phase 1 adjusted - Priority lowered**

### Changes

```
Original: Phase 1 (top priority)
Changed: Phase 5 (after Phase 1-4)

Reason:
- Performance issues minimal with under 100 specs
- Scope separation (Phase 1) more important than performance
- Works fine without indexing at medium scale
```

### Content (Reduced)

```
5.1 Index Cache (optional)
    - .sdd/index.json
    - Only needed for 100+ specs

5.2 Search Optimization (optional)
    - Full-text search
    - Query DSL
```

### Priority

```
Difficulty: Medium
Impact: Medium (meaningful only at 100+ specs)
Prerequisites: Phase 1-4
```

---

## Phase 6+: Optional Expansion (Significantly Reduced)

> **Re-evaluation of existing Phase 2-10**

### Realistic Assessment

```
Original plan:
- Domain separation -> Moved to Phase 1 (essential)
- Review workflow -> Deleted (Git PR sufficient)
- External integration -> Reduced (GitHub only)
- Dashboard -> Deleted (over-engineering)
- Server-based -> Deleted (out of scope)
- RBAC -> Deleted (out of scope)
- Audit logs -> Deleted (out of scope)
```

### What Remains (Optional)

```
6.1 GitHub Issues Integration (optional)
    - Spec -> Issue sync
    - Simple level only

6.2 VSCode Extension (optional)
    - Spec preview
    - @spec autocomplete

6.3 Multi-agent (future)
    - Separate Spec Agent, Architect Agent
    - Essential for large-scale but currently out of scope
```

### Deleted/Deferred Items

```
  SDD Server (platformization needed = new product)
  PostgreSQL/Elasticsearch (over-engineering)
  RBAC/Audit logs (enterprise = out of scope)
  Real-time collaboration (Git sufficient)
  Web dashboard (terminal sufficient)
```

---

## Final Priority Summary

| Phase | Feature | Difficulty | Impact | Required |
|-------|---------|------------|--------|----------|
| **0** | Git Workflow | Low | High | Required |
| **1 Common** | Domain Schema | Low | High | Required |
| **1-G** | Greenfield (manual) | Low | High | Required |
| **1-R** | Brownfield (reverse) | Medium | *** Highest | Conditional |
| **2** | Code Context Connection | Medium | High | Required |
| **3** | Task Graph (DAG) | Medium | High | Required |
| **4** | Change-based Work Guidance | Medium | High | Required |
| **5** | Performance Optimization | Medium | Medium | Conditional |
| **6** | GitHub Integration | Medium | Medium | Optional |
| **6** | VSCode Extension | High | High | Optional |

### Dependency Graph

```
Phase 0 (Git)
    |
    +------------------------+
    v                        v
Phase 1 Common <-------------+
(domains.yml, domain.md)
    |
    +------------------+
    v                  v
Phase 1-G          Phase 1-R
(manual setup)     (reverse, Serena)
    |                  |
    +--------+---------+
             v
         Phase 2 <-------- (convergence point)
    (Code context connection)
             |
             v
         Phase 3
      (Task DAG)
             |
             v
         Phase 4
    (Change-based work)
             |
    +--------+--------+
    v                 v
Phase 5            Phase 6
(Performance,      (Expansion,
 conditional)       optional)
```

---

## Milestones

### v1.x: Small-scale Optimization (Current)

```
  Basic CLI
  Spec validation (RFC 2119, GIVEN-WHEN-THEN)
  Constitution system
  Impact analysis (basic)
  Export (HTML/JSON/MD)
```

### v2.0: Medium-scale Foundation (Phase 0 + 1)

```
[ ] Phase 0: Git Workflow
[ ] Phase 1 Common: domains.yml, domain.md schema
[ ] Phase 1-G: Greenfield domain setup
```

**Goal**: Domain-based spec management in new projects

### v2.1: Legacy Adoption Path (Phase 1-R)

```
[ ] Serena MCP integration
[ ] Phase 1-R: Reverse spec extraction
  [ ] sdd reverse scan/extract/review/finalize
  [ ] Confidence system
  [ ] Review workflow
```

**Goal**: Remove legacy project SDD adoption barrier

### v2.5: Maintenance Enhancement (Phase 2 + 3)

```
[ ] Phase 2: Code context connection
  [ ] spec <-> code link
  [ ] sdd code index
[ ] Phase 3: Task graph (DAG)
  [ ] Dependency-based tasks
  [ ] Parallel work support
```

**Goal**: Stable operation for 2-5 person teams

### v3.0: Medium-scale Completion (Phase 4)

```
[ ] Phase 4: Change-based work guidance
  [ ] sdd diff (spec change detection)
  [ ] Change -> auto task
```

**Goal**: Scale to 5-10 person teams

### v3.5: Optional Expansion (Phase 5-6)

```
[ ] Phase 5: Performance optimization (conditional)
[ ] Phase 6: GitHub integration, VSCode extension (optional)
```

**Goal**: Usability improvement and ecosystem expansion

---

## Relationship with Existing Documents

| Existing Document | Status | Notes |
|-------------------|--------|-------|
| scaling-roadmap.md | Maintained | Reference for Phase 0 details |
| enterprise-roadmap.md | Deferred | Out of scope, reference only |
| limitations.md | Maintained | Explicitly state realistic limits |
| reverse-spec-plan.md | New | Phase 1-R detailed plan |
| roadmap-v2.md (this document) | New | Enhanced roadmap (integrated) |

---

## Core Message

### This Tool's Proper Position

```
"A small but smart scalpel"
"Not a chainsaw for cutting enterprise"
```

### Realistic Goals

```
The best tool for small to medium new development
Limited as a general-purpose large project framework
```

### What to Focus On

```
  Phase 1-G: Domain separation (Greenfield foundation)
  Phase 1-R: Reverse extraction (Remove brownfield adoption barrier)
  Phase 2-4: Existing code connection + change management
  Give up enterprise feature ambitions
```

---

## Related Documentation

- [Current Limitations](./current-limits.md)
- [Scaling Roadmap (Phase 0 details)](./scaling.md)
- [Reverse Spec Extraction Plan (Phase 1-R details)](./reverse-extraction.md)
- [Enterprise Roadmap (reference)](./enterprise.md)
