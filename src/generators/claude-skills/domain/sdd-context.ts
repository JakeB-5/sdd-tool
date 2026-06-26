/**
 * sdd-context skill definition — set or clear the active domain context.
 */
import type { SkillDefinition } from '../types.js';

export const sddContextSkill: SkillDefinition = {
  name: 'sdd-context',
  description: 'Set or clear the active domain context for scoped SDD operations',
  allowedTools: ['Read', 'Write', 'Bash(sdd context*)'],
  context: 'inline',
  content: `# SDD Context

## Overview

Set the active domain scope for the current working session.
In large projects, narrowing the context to one or more domains lets you focus on the relevant specs without noise from other parts of the project.

## Subcommands

\`\`\`
/sdd-context set <domain...>  # Set the active context
/sdd-context show             # Show the current context
/sdd-context clear            # Clear the active context
/sdd-context specs            # List specs in the current context
/sdd-context export           # Export context as a prompt
\`\`\`

### set

Set the active domain context.

\`\`\`bash
sdd context set auth
sdd context set auth payment order
sdd context set auth --include-deps   # Include dependent domains
\`\`\`

### show

Display the currently active context.

\`\`\`bash
sdd context show
\`\`\`

### add / remove

Add or remove a domain from the active context.

\`\`\`bash
sdd context add order
sdd context remove payment
\`\`\`

### clear

Clear the active context entirely.

\`\`\`bash
sdd context clear
\`\`\`

### specs

List all specs within the active context.

\`\`\`bash
sdd context specs
\`\`\`

### export

Export the context as a prompt for use with other tools.

\`\`\`bash
sdd context export
sdd context export --format markdown
\`\`\`

## Effects of Setting a Context

Once a context is active, scoped operations apply automatically:

1. **Spec creation**: \`/sdd-new\` auto-detects the domain from the context
2. **Validation**: \`/sdd-validate\` validates only the domains in the context
3. **Listing**: \`/sdd-list\` shows only specs within the context
4. **Implementation**: relevant specs are surfaced automatically during implementation

## Next Steps

- After setting context: run \`/sdd-new\` to author specs within scope
- After finishing work: run \`/sdd-context clear\` to reset the scope
`,
};
