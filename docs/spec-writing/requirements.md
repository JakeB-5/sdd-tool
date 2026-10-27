# Writing Requirements

A guide for writing effective requirements.

## Requirement Structure

```markdown
### REQ-01: Requirement Title

- The system SHALL [action] [result] under [condition]
```

## ID Format

```
REQ-XX
```

- REQ: Requirement prefix
- XX: 2-digit number (01, 02, ...), unique within a spec (every spec starts again at `REQ-01`)

A requirement is **defined** by a heading in this form (levels 2-4). `sdd sync` counts only ids defined by a heading;
an id mentioned in prose, a list or a table is a reference and does not create a requirement.

## Characteristics of Good Requirements

### 1. Clear

Bad example:
```markdown
The system should respond quickly
```

Good example:
```markdown
The system SHALL respond within 200ms for 95% of requests
```

### 2. Verifiable

Bad example:
```markdown
The system should be easy to use
```

Good example:
```markdown
The system SHALL allow access to main features within 3 steps
```

### 3. Independent

Each requirement should be implementable/testable independently.

### 4. Traceable

Reference requirement IDs in code and tests with a spec-qualified `@spec <domain>/<feature>#REQ-01`:

```typescript
/**
 * @spec auth/login#REQ-01
 */
function login() {}
```

```typescript
describe('auth/login#REQ-01: Login', () => {
  it('rejects a wrong password', () => {});
});
```

`REQ-01` exists in every spec, so a bare `@spec REQ-01` only counts when exactly one spec has that id; when several do, it
is ignored with a warning. Check coverage with `sdd sync`.

## Requirements by Category

### Functional Requirements

```markdown
### REQ-01: User Login

- The system SHALL support email/password login
```

### Security Requirements

```markdown
### REQ-02: Password Storage

- The system SHALL hash passwords using bcrypt before storing
- The system SHALL NOT log plaintext passwords
```

### Performance Requirements

```markdown
### REQ-03: Response Time

- The system SHALL return API responses within 500ms
- The system SHOULD support 1000 concurrent users
```

### Accessibility Requirements

```markdown
### REQ-04: Keyboard Accessibility

- The system SHALL make all features accessible via keyboard
```

## Priority Notation

```markdown
### REQ-01: Login [HIGH]

### REQ-02: Social Login [MEDIUM]

### REQ-03: Biometric Auth [LOW]
```

## Dependency Notation

```markdown
### REQ-03: Password Reset

- The system SHALL send reset link via email
- **Dependency**: REQ-01 (Login)
```

This is a note for readers; it does not create a dependency. Dependencies **between specs** are declared only in the
frontmatter: `depends: [auth/login]` (`depends: []` for none, ids in `<domain>/<feature>` form).
`sdd impact` builds its graph from `depends` alone; mentioning another spec in the body is reported as a reference.

## Validation Checklist

- [ ] RFC 2119 keywords used?
- [ ] Verifiable conditions?
- [ ] Specific numbers/criteria?
- [ ] Clear subject and verb?
- [ ] ID format followed?
