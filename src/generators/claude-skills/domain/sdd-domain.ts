/**
 * sdd-domain skill definition — manage domains in an SDD project.
 */
import type { SkillDefinition } from '../types.js';

export const sddDomainSkill: SkillDefinition = {
  name: 'sdd-domain',
  description: 'Manage domains — create, link specs, set dependencies, visualize the dependency graph',
  allowedTools: ['Read', 'Write', 'Edit', 'Bash(sdd domain*)'],
  context: 'inline',
  content: `# SDD Domain

## Overview

Create, inspect, modify, and delete domains in an SDD project.
Use domains to logically group specs in large projects and to model the dependency graph between subsystems.

## Subcommands

\`\`\`
/sdd-domain create <name>          # Create a domain
/sdd-domain list                   # List all domains
/sdd-domain show <name>            # Show domain details
/sdd-domain link <domain> <spec>   # Link a spec to a domain
/sdd-domain graph                  # Visualize the dependency graph
\`\`\`

### create

Create a new domain.

\`\`\`bash
sdd domain create auth
sdd domain create payment --description "Payment processing"
\`\`\`

### list

List all domains in the project.

\`\`\`bash
sdd domain list
sdd domain list --tree      # Tree view
\`\`\`

### show

Display details for a specific domain.

\`\`\`bash
sdd domain show auth
\`\`\`

### link / unlink

Link or unlink a spec from a domain.

\`\`\`bash
sdd domain link auth user-login
sdd domain unlink auth user-login
\`\`\`

### depends

Set a dependency between two domains.

\`\`\`bash
sdd domain depends payment --on auth
\`\`\`

### graph

Visualize the domain dependency graph.

\`\`\`bash
sdd domain graph              # Mermaid format (default)
sdd domain graph --format dot # DOT format
\`\`\`

### validate

Validate the domain structure.

\`\`\`bash
sdd domain validate
\`\`\`

Validation checks:
- Circular dependency detection
- Orphaned spec detection
- Schema validity

## Next Steps

- After creating a domain: run \`/sdd-context set <domain>\` to set the active working context
- After linking specs: run \`/sdd-domain graph\` to verify the structure
`,
};
