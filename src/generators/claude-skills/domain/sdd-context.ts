/**
 * sdd-context skill definition — set or clear the active domain context.
 */
import type { SkillDefinition } from '../types.js';

export const sddContextSkill: SkillDefinition = {
  name: 'sdd-context',
  description:
    'Set, show, extend, or clear the active domain context so SDD work focuses on selected domains and their dependencies. Use when the user wants to scope work to specific domains in a large project.',
  argumentHint: '[set|show|add|remove|clear|specs] [domain...]',
  allowedTools: ['Read', 'Write', 'Bash(sdd context*)'],
  content: `# SDD Context

## Overview

Set the active domain scope for the current working session.
In large projects, narrowing the context to one or more domains lets you focus on the relevant specs without noise from other parts of the project.

## Subcommands

\`\`\`
/sdd-context set <domain...>  # Set the active context
/sdd-context show             # Show the current context
/sdd-context add <domain>     # Add a domain to the context
/sdd-context remove <domain>  # Remove a domain from the context
/sdd-context clear            # Clear the active context
/sdd-context specs            # List specs in the current context
\`\`\`

### set

Set the active domain context. Dependent domains are included by default.

\`\`\`bash
sdd context set auth
sdd context set auth payment order
sdd context set auth --no-include-deps   # Exclude dependent domains
\`\`\`

### show

Display the currently active context.

\`\`\`bash
sdd context show
sdd context show --json
\`\`\`

### add / remove

Add or remove a domain from the active context.

\`\`\`bash
sdd context add order
sdd context add order --no-include-deps
sdd context remove payment
\`\`\`

### clear

Clear the active context entirely.

\`\`\`bash
sdd context clear
\`\`\`

### specs

List all specs within the active context. Use \`--json\` to pass the list to other tools.

\`\`\`bash
sdd context specs
sdd context specs --json
\`\`\`

## Effects of Setting a Context

The context is read only when creating a spec: when exactly one domain is active, a new spec without
an explicit domain (\`/sdd-spec <feature>\`) defaults to that domain. With several active domains no
default is applied. \`/sdd-validate\` and \`/sdd-list\` ignore the context; to validate one domain, pass
the \`-d <domain>\` option to \`/sdd-validate\`.

## Next Steps

- After setting context: run \`/sdd-spec\` to author specs within scope
- After finishing work: run \`/sdd-context clear\` to reset the scope
`,
};
