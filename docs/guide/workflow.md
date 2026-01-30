# Workflow

Understand the complete SDD Tool workflow.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SDD Workflow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd.start        → Start workflow                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd.constitution → Define project principles           │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd.spec         → Write/modify feature spec (spec.md) │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd.plan         → Create implementation plan (plan.md)│
│     │                                                       │
│     ▼                                                       │
│  5. /sdd.tasks        → Task breakdown (tasks.md)           │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd.prepare      → Check subagents/skills              │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd.implement    → Sequential implementation           │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd.validate     → Spec validation                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step Details

### 1. /sdd.start

Analyzes project status and guides the next action.

- **New project**: Recommends Constitution creation
- **Existing project**: Provides workflow selection menu

### 2. /sdd.constitution

Defines the core principles of your project.

- Core Principles
- Technical Principles
- Forbidden

### 3. /sdd.spec

Write or modify feature specs with AI assistance.

- Automatically detects new feature vs existing spec modification
- Uses RFC 2119 keywords
- GIVEN-WHEN-THEN scenarios

### 4. /sdd.plan

Create an implementation plan.

- Technical decisions and rationale
- Implementation phases definition
- Risk analysis

### 5. /sdd.tasks

Break down work into executable units.

- 2-4 hour completion size
- Task dependencies indicated
- Priority settings

### 6. /sdd.prepare

Check required implementation tools.

- Verify subagents
- Verify skills
- Auto-generate missing tools

### 7. /sdd.implement

TDD-style sequential implementation.

1. Change task status to "in progress"
2. Write tests
3. Implement code
4. Change task status to "complete"

### 8. /sdd.validate

Perform spec validation.

- RFC 2119 keyword usage
- GIVEN-WHEN-THEN format compliance
- Metadata required fields check

## Change Management Workflow

When modifying existing features:

```
/sdd.spec     → Modify spec (auto-detects existing spec)
    ↓
/sdd.impact   → Impact analysis
    ↓
/sdd.apply    → Apply changes
```

## File Structure

```
.sdd/
├── constitution.md     # Project constitution
├── specs/              # Feature specs
│   └── feature-name/
│       ├── spec.md     # Specification
│       ├── plan.md     # Implementation plan
│       └── tasks.md    # Task breakdown
├── changes/            # Change proposals
└── archive/            # Completed changes
```
