# Scaling Roadmap

A feature roadmap for scaling SDD Tool to medium-scale SaaS (5-15 people, 50-150 specs).

## Goals

- Smooth performance with 150+ specs
- Multi-team independent operation + global consistency
- Systematic review/approval workflow
- Integration with external tools

---

## Phase 0: Collaboration Foundation (Git Workflow)

> **Top Implementation Priority**: Foundation for collaboration that must precede technical features

### 0.1 Commit Conventions

**Purpose**: Easy tracking of spec changes, automated change history generation

#### Conventional Commits Extension

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Type Definitions**:

| Type | Description | Example |
|------|-------------|---------|
| `spec` | New spec creation | `spec(auth): add user-login specification` |
| `spec-update` | Spec content modification | `spec-update(auth): add MFA requirements to user-login` |
| `spec-status` | Spec status change | `spec-status(auth): user-login draft -> review` |
| `plan` | Implementation plan | `plan(auth): add implementation plan for user-login` |
| `tasks` | Task breakdown | `tasks(auth): break down user-login into 5 tasks` |
| `constitution` | Constitution change | `constitution: add security principles (v1.1.0)` |
| `sdd-config` | SDD configuration change | `sdd-config: add billing domain` |

**Scope Rules**:

```
# Domain/spec hierarchy structure
spec(auth): ...                    # Entire domain
spec(auth/user-login): ...         # Specific spec
spec(auth,billing): ...            # Multiple domains

# Special scopes
spec(*): ...                       # Affects all specs
constitution: ...                  # Constitution (no scope)
```

**Footer Usage**:

```
spec(billing): add subscription-model specification

New subscription model spec:
- Monthly/yearly plan definitions
- Upgrade/downgrade rules
- Promo code handling

Refs: #123
Breaking-Spec: payment-gateway (payment flow change required)
Depends-On: user-auth, billing/pricing
```

#### Commit Message Template

```bash
# .gitmessage
# <type>(<scope>): <subject>
# |<---- within 50 chars ---->|

# Body (optional)
# |<---- within 72 chars ---->|

# Footer (optional)
# Refs: #issue-number
# Breaking-Spec: affected-spec
# Depends-On: dependency-spec
# Reviewed-By: @reviewer
```

**Configuration**:

```bash
git config commit.template .gitmessage
```

---

### 0.2 Branch Strategy

#### Branch Model for Spec Development

```
main (or master)
  |
  +-- spec/auth/user-login        # Individual spec work
  +-- spec/billing/subscription
  |
  +-- spec-bundle/q1-features     # Related spec bundle
  |
  +-- constitution/v2.0           # Constitution changes
```

**Branch Naming Rules**:

| Pattern | Purpose | Example |
|---------|---------|---------|
| `spec/<domain>/<name>` | Individual spec | `spec/auth/user-login` |
| `spec-bundle/<name>` | Spec bundle | `spec-bundle/payment-v2` |
| `constitution/<version>` | Constitution | `constitution/v2.0` |
| `sdd-infra/<name>` | SDD config/structure | `sdd-infra/add-billing-domain` |

#### Workflow

```
1. Start spec work
   main --> spec/auth/user-login

2. Spec writing & review
   Work on spec/auth/user-login
   Create PR -> Review -> Approve

3. Merge
   spec/auth/user-login --> main
   (squash merge recommended)

4. Delete branch
   Delete spec/auth/user-login
```

#### Protection Rules

```yaml
# GitHub Branch Protection example
main:
  required_reviews: 2
  required_status_checks:
    - sdd-validate
    - sdd-lint
  restrictions:
    - dismiss_stale_reviews: true

# Spec branches are flexible
spec/*:
  required_reviews: 0
  allow_force_push: true
```

---

### 0.3 Spec Change Workflow

#### Single Spec Change

```bash
# 1. Create branch
git checkout -b spec/auth/user-login

# 2. Write spec
sdd new auth/user-login

# 3. Validate
sdd validate auth/user-login

# 4. Commit
git add .sdd/specs/auth/user-login/
git commit -m "spec(auth): add user-login specification

User login feature spec:
- Email/password authentication
- OAuth 2.0 (Google, GitHub)
- Session management policy

Depends-On: data-model/user"

# 5. Create PR
gh pr create --title "spec(auth): user-login" --body "..."

# 6. Merge after review
gh pr merge --squash
```

#### Multiple Spec Change (Breaking Change)

