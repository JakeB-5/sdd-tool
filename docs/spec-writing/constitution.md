# Constitution (Project Charter)

A guide for writing a Constitution that defines your project's core principles.

## What is a Constitution?

A Constitution is a document that defines your project's core principles, technical decisions, and forbidden practices. All specs and implementations must follow the Constitution. It lives in `.sdd/constitution.md`, and `sdd init` writes a template you can edit.

## Structure

The parser (`sdd constitution show` / `validate`) reads this layout:

```markdown
---
version: 1.0.0
created: 2025-12-24
---

# Constitution: My Project

> One-line description of the project's principles.

## 핵심 원칙

### 1. User First

- User experience SHALL be the basis of all decisions

## 기술 스택

- Language: TypeScript (strict mode)

## 품질 기준

- Test coverage SHALL be at least 80%

## 금지 사항

- The `any` type SHALL NOT be used
```

- **Frontmatter**: `version` (semantic version, default `1.0.0`) and `created`; `updated` is set by `sdd constitution bump`.
- **Title**: `# Constitution: <project name>` is required.
- **Sections** (the headings are Korean, as `sdd init` writes them): `## 핵심 원칙` (or `## 원칙`) with `### N. Title` entries and `-` rules, `## 기술 스택`, `## 품질 기준`, `## 금지 사항`. Only forbidden rules that contain `SHALL NOT` or `MUST NOT` are recognised.

## Writing Each Section

### Core Principles (핵심 원칙)

The fundamental values of the project, one numbered `###` entry per principle:

```markdown
## 핵심 원칙

### 1. User First

- User experience SHALL be the basis of all decisions

### 2. Data Protection

- User data safety SHALL be the top priority

### 3. Simplicity

- Simple designs SHOULD be preferred over complex ones
```

### Technical Stack (기술 스택)

Technical decisions and standards, one `-` line each:

```markdown
## 기술 스택

- Language: TypeScript strict mode
- Framework: React 18+
- Runtime: Node.js 20+
- Style: ESLint + Prettier
```

### Quality Standards (품질 기준)

```markdown
## 품질 기준

- Test coverage SHALL be at least 80%
- E2E tests SHOULD cover the core flows only
```

### Forbidden (금지 사항)

Things that must never be done. Write each rule with `SHALL NOT` / `MUST NOT`:

```markdown
## 금지 사항

- The `any` type SHALL NOT be used
- console.log SHALL NOT be left in production code
- Hardcoded secrets MUST NOT be committed
- Plaintext passwords SHALL NOT be stored
```

## Version Management

When changing the Constitution:

1. Increment version number
2. Record change history
3. Review compatibility with existing specs

```bash
sdd constitution bump --minor -m "Added test coverage criteria"   # --major | --minor | --patch is required
sdd constitution history
```

`bump` updates `version:` and `updated:` in the frontmatter and appends the change to `.sdd/CHANGELOG.md`, which `sdd constitution history` reads.

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
sdd constitution validate   # the constitution file itself parses
sdd validate                # specs against the constitution version
```

- `sdd validate` compares each spec's `constitution_version` with the constitution's `version` and warns on a mismatch (a major difference is an error). Specs without `constitution_version` are skipped.
- If the constitution cannot be parsed, `sdd validate` reports warning W007 and skips the check.
- The rules in the constitution (for example the forbidden list) are not checked against spec text automatically; they are a review standard.
