/**
 * sdd-plan skill definition — build an implementation plan from a spec.
 */
import type { SkillDefinition } from '../types.js';

export const sddPlanSkill: SkillDefinition = {
  name: 'sdd-plan',
  description: 'Build an implementation plan from an existing spec, including phases and risk analysis',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob'],
  context: 'inline',
  content: `# SDD Plan

## Instructions

1. Browse \`.sdd/specs/\` to identify the feature you want to plan
2. Read the feature's \`spec.md\` and analyze its requirements
3. Run \`sdd new plan <feature-id>\` to generate a plan template, or edit an existing \`plan.md\`

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