```bash
# 1. Create bundle branch
git checkout -b spec-bundle/payment-v2

# 2. Modify related specs
sdd new billing/payment-gateway-v2
# ... work on multiple specs

# 3. Impact analysis
sdd impact billing/payment-gateway --code

# 4. Summary commit
git commit -m "spec-bundle(billing): payment system v2

Complete payment system overhaul:
- payment-gateway-v2: New PG integration
- refund-policy: Refund policy change
- subscription: Payment cycle change

Breaking-Spec: billing/checkout, billing/invoice
Migration-Guide: docs/migration/payment-v2.md"

# 5. PR with detailed description
gh pr create --title "spec-bundle: Payment System v2" \
  --body "$(cat <<EOF
## Scope
- New: payment-gateway-v2, refund-policy-v2
- Modified: subscription, checkout
- Affected: invoice, reporting

## Breaking Changes
checkout spec payment_method field structure changed

## Migration
See docs/migration/payment-v2.md
EOF
)"
```

#### Constitution Change

```bash
# 1. Constitution branch (special management)
git checkout -b constitution/v2.0

# 2. Change and update version
sdd constitution bump --minor
# Modify constitution.md

# 3. Impact analysis
sdd validate --constitution  # Check violating specs

# 4. Commit (detailed record)
git commit -m "constitution: v2.0 - add API design principles

New principles:
- API response format standardization (MUST)
- Error code system (MUST)
- Versioning policy (SHOULD)

Breaking: 12 existing API specs need updates
- api/user-endpoint
- api/product-endpoint
..."

# 5. Requires full team review
gh pr create --reviewer @tech-leads @architects
```

---

### 0.4 Git Hooks Automation

#### Pre-commit: Spec Validation

```bash
#!/bin/bash
# .husky/pre-commit

# Check changed spec files
CHANGED_SPECS=$(git diff --cached --name-only | grep "^\.sdd/specs/")

if [ -n "$CHANGED_SPECS" ]; then
  echo "Validating specs..."

  # Validate individual specs
  for spec in $CHANGED_SPECS; do
    sdd validate "$spec" || exit 1
  done

  echo "Spec validation passed"
fi
```

#### Commit-msg: Convention Check

```bash
#!/bin/bash
# .husky/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Spec-related commit pattern
SPEC_PATTERN="^(spec|spec-update|spec-status|plan|tasks|constitution|sdd-config)(\(.+\))?: .+"

# General commit pattern (feat, fix, etc.)
GENERAL_PATTERN="^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"

if [[ ! $COMMIT_MSG =~ $SPEC_PATTERN ]] && [[ ! $COMMIT_MSG =~ $GENERAL_PATTERN ]]; then
  echo "Commit message format error"
  echo ""
  echo "Spec commit: spec(<scope>): <message>"
  echo "General commit: feat(<scope>): <message>"
  echo ""
  echo "Details: docs/guide/scaling-roadmap.md#0.1-commit-conventions"
  exit 1
fi
```

#### Pre-push: Full Validation

```bash
#!/bin/bash
# .husky/pre-push

echo "Pre-push validation..."

# Full spec validation
sdd validate || exit 1

# Circular dependency check
sdd deps check --cycles || exit 1

# Constitution consistency
sdd validate --constitution || exit 1

echo "Validation complete"
```

#### Setup Automation CLI

```bash
# Git hooks setup
sdd git hooks install         # Install Husky and configure hooks
sdd git hooks uninstall       # Remove hooks

# Commit template setup
sdd git template install      # Configure .gitmessage

# Full Git setup
sdd git setup                 # hooks + template + .gitignore
```

---

### 0.5 .gitignore and Git Configuration

#### SDD .gitignore

```gitignore
# .gitignore

# SDD cache (regeneratable)
.sdd/index.json
.sdd/.cache/

# Local settings
.sdd/local.yml

# Generated reports
.sdd/reports/

# Temporary files
.sdd/**/*.tmp
.sdd/**/*.bak
```

#### Git Attributes

```gitattributes
# .gitattributes

# Spec files always LF
.sdd/**/*.md text eol=lf

# Merge strategy: Manual resolution for spec conflicts
.sdd/specs/** merge=spec-merge
.sdd/constitution.md merge=constitution-merge
```

#### Custom Merge Driver (Optional)

```bash
# .git/config or global config
[merge "spec-merge"]
    name = SDD Spec Merge Driver
    driver = sdd merge %O %A %B %P

[merge "constitution-merge"]
    name = SDD Constitution Merge Driver
    driver = sdd merge --constitution %O %A %B %P
```

---

### 0.6 CI Integration

#### GitHub Actions: Spec Validation

