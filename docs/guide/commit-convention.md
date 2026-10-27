# Commit Convention

Git commit message rules used in SDD projects.

## Basic Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- **type**: Commit type (required)
- **scope**: Scope of impact (optional, but recommended for spec commits)
- **subject**: Brief description, within 50 characters (required)
- **body**: Detailed description, 72-character line wrap (optional)
- **footer**: References, impact information (optional)

---

## Spec Commit Types

Dedicated commit types used in SDD workflow.

| Type | Description | Example |
|------|-------------|---------|
| `spec` | New spec creation | `spec(auth): add user-login specification` |
| `spec-update` | Spec content modification | `spec-update(auth): add MFA requirements` |
| `spec-status` | Spec status change | `spec-status(auth): user-login draft → review` |
| `plan` | Add/modify implementation plan | `plan(auth): add implementation plan` |
| `tasks` | Add/modify task breakdown | `tasks(auth): break down into 5 tasks` |
| `constitution` | Constitution change | `constitution: add security principles (v1.1)` |
| `sdd-config` | SDD configuration change | `sdd-config: add billing domain` |

### Standard Commit Types

For code/documentation changes outside of specs, follow Conventional Commits.

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation change |
| `style` | Code formatting |
| `refactor` | Refactoring |
| `perf` | Performance improvement |
| `test` | Tests |
| `build` | Build system / dependencies |
| `ci` | CI configuration |
| `chore` | Other tasks |
| `revert` | Revert a commit |

---

## Scope Rules

Scope specifies the affected domain/spec.

### Basic Patterns

```bash
# Entire domain
spec(auth): ...

# Specific spec
spec(auth/user-login): ...

# Multiple domains
spec(auth,billing): ...

# Global impact
spec(*): ...
```

### Examples

```bash
# New spec creation
spec(auth/user-login): add user login specification

# Spec modification
spec-update(auth/user-login): add OAuth requirements

# Status change
spec-status(billing/subscription): draft → approved

# Implementation plan
plan(auth/user-login): add implementation plan with 3 phases

# Task breakdown
tasks(auth/user-login): break down into 8 implementation tasks

# Constitution (no scope)
constitution: add API versioning principle (v1.2.0)
```

---

## Footer Usage

Footer records additional metadata.

### Supported Keywords

| Keyword | Purpose | Example |
|---------|---------|---------|
| `Refs` | Issue reference | `Refs: #123, #456` |
| `Breaking-Spec` | Affected specs | `Breaking-Spec: billing/checkout` |
| `Depends-On` | Dependent specs | `Depends-On: auth/user-login` |
| `Reviewed-By` | Reviewer | `Reviewed-By: @alice` |

### Full Example

```
spec(billing/subscription): add subscription management specification

Subscription management spec:
- Monthly/annual plan definitions
- Upgrade/downgrade rules
- Promotion code handling
- Auto-renewal policy

Refs: #123
Depends-On: auth/user-login, billing/payment-gateway
Breaking-Spec: billing/checkout
```

---

## Commit Message Template

You can use a `.gitmessage` template in your project.

### Setup

```bash
# Set up with SDD CLI
sdd git template install

# Or manual setup
git config commit.template .gitmessage
```

### Template Content

```
# <type>(<scope>): <subject>
# |<----  Within 50 chars  ---->|
#
# Spec types: spec, spec-update, spec-status, plan, tasks, constitution, sdd-config
# General types: feat, fix, docs, style, refactor, test, chore
#
# Scope examples:
#   spec(auth): ...              - whole domain
#   spec(auth/user-login): ...   - a specific spec
#   spec(auth,billing): ...      - several domains
#   constitution: ...            - no scope

# Body (optional, 72-char wrap)

# Footer (optional)
# Refs: #issue-number
# Breaking-Spec: affected-spec
# Depends-On: dependent-spec
# Reviewed-By: @reviewer
```

(The installed template is in Korean; the structure is the same.)

---

## Validation

Commit messages are automatically validated by the `commit-msg` Git hook.

### Validation Rules

The hook checks the **first line** of the message (blank lines and `#` comment lines are skipped):

1. **Type required**: `<type>(<scope>): <message>` or `<type>: <message>`, where `<type>` is one of the spec types
   (`spec`, `spec-update`, `spec-status`, `plan`, `tasks`, `constitution`, `sdd-config`) or a Conventional Commits type
   (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`)
2. **Scope**: optional, any non-empty text in parentheses (the lowercase/slash style above is a convention, not enforced)
3. **Merge and revert messages**: messages starting with `Merge ` or `Revert ` are accepted as they are

Subject length (50) and body wrap (72) are style guidelines; the hook does not enforce them. A message that does not
match is rejected with exit code 1.

### Setup

```bash
# Install Git Hooks
sdd git hooks install
```

### Validation Failure Example

```
❌ 커밋 메시지 형식 오류

올바른 형식:
  스펙 커밋: spec(<scope>): <message>
  일반 커밋: feat(<scope>): <message>

스펙 타입: spec, spec-update, spec-status, plan, tasks, constitution, sdd-config
일반 타입: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

자세한 내용: https://jakeb-5.github.io/sdd-tool/ko/guide/commit-convention
```

(The hook output is in Korean.)

---

## Best Practices

### Good Examples

```bash
# Clear intent
spec(auth/mfa): add multi-factor authentication specification

# Appropriate scope
spec-update(billing/subscription): add annual plan discount rules

# Detailed body
spec(order/checkout): add checkout flow specification

Order checkout process definition:
- Cart → Shipping → Payment → Complete flow
- Validation rules per step
- Error handling scenarios

Depends-On: auth/user-login, billing/payment-gateway
```

### Examples to Avoid

```bash
# ❌ Vague message
spec: update

# ⚠️ Missing scope (the hook accepts it, but a scope is recommended for spec commits)
spec: add login feature

# ❌ Subject too long
spec(auth): add user login with email password oauth google github apple sso saml

# ❌ Non-English type (types must be in English)
스펙(auth): 로그인 추가
```

---

## Related Documentation

- [Branch Strategy](./branch-strategy.md)
- [Single Spec Workflow](./workflow-single-spec.md)
- [Git Hooks Setup](/cli/git)
