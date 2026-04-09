/**
 * sdd-data-model skill definition — generate or update a data model document from a spec.
 */
import type { SkillDefinition } from '../types.js';

export const sddDataModelSkill: SkillDefinition = {
  name: 'sdd-data-model',
  description: 'Generate or update a data model document from a spec',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob'],
  context: 'inline',
  content: `# SDD Data Model

## Overview

Define the data structures and relationships in the system.
This document forms the foundation for implementation and is used in impact analysis when changes occur.

## Instructions

1. Identify the core entities
2. List each entity's attributes
3. Define relationships between entities
4. Write the ERD using Mermaid syntax

## Data Model Template

\`\`\`markdown
# Data Model: [System Name]

> Date: YYYY-MM-DD
> Version: 1.0.0

## Entity Definitions

### User

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Y | Unique identifier |
| email | string | Y | Email address (unique) |
| name | string | Y | Display name |
| created_at | datetime | Y | Creation timestamp |

### Post

...

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    User ||--o{ Post : writes
    User {
        uuid id PK
        string email
        string name
    }
    Post {
        uuid id PK
        uuid user_id FK
        string title
        text content
    }
\`\`\`

## Indexes

| Table | Index | Column | Type |
|-------|-------|--------|------|
| User | idx_user_email | email | UNIQUE |

## Constraints

- User.email SHALL be unique
- Post.user_id SHALL reference User.id
\`\`\`

## Output Location

Save the data model as \`.sdd/data-model.md\` or inside the relevant feature directory.
`,
};
