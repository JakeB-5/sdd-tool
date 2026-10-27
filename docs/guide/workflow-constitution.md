# Constitution Change Workflow

Workflow for changing the project constitution.

## What is Constitution?

Constitution defines the **core principles and rules** of your project:
- Architecture decisions
- Coding standards
- API design principles
- Security policies

All specs must comply with the Constitution.

---

## When Changes Are Needed

- **Add new principle**: New team-agreed rules
- **Modify principle**: Changes or clarifications to existing rules
- **Remove principle**: Rules no longer valid

---

## Overview

```
Discussion → Branch → Modify → Impact analysis → Version update → PR → Full team review → Merge
```

Constitution changes require **full team consensus**.

---

## Step-by-Step Guide

### 1. Prior Discussion

Discuss with the team before changing Constitution:

- Propose in Slack/Teams
- Discuss in meetings
- Write RFC (Request for Comments) document

```markdown
<!-- RFC Example -->
## RFC: Add API Versioning Principle

### Background
Need consistent policy for API version management

### Proposal
- All APIs must specify version (MUST)
- Include version in URL path: /api/v1/...
- Maintain backward compatibility for minimum 6 months

### Impact
- Existing API specs need updates: 5
- New spec template modification needed
```

### 2. Create Branch

```bash
git checkout main
git pull origin main
git checkout -b constitution/v2.0
```

**Naming convention**: `constitution/<version>`

### 3. Modify Constitution

```bash
# Edit Constitution file
# .sdd/constitution.md
```

**Change example**:

`.sdd/constitution.md`:

```markdown
---
version: 2.0.0
created: 2024-01-01
updated: 2024-01-20
---

# Constitution: My Project

> Architecture and API principles for the project.

## 핵심 원칙

### 1. Layer Separation

- All business logic SHALL be located in the service layer

### 2. API Versioning (NEW)

- All APIs SHALL include the version in the URL path (`/api/v{major}/...`)
- Backward compatibility SHALL be maintained for at least 6 months

### 3. Response Format (NEW)

- All APIs SHALL use a consistent response format
- Success: `{ data: ..., meta: ... }`, failure: `{ error: { code, message, details } }`
```

The version lives in the frontmatter `version:` and the title line must be `# Constitution: <project name>`.
Principles are parsed from `### N. Title` entries under a `## 핵심 원칙` (or `## 원칙`) heading, and the other recognised
sections are `## 기술 스택`, `## 품질 기준` and `## 금지 사항` (forbidden rules must contain `SHALL NOT` / `MUST NOT`).
The change history is kept for you in `.sdd/CHANGELOG.md` by `sdd constitution bump` (step 5), so there is no
"Change History" section to maintain by hand.

### 4. Impact Analysis

```bash
# Check each spec's constitution_version against the constitution (on by default)
sdd validate --constitution
```

`sdd validate` compares every spec's `constitution_version` with the current constitution: a patch difference is
informational, a minor difference is a warning, and a major difference is an error (exit code 2). If the constitution file cannot be parsed,
it reports warning W007 and skips the check. It does not read the principles themselves,
so checking specs against rules such as "API Version Management" is a review task; use `sdd search` to find affected specs.

**Example output** (the CLI prints Korean):
```
✓ api/user-endpoint/spec.md
  ⚠ Constitution Minor 버전이 변경되었습니다 (1.0.0 → 1.1.0). 새 원칙을 확인하세요.
```

### 5. Version Update

```bash
# Bump the version and record the change (--major | --minor | --patch is required)
sdd constitution bump --minor -m "Add API design principles"

# Show the history
sdd constitution history
```

The command updates the Version field in constitution.md and writes the change to `.sdd/CHANGELOG.md`.

**Semantic version**:
- **Major** (x.0.0): Breaking Change, large-scale principle changes
- **Minor** (0.x.0): New principle addition
- **Patch** (0.0.x): Principle clarification, typo fixes

### 6. Commit

```bash
git add .sdd/constitution.md
git commit -m "constitution: v2.0 - add API design principles

New principles:
- API response format standardization (MUST)
- Error code system (MUST)
- Version management policy (MUST)

Breaking: 5 existing API specs need updates
- api/user-endpoint
- api/product-endpoint
- api/order-endpoint
- api/payment-endpoint
- api/notification-endpoint

Migration: Each spec needs version information added"
```

### 7. Create PR

```bash
git push -u origin constitution/v2.0

gh pr create \
  --title "constitution: v2.0 - API design principles" \
  --body "$(cat <<EOF
## Overview
Add API design principles

## Changes
### New Principles
- 2.1 API Version Management (MUST)
- 2.2 API Response Format (MUST)

## Impact Analysis
### Violating Specs (need updates)
- [ ] api/user-endpoint
- [ ] api/product-endpoint
- [ ] api/order-endpoint
- [ ] api/payment-endpoint
- [ ] api/notification-endpoint

### Migration Plan
1. Merge Constitution
2. Update each spec sequentially (separate PRs)
3. Target completion within 2 weeks

## Checklist
- [x] Team discussion complete
- [x] Impact analysis complete
- [x] Migration plan established
- [ ] Tech lead approval
- [ ] Architect approval
- [ ] Full team agreement
EOF
)" \
  --reviewer tech-leads,architects
```

### 8. Full Team Review

Constitution changes follow a **special review process**:

- **Reviewers**: Tech leads, architects required
- **Approval count**: Minimum 3 (more than regular PRs)
- **Duration**: Sufficient review time (minimum 2-3 days)
- **Discussion**: Discuss in PR comments

### 9. Merge & Follow-up

```bash
# Merge (merge commit recommended - preserve history)
gh pr merge --merge

# Cleanup
git checkout main
git pull
git branch -d constitution/v2.0
```

**Follow-up tasks**:
1. Team announcement
2. Update violating specs (separate PRs)
3. Update templates (if needed)

---

## Emergency Changes

For urgent cases like security issues:

```bash
# Emergency branch
git checkout -b constitution/hotfix-security

# Fast review process
# - Proceed with minimal reviewers
# - Full announcement afterward

# Detailed explanation after merge
```

---

## Best Practices

### Before Changes

- **Sufficient discussion**: Full team understanding and agreement
- **Understand impact**: Check violating specs in advance
- **Migration plan**: Establish update schedule

### During Changes

- **Clear version**: Follow semantic versioning
- **Detailed history**: Update change history section
- **Specific rules**: Specify MUST/SHOULD

### After Changes

- **Team announcement**: Communicate changes
- **Sequential updates**: Clean up violating specs
- **Validation**: Full `sdd validate --constitution`

---

## Related Documentation

- [Constitution Writing Guide](/spec-writing/constitution.md)
- [Commit Convention](./commit-convention.md)
- [Branch Strategy](./branch-strategy.md)
