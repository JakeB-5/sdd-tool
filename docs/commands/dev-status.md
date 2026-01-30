# dev-status (Skill)

A development skill that reports SDD CLI implementation progress.

> **Note**: This is a **skill**, not a slash command. Claude automatically selects and uses it based on the work context.

## Overview

The `dev-status` skill analyzes SDD CLI implementation progress and reports spec status by phase, implementation completion rate, and test pass rate.

## Trigger Conditions

Claude automatically uses this skill when receiving requests like:

- "Status", "progress", "how far along"
- "status", "progress"

## Usage Example

```
User: Show me the status

Claude: SDD CLI Implementation Status

## Overall Progress

Implementation: 80%
Tests: 70%

## Status by Phase

### Phase 0: Git Workflow
| Spec | Implementation | Tests |
|------|----------------|-------|
| git-branch | Complete | Complete |
| git-commit | Complete | Complete |
| git-pr | Complete | Pending |

### Phase 1: Reverse Engineering
| Spec | Implementation | Tests |
|------|----------------|-------|
| reverse-scan | Complete | Complete |
| reverse-extract | Complete | Complete |
| reverse-review | Complete | Complete |
| reverse-finalize | Complete | Complete |

## Statistics

- Total specs: 25
- Implementation complete: 20 (80%)
- Tests complete: 18 (72%)
- Documentation complete: 22 (88%)

## Next Task Recommendations

1. Pending: export/json-format (tests incomplete)
2. Pending: cicd/github-actions (needs implementation)
```

## Detailed Mode

```
User: Show me detailed status

Claude: Additional information:
- Lines of code per spec
- Test coverage %
- Last modified date
- Dependency status
```

## Related Skills

- [`dev-next`](/commands/dev-next) - Recommend next implementation
- [`dev-review`](/commands/dev-review) - Code review
