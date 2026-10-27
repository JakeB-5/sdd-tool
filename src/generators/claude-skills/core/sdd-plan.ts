/**
 * sdd-plan skill definition — build an implementation plan from a spec.
 */
import type { SkillDefinition } from '../types.js';

export const sddPlanSkill: SkillDefinition = {
  name: 'sdd-plan',
  description:
    "Write plan.md for an existing spec: technical decisions, implementation phases, risks, and testing strategy. Use when a spec is ready and the user wants to plan how to build it.",
  argumentHint: '<feature>',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Bash(sdd new plan*)', 'Bash(sdd new status *)'],
  content: `# SDD Plan

## Instructions

1. Browse \`.sdd/specs/\` to identify the feature you want to plan
2. Read the feature's \`spec.md\` and analyze its requirements
3. Write the plan in the feature's \`plan.md\`:
   - A feature created with \`--all\` (the \`/sdd-spec\` default) already has \`plan.md\`: edit it in place. Do not re-run \`sdd new plan\`
   - Only if it is missing, run \`sdd new plan <feature>\` to generate the template
   - \`--force\` regenerates the file from scratch and discards its content; use it only when asked
4. Optionally record the stage: \`sdd new status <feature> planned\`

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
