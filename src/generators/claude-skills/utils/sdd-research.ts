/**
 * sdd-research skill definition — generate a technical research document with citations.
 */
import type { SkillDefinition } from '../types.js';

export const sddResearchSkill: SkillDefinition = {
  name: 'sdd-research',
  description: 'Generate a technical research document on a given topic with citations',
  allowedTools: ['Read', 'Write', 'Glob', 'Grep', 'WebFetch'],
  context: 'fork',
  content: `# SDD Research

## Overview

Document the research needed before making technical decisions or architecture choices.
Research outputs serve as evidence and rationale in \`plan.md\` and spec documents.

## Instructions

1. Clearly define the research topic and its purpose
2. List the options to be compared
3. Analyze the pros and cons of each option
4. Derive a recommendation

## Research Template

\`\`\`markdown
# Research: [Topic]

> Date: YYYY-MM-DD
> Status: in-progress / complete

## Background

Why is this research needed?

## Options

### Option A: [Name]

**Pros:**
- ...

**Cons:**
- ...

**Known uses:**
- ...

### Option B: [Name]

...

## Comparison

| Criterion | Option A | Option B |
|-----------|----------|----------|
| Performance | ... | ... |
| Learning curve | ... | ... |
| Community | ... | ... |

## Conclusion

**Recommendation:** Option X

**Rationale:**
1. ...
2. ...

## References

- [Link 1]
- [Link 2]
\`\`\`

## Output Location

Save research documents under \`.sdd/research/\` or inside the relevant feature directory.
`,
};
