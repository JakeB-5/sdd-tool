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
- XX: 2-digit number (01, 02, ...)

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

Reference requirement IDs in code and tests:

```typescript
/**
 * @spec REQ-01
 */
function login() {}
```

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

## Validation Checklist

- [ ] RFC 2119 keywords used?
- [ ] Verifiable conditions?
- [ ] Specific numbers/criteria?
- [ ] Clear subject and verb?
- [ ] ID format followed?
