# Reverse Extraction Guide

How to reverse extract SDD specs from legacy codebases.

## Overview

Reverse Extraction is the process of extracting specifications from existing code. It's useful when introducing SDD to brownfield projects.

## Workflow

```
scan → extract → review → finalize
```

1. **Scan**: Analyze codebase and identify spec candidates
2. **Extract**: Generate spec drafts from candidates
3. **Review**: Review and modify extracted specs
4. **Finalize**: Finalize and save specs

## Scan

### Basic Scan

```bash
sdd reverse scan
sdd reverse scan src/
sdd reverse scan --depth deep
```

### Scan Results

```
📊 Scan Results

Files analyzed: 45
Symbols found: 234

Domain candidates:
  - auth (confidence: 92%) - 15 files
  - core (confidence: 88%) - 25 files
  - api (confidence: 75%) - 5 files

Spec candidates: 18
  High confidence (>80%): 12
  Medium confidence (50-80%): 4
  Low confidence (<50%): 2
```

### Scan Options

| Option | Description |
|--------|-------------|
| `--depth quick` | Quick analysis (directory structure based) |
| `--depth normal` | Normal analysis (files + symbols) |
| `--depth deep` | Deep analysis (dependencies + types) |
| `--exclude <glob>` | Exclude pattern |
| `--include <glob>` | Include pattern |

## Extract

### Full Extraction

```bash
sdd reverse extract
```

### Selective Extraction

```bash
sdd reverse extract --min-confidence 70
sdd reverse extract --domain auth
sdd reverse extract --interactive
```

### Extraction Results

```
📝 Extracted specs: 12

auth domain:
  ✓ user-login (confidence: 95%)
  ✓ oauth-google (confidence: 87%)
  ✓ session-management (confidence: 82%)

core domain:
  ✓ data-model (confidence: 90%)
  ✓ validation (confidence: 85%)

Draft specs saved to: .sdd/drafts/
```

## Review

### Interactive Review

```bash
sdd reverse review
sdd reverse review --spec user-login
```

### Review Interface

```
📋 Spec Review: auth/user-login

Name: user-login
Description: User email/password login
Confidence: 95%

Scenarios:
  1. Login success with valid credentials
  2. Login failure with wrong password
  3. Non-existent user

[a] Approve  [e] Edit  [s] Skip  [r] Reject  [q] Quit
```

### Edit Mode

```bash
sdd reverse review --edit user-login
```

Editable items:
- Spec name and description
- Scenario GIVEN/WHEN/THEN
- Contracts (input/output types)
- Domain assignment
- Dependencies

### AI-Assisted Review

```bash
sdd reverse review --ai-assist
```

AI provides:
- Scenario improvement suggestions
- Missing edge case identification
- Naming convention review
- Description clarification

## Finalize

### Finalize Approved Specs

```bash
sdd reverse finalize
```

### Selective Finalization

```bash
sdd reverse finalize --status approved
sdd reverse finalize --domain auth
```

### Finalization Results

```
✅ Spec finalization complete

Saved specs: 10
  .sdd/specs/auth/user-login.md
  .sdd/specs/auth/oauth-google.md
  ...

Created domains: 3
  .sdd/domains.yml updated

Next steps:
  sdd list              # Check specs
  sdd validate          # Run validation
```

## Data Files

### Scan Results

`.sdd/reverse/scan-result.json`:

```json
{
  "scanned_at": "2025-12-29T10:00:00Z",
  "files_analyzed": 45,
  "symbols_found": 234,
  "suggested_domains": [...],
  "spec_candidates": [...]
}
```

### Extracted Specs

`.sdd/drafts/<spec-id>.json`:

```json
{
  "id": "auth/user-login",
  "name": "user-login",
  "description": "User login",
  "confidence": 0.95,
  "status": "draft",
  "scenarios": [...],
  "source": {...}
}
```

## Confidence System

### Confidence Calculation

- **Structure score** (30%): Clear function/class structure
- **Documentation score** (25%): Comments, JSDoc, type definitions
- **Test score** (25%): Existing tests
- **Naming score** (20%): Naming convention consistency

### Confidence Levels

| Level | Range | Meaning |
|-------|-------|---------|
| High | 80-100% | Auto extraction recommended |
| Medium | 50-79% | Review needed |
| Low | 0-49% | Manual writing recommended |

## Best Practices

### 1. Incremental Approach

```bash
# 1. Quick scan for overview
sdd reverse scan --depth quick

# 2. Extract high confidence only
sdd reverse extract --min-confidence 80

# 3. Review and finalize
sdd reverse review
sdd reverse finalize

# 4. Handle medium confidence
sdd reverse extract --min-confidence 50
```

### 2. Domain-by-Domain

```bash
# Process core domain first
sdd reverse scan src/core/
sdd reverse extract --domain core
sdd reverse finalize --domain core

# Next domain
sdd reverse scan src/auth/
```

### 3. Team Collaboration

```bash
# Share scan results
sdd reverse scan --output scan-report.md

# Each person reviews
sdd reverse review --spec <assigned-spec>

# Final finalization
sdd reverse finalize --status approved
```

## Troubleshooting

### Low Confidence

- Add code comments
- Enhance type definitions
- Write specs manually

### Incorrect Domain Inference

```bash
sdd reverse review --edit <spec>
# Reassign domain
```

### Missing Specs

```bash
# Manual addition
sdd new <domain>/<spec-name>
```

## Related Documentation

- [Domain System](./domains.md)
- [CLI: reverse](../cli/reverse.md)
- [Tutorial: Brownfield](../tutorial/brownfield.md)
