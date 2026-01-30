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
| `test` | Tests |
| `chore` | Other tasks |

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
# |<---- Within 50 chars ---->|

# Body (optional)
# |<---- Within 72 chars ---->|

# Footer (optional)
# Refs: #issue-number
# Breaking-Spec: affected-spec
# Depends-On: dependent-spec
# Reviewed-By: @reviewer
```

---

## Validation

Commit messages are automatically validated through Git Hooks.

### Validation Rules

1. **Type required**: Must start with a valid type
2. **Subject length**: Within 50 characters
3. **Body line wrap**: Within 72 characters
4. **Scope format**: Only lowercase letters, hyphens, and slashes allowed

### Setup

```bash
# Install Git Hooks
sdd git hooks install
```

### Validation Failure Example

```
❌ Commit message format error

Expected: spec(<scope>): <message>
Received: "added spec"

Details: docs/guide/commit-convention.md
```

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

# ❌ Missing scope (in spec commits)
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
