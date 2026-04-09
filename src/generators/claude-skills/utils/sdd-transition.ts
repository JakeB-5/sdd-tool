/**
 * sdd-transition skill definition — switch between new-feature and change-proposal workflows.
 */
import type { SkillDefinition } from '../types.js';

export const sddTransitionSkill: SkillDefinition = {
  name: 'sdd-transition',
  description: 'Switch between new-feature and change-proposal workflows mid-session',
  allowedTools: ['Read', 'Write'],
  context: 'inline',
  content: `# SDD Transition

## Overview

Use this skill when you need to switch workflows mid-session:
- **new → change**: A new feature turns out to be a modification of an existing spec
- **change → new**: A change proposal grows large enough to become a standalone feature

## new → change Transition

### When to Use
- You discover overlap with an existing spec while writing a new feature
- Extending an existing feature is more appropriate
- Impact analysis shows that modifying an existing spec is the right call

### Command

\`\`\`bash
sdd transition new-to-change <spec-id>
  -t, --title <title>    # Change proposal title
  -r, --reason <reason>  # Reason for transition
\`\`\`

### Result
- A new change proposal is created under \`.sdd/changes/<id>/\`
- \`proposal.md\`, \`delta.md\`, and \`tasks.md\` are generated
- References to the original spec are set automatically

## change → new Transition

### When to Use
- The change scope has grown too large and needs to be split into a separate feature
- The work evolves into something independent from the original spec
- Impact analysis confirms that separation is the safer path

### Command

\`\`\`bash
sdd transition change-to-new <change-id>
  -n, --name <name>      # New feature name
  -r, --reason <reason>  # Reason for transition
\`\`\`

### Result
- A new spec is created under \`.sdd/specs/<name>/\`
- \`spec.md\`, \`plan.md\`, and \`tasks.md\` are generated
- The original change proposal is marked as \`transitioned\`

## Decision Criteria

### Prefer new → change when
- Number of affected specs is ≤ 3
- The change is a natural extension of existing functionality
- The work centers on modifying existing scenarios rather than adding new ones

### Prefer change → new when
- Number of affected specs is > 3
- A new concept or domain is being introduced
- The feature can be tested independently from the existing spec

## Show Transition Guide

\`\`\`bash
sdd transition guide
\`\`\`
`,
};
