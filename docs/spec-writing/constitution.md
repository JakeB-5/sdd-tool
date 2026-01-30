# Constitution (Project Charter)

A guide for writing a Constitution that defines your project's core principles.

## What is a Constitution?

A Constitution is a document that defines your project's core principles, technical decisions, and forbidden practices. All specs and implementations must follow the Constitution.

## Structure

```markdown
# [Project Name] Constitution

## Metadata

- **Version**: 1.0.0
- **Last Modified**: 2025-12-24

## Core Principles

Fundamental values and direction of the project

## Technical Principles

Technical decisions and standards

## Forbidden

Things that must never be done
```

## Writing Each Section

### Core Principles

The fundamental values of the project:

```markdown
## Core Principles

1. **User First**: User experience is the basis of all decisions
2. **Data Protection**: User data safety is the top priority
3. **Simplicity**: Simple is better than complex
4. **Transparency**: System behavior should be predictable
```

### Technical Principles

Technical decisions and standards:

```markdown
## Technical Principles

### Languages and Frameworks
- Use TypeScript strict mode
- Use React 18+
- Support Node.js 20+

### Code Style
- Apply ESLint + Prettier
- Type definitions required for all functions
- Comments explain "why"

### Testing
- Maintain test coverage above 80%
- E2E tests only for core flows
```

### Forbidden

Things that must never be done:

```markdown
## Forbidden

### Code
- `any` type usage
- console.log in production code
- Hardcoded secrets

### Dependencies
- moment.js (alternative: date-fns)
- jQuery
- Adding external libraries without justification

### Security
- Plaintext password storage
- Direct SQL string concatenation
- Unvalidated user input
```

## Version Management

When changing the Constitution:

1. Increment version number
2. Record change history
3. Review compatibility with existing specs

```markdown
## Change History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-24 | Initial version |
| 1.1.0 | 2025-12-25 | Added test coverage criteria |
```

## Referencing in Specs

Include Constitution version in spec metadata:

```yaml
---
id: user-auth
constitution_version: 1.0.0
---
```

## Validation

```bash
sdd validate
```

- Warns on constitution_version mismatch
- Errors on forbidden practice violations
