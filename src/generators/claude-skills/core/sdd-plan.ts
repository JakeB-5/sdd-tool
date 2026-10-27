/**
 * sdd-plan skill definition — build an implementation plan from a spec.
 */
import type { SkillDefinition } from '../types.js';

export const sddPlanSkill: SkillDefinition = {
  name: 'sdd-plan',
  description:
    "Write plan.md for an existing spec: technical decisions, implementation phases, risks, and testing strategy. Use when a spec is ready and the user wants to plan how to build it.",
  argumentHint: '<feature-id>',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Bash(sdd new plan*)'],
  content: `# SDD Plan

## Instructions

1. Browse \`.sdd/specs/\` to identify the feature you want to plan
2. Read the feature's \`spec.md\` and analyze its requirements
3. If \`plan.md\` already exists (e.g. generated together with spec.md via \`--all\`), edit it; otherwise run \`sdd new plan <feature-id>\` to generate a plan template. Use \`--force\` only to regenerate it from scratch

## Plan Authoring Rules

- State each technical decision and its rationale
- Divide the work into clearly defined implementation phases
- List expected deliverables for each phase
- Include a risk analysis and mitigation strategies
- Define a testing strategy

## Plan Structure

\`\`\`markdown
## Technical Decisions
### Decision 1: [Title]
**Rationale:** [Why this technology or approach was chosen]

## Implementation Phases
### Phase 1: Foundation
[Description]
**Deliverables:**
- [ ] Deliverable 1
- [ ] Deliverable 2

### Phase 2: Core Logic
[Description]
**Deliverables:**
- [ ] Deliverable 1

## Risk Analysis
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| [risk] | High/Medium/Low | [strategy] |

## Testing Strategy
[Describe unit, integration, and e2e coverage approach]
\`\`\`

After completing the plan, decompose work into tasks with \`/sdd-tasks\`.
`,
};
