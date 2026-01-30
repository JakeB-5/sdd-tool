# dev-scaffold (Skill)

A development skill that generates TypeScript boilerplate code.

> **Note**: This is a **skill**, not a slash command. Claude automatically selects and uses it based on the work context.

## Overview

The `dev-scaffold` skill generates TypeScript boilerplate code for new commands, modules, parsers, and validators for the SDD CLI.

## Trigger Conditions

Claude automatically uses this skill when receiving requests like:

- "Create new command", "add module"
- "scaffold", "boilerplate"

## Usage Examples

### Command Scaffold

```
User: Create an export command

Claude: Generated files:
  src/cli/commands/export.ts      # Command handler
  src/cli/commands/export.test.ts # Tests
```

**Generated code:**

```typescript
// src/cli/commands/export.ts
import { Command } from 'commander';

export interface ExportOptions {
  output?: string;
  format?: string;
}

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export description')
    .option('-o, --output <path>', 'Output path')
    .option('-f, --format <type>', 'Output format')
    .action(handleExport);
}

async function handleExport(options: ExportOptions): Promise<void> {
  // TODO: Implement
}
```

### Module Scaffold

```
User: Create an auth/token module

Claude: Generated files:
  src/core/auth/token.ts          # Module implementation
  src/core/auth/token.test.ts     # Tests
  src/core/auth/index.ts          # Index update
```

### Parser Scaffold

```
User: Create a yaml parser

Claude: Generated files:
  src/core/parsers/yaml-parser.ts
  src/core/parsers/yaml-parser.test.ts
```

### Validator Scaffold

```
User: Create a spec validator

Claude: Generated files:
  src/core/validators/spec-validator.ts
  src/core/validators/spec-validator.test.ts
```

## Related Skills

- [`dev-implement`](/commands/dev-implement) - Spec implementation