```yaml
# .github/workflows/sdd-validate.yml
name: SDD Validate

on:
  pull_request:
    paths:
      - '.sdd/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup SDD
        run: npm install -g sdd-tool

      - name: Validate Specs
        run: sdd validate --ci

      - name: Check Dependencies
        run: sdd deps check

      - name: Constitution Check
        run: sdd validate --constitution

      - name: Comment PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'SDD validation failed. Check Actions logs for details.'
            })
```

#### PR Label Automation

```yaml
# .github/workflows/sdd-labeler.yml
name: SDD Labeler

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Detect Changes
        id: changes
        run: |
          SPECS=$(git diff --name-only origin/main | grep "^\.sdd/specs/" | cut -d'/' -f3 | sort -u)
          echo "domains=$SPECS" >> $GITHUB_OUTPUT

          if git diff --name-only origin/main | grep -q "constitution.md"; then
            echo "constitution=true" >> $GITHUB_OUTPUT
          fi

      - name: Apply Labels
        uses: actions/github-script@v7
        with:
          script: |
            const domains = '${{ steps.changes.outputs.domains }}'.split('\n').filter(Boolean);
            const labels = domains.map(d => `spec:${d}`);

            if ('${{ steps.changes.outputs.constitution }}' === 'true') {
              labels.push('constitution');
            }

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: labels
              });
            }
```

---

### Implementation Checklist

```
Phase 0 Implementation Order:

[ ] 0.1 Commit Conventions
  [ ] Convention documentation
  [ ] .gitmessage template
  [ ] commitlint setup

[ ] 0.2 Branch Strategy
  [ ] Branch naming rules documentation
  [ ] GitHub Branch Protection setup
  [ ] Branch template scripts

[ ] 0.3 Workflow
  [ ] Single spec guide
  [ ] Bundle spec guide
  [ ] Constitution change guide

[ ] 0.4 Git Hooks
  [ ] sdd git hooks install CLI
  [ ] pre-commit hook
  [ ] commit-msg hook
  [ ] pre-push hook

[ ] 0.5 Git Configuration
  [ ] .gitignore template
  [ ] .gitattributes template
  [ ] Auto-generate in sdd init

[ ] 0.6 CI Integration
  [ ] sdd-validate.yml template
  [ ] sdd-labeler.yml template
  [ ] sdd cicd setup command extension
```

---

## Phase 1: Performance Optimization

### 1.1 Index Cache System

**Problem**: Performance degradation from parsing all specs every time

**Solution**: Introduce `.sdd/index.json` cache

```typescript
// src/core/index/schema.ts
interface SpecIndex {
  version: string;           // Index schema version
  generated: string;         // Generation time
  checksum: string;          // Full integrity hash

  specs: {
    [id: string]: {
      path: string;          // File path
      hash: string;          // File hash (change detection)
      title: string;
      status: SpecStatus;
      phase: number;
      domain?: string;
      dependencies: string[];
      keywords: string[];    // For full-text search
      updated: string;
    }
  };

  graph: {
    edges: [string, string][];  // [from, to] dependencies
    reverse: {                   // Reverse (for impact analysis)
      [id: string]: string[]
    };
    cycles: string[][];         // Circular dependency cache
  };

  stats: {
    total: number;
    byStatus: Record<SpecStatus, number>;
    byPhase: Record<number, number>;
    byDomain: Record<string, number>;
  };
}
```

**CLI Changes**:

```bash
sdd index rebuild    # Rebuild index
sdd index status     # Check index status
sdd index verify     # Verify integrity
```

**Auto-update Strategy**:

```typescript
// Change detection and partial update
async function updateIndex(changedFiles: string[]) {
  const index = await loadIndex();

  for (const file of changedFiles) {
    const hash = await computeHash(file);
    if (index.specs[id]?.hash !== hash) {
      // Re-parse only this spec
      index.specs[id] = await parseSpec(file);
    }
  }

  // Rebuild graph (only changed parts)
  rebuildAffectedGraph(index, changedFiles);

  await saveIndex(index);
}
```

**Expected Effect**:
- Search speed: O(n) -> O(1)
- validate time: 10 sec -> under 1 sec
- impact analysis: Instant

---

### 1.2 Interactive Dependency Graph

**Current**: Text-based Mermaid output

**Improvement**: Browser-based interactive graph

```bash
sdd graph                    # Open in browser
sdd graph --domain auth      # Domain filter
sdd graph --focus user-auth  # Focus on specific spec
sdd graph --export svg       # Export image
```

**Tech Stack**:
- D3.js or Cytoscape.js
- Generate local HTML file and open in browser
- Support zoom/pan/filter/search

