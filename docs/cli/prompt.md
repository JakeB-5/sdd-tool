# sdd prompt

Outputs SDD prompts.

## Usage

```bash
sdd prompt [type] [options]
```

## Prompt Types

| Type | Description |
|------|-------------|
| `system` | System prompt (default) |
| `spec` | Spec writing prompt |
| `plan` | Plan writing prompt |
| `tasks` | Task breakdown prompt |
| `review` | Review prompt |

## Options

| Option | Description |
|--------|-------------|
| `--raw` | Output raw text without markdown |
| `--copy` | Copy to clipboard |
| `-o, --output <file>` | Save to file |

## Examples

### Output System Prompt

```bash
sdd prompt
```

Output:
```
=== SDD System Prompt ===

You are a Spec-Driven Development (SDD) expert.

## Core Principles

1. Spec First: Specs before code
2. RFC 2119: Use SHALL, MUST, SHOULD, MAY keywords
3. GIVEN-WHEN-THEN: Scenario-based requirement definitions

## Workflow

...
```

### Spec Writing Prompt

```bash
sdd prompt spec
```

### Save to File

```bash
sdd prompt system -o ./prompts/sdd-system.md
```

### Copy to Clipboard

```bash
sdd prompt spec --copy
```

Output:
```
✅ Prompt copied to clipboard.
```

## Use Cases

### Using with External AI Tools

When using SDD prompts with other AI tools (ChatGPT, Gemini, etc.):

```bash
# Copy prompt to clipboard
sdd prompt system --copy

# Paste into external AI tool
```

### Custom Workflows

```bash
# Save prompt to file
sdd prompt spec -o ./custom-prompts/spec.md

# Modify as needed and use
```

## Related Documentation

- [CLI Reference](./) - All commands
- [Best Practices](../guide/best-practices) - Usage patterns