**UI Features**:
- Node click: Spec details
- Edge highlight: Dependency path
- Color coding: By status, phase, domain
- Search: Real-time node filtering

---

## Phase 2: Domain Separation

### 2.1 Multi-Constitution Structure

**Current**:
```
.sdd/
├── constitution.md
└── specs/
```

**Improved**:
```
.sdd/
├── constitution.md           # Global principles (mandatory)
├── config.yml                # Domain configuration
└── domains/
    ├── auth/
    │   ├── constitution.md   # Domain principles (global + extended)
    │   └── specs/
    ├── billing/
    │   ├── constitution.md
    │   └── specs/
    └── core/
        └── specs/            # Without constitution, only global applies
```

**Configuration File**:

```yaml
# .sdd/config.yml
version: "1.0"

domains:
  auth:
    name: "Authentication/Authorization"
    owners: ["@security-team"]
    constitution: domains/auth/constitution.md

  billing:
    name: "Payment/Subscription"
    owners: ["@billing-team"]
    constitution: domains/billing/constitution.md

  core:
    name: "Core Features"
    owners: ["@core-team"]

# Inter-domain dependency rules
dependencies:
  rules:
    - from: billing
      to: auth
      allowed: true
    - from: auth
      to: billing
      allowed: false  # Prevent cycles
```

**CLI Changes**:

```bash
# Domain-specific spec creation
sdd new auth/login-flow
sdd new billing/subscription-model

# Domain-based operations
sdd validate --domain auth
sdd status --domain billing
sdd list --domain core

# Full overview
sdd status --by-domain
```

**Constitution Inheritance**:

```markdown
<!-- domains/auth/constitution.md -->
# Auth Domain Constitution

Parent: ../constitution.md (auto-inherited)

## Additional Principles

### Security Requirements
- All auth specs MUST follow OWASP guidelines
- Session management specs MUST specify expiration policy
```

---

### 2.2 Automatic Dependency Detection

**Current**: Manual `dependencies` field

**Improved**: Content-based auto-detection + manual override

```typescript
// src/core/dependency/detector.ts
interface DependencyDetector {
  // Pattern-based detection
  patterns: [
    // Explicit references
    /depends on [`']([a-z-]+)[`']/gi,
    /requires [`']([a-z-]+)[`']/gi,
    /see [`']([a-z-]+)[`'] spec/gi,

    // Requirement references
    /REQ-([A-Z]+-\d+)/g,

    // Link references
    /\[.*?\]\(\.\.\/([a-z-]+)\//gi,
  ];

  // Keyword matching
  keywords: {
    'user-auth': ['authentication', 'login', 'session', 'JWT', 'OAuth'],
    'billing': ['payment', 'subscription', 'invoice', 'subscription'],
  };
}
```

**Validation Commands**:

```bash
sdd deps check           # Dependency consistency check
sdd deps suggest         # Suggest missing dependencies
sdd deps auto-fix        # Auto-add (after confirmation)
```

**Example Output**:

```
Analyzing dependencies: user-profile

Detected dependencies:
  user-auth (explicit)
  data-model (detected, not specified)
      +-- "User entity profile field" reference found (line 23)
  notification (detected, not specified)
      +-- "Notification on profile change" mention (line 45)

Suggestion: sdd deps add user-profile data-model notification
```

---

## Phase 3: Review Workflow

### 3.1 Approval Gate System

**Configuration**:

```yaml
# .sdd/config.yml
review:
  enabled: true

  gates:
    draft:
      next: review
      auto: true  # Auto-transition possible

    review:
      next: approved
      requires:
        approvers: 2
        from_teams: ["owners"]  # Domain owners

    approved:
      next: implemented
      requires:
        tests: true      # Test existence check
        sync_check: true # Code connection check

  notifications:
    slack: "#sdd-reviews"

  auto_assign:
    auth/*: ["@alice", "@bob"]
    billing/*: ["@charlie"]
```

**CLI Commands**:

```bash
# Request review
sdd review request user-auth
sdd review request user-auth --reviewers @alice @bob

# Review operations
sdd review list                    # My review list
sdd review list --pending          # Pending
sdd review show user-auth          # Show details

# Approve/reject
sdd review approve user-auth
sdd review approve user-auth --comment "LGTM"
sdd review reject user-auth --reason "Security review needed"

# Status transition (requires permission)
sdd review promote user-auth       # Move to next stage
```

**Spec Metadata Extension**:

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

### 3.2 Change History Tracking

**New Fields**:

```yaml
---
history:
  - date: 2024-01-10
    author: "@developer"
    action: created

  - date: 2024-01-12
    author: "@developer"
    action: modified
    changes: ["Added requirement REQ-003", "Added 2 scenarios"]

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
sdd history user-auth              # Change history
sdd history user-auth --diff       # Diff between versions
sdd blame user-auth                # Author by line
```

---

## Phase 4: External Integration

### 4.1 Issue Tracker Sync

**Supported Targets**:
- GitHub Issues
- Linear
- Jira (future)

**Configuration**:

```yaml
# .sdd/config.yml
integrations:
  github:
    enabled: true
    repo: "owner/repo"
    sync:
      spec_to_issue: true      # Spec -> Issue creation
      issue_to_spec: false     # Issue -> Spec (manual)
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
sdd sync github                    # GitHub sync
sdd sync linear                    # Linear sync
sdd link user-auth --github 123    # Manual link
sdd link user-auth --linear ENG-456
```

**Spec Metadata**:

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

### 4.2 VSCode Extension

**Feature List**:

| Feature | Description |
|---------|-------------|
| Spec preview | Markdown rendering + metadata display |
| Sidebar | Spec tree view, status filter |
| Autocomplete | `@spec REQ-xxx` reference autocomplete |
| Hover info | Summary on spec ID hover |
| Go to Definition | Navigate from spec reference to spec file |
| Find References | Find spec references in code |
| Validation | Auto-validate on save, problem panel display |
| Snippets | Spec template snippets |

**Implementation Priority**:
1. Spec tree view + preview
2. `@spec` autocomplete + hover
3. Real-time validation
4. Go to Definition

---

## Phase 5: Analytics and Dashboard

### 5.1 Terminal Dashboard

```bash
sdd dashboard
```

```
+-------------------------------------------------------------+
|  SDD Dashboard - my-saas-project                             |
+-------------------------------------------------------------+
|                                                              |
|  Overview               |  Progress                          |
|  ----------------       |  --------------------------------   |
|  Total Specs: 87        |  ============-------- 62% (54/87)  |
|  Constitution: v2.1     |                                    |
|                         |  By Phase:                         |
|  By Status:             |  P1: ================== 100%       |
|  * Draft:      12       |  P2: ============------ 67%        |
|  * Review:      8       |  P3: ====-------------- 22%        |
|  * Approved:   13       |                                    |
|  * Implemented: 54      |                                    |
|                         |                                    |
+-------------------------+------------------------------------+
|  Pending Reviews (3)                                         |
|  ---------------------------------------------------------   |
|  * auth/mfa-setup        waiting: @alice (2 days)           |
|  * billing/refund-flow   waiting: @bob, @charlie            |
|  * core/audit-log        waiting: @security-team            |
|                                                              |
+-------------------------------------------------------------+
|  Issues (2)                                                  |
|  ---------------------------------------------------------   |
|  * Circular dependency: billing/invoice -> billing/payment   |
|  * Stale spec: core/legacy-api (no updates 30+ days)        |
|                                                              |
+-------------------------------------------------------------+
```

### 5.2 Enhanced HTML Report

```bash
sdd report --format html --output report.html
```

**Additional Sections**:
- Trend charts (weekly/monthly progress)
- Domain heatmap
- Dependency complexity metrics
- Review bottleneck analysis

---

## Implementation Priority Summary

| Phase | Feature | Difficulty | Impact | Expected Work |
|-------|---------|------------|--------|---------------|
| **0** | Commit conventions | Low | High | Docs + template |
| **0** | Branch strategy | Low | High | Docs + protection rules |
| **0** | Git Hooks | Medium | High | CLI + hook scripts |
| **0** | CI integration | Medium | High | Workflow templates |
| **1** | Index cache | Medium | High | Schema + builder + CLI |
| **1** | Interactive graph | Medium | Medium | D3.js template |
| **2** | Domain separation | High | High | Structure change + CLI |
| **2** | Auto dependency detection | Medium | Medium | Parser extension |
| **3** | Review workflow | High | Medium | State management + CLI |
| **3** | Change history | Medium | Medium | Metadata extension |
| **4** | GitHub integration | Medium | Medium | API integration |
| **4** | VSCode extension | High | High | Separate project |
| **5** | Dashboard | Medium | Medium | blessed/ink |

> **Phase 0 is top priority**: Build collaboration foundation (Phase 0) before technical features (Phase 1-5) to prevent chaos when scaling teams.

## Related Documentation

- [Current Limitations](./current-limits.md) - Realistic tool limitations
- [Roadmap Overview](./overview.md) - Complete roadmap
- [Best Practices](/guide/best-practices.md) - Effective usage
