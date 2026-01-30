# sdd migrate

Migrates from existing documents or external SDD tools.

## Usage

```bash
sdd migrate [command] [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `detect` | Detect external SDD tools |
| `openspec [path]` | Migrate from OpenSpec project |
| `speckit [path]` | Migrate from Spec Kit project |
| `docs <source>` | Convert markdown documents to specs |
| `analyze <file>` | Analyze document SDD compatibility |
| `scan [dir]` | Scan for migratable documents |

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview without creating files |
| `--overwrite` | Overwrite existing specs |
| `-o, --output <dir>` | Specify output directory |
| `--ext <extensions>` | File extension filter (default: .md) |

## Examples

### Detect External Tools

```bash
sdd migrate detect
```

Output:
```
🔍 Detecting external SDD tools...
   Path: /my-project

📦 OpenSpec
   Path: ./openspec
   Confidence: High ✓
   Specs: 5

💡 Migration command:
  • sdd migrate openspec "./openspec"
```

### Migrate from OpenSpec

```bash
sdd migrate openspec
```

Output:
```
🔄 Migrating from OpenSpec...
   Source: ./openspec
   Target: ./.sdd

✅ Migration complete
   Created: 5
   Skipped: 0
```

### Migrate from Spec Kit

```bash
sdd migrate speckit
```

Output:
```
🔄 Migrating from Spec Kit...
   Source: ./.specify
   Target: ./.sdd

✅ Migration complete
   Created: 3
   Skipped: 1 (already exists)
```

### Convert Markdown Documents

```bash
sdd migrate docs ./docs/features
```

Output:
```
3 files found

✅ login.md → .sdd/specs/login/spec.md
✅ signup.md → .sdd/specs/signup/spec.md
✅ profile.md → .sdd/specs/profile/spec.md

=== Migration Complete ===
Total: 3, Success: 3, Failed: 0
```

### Analyze Document Compatibility

```bash
sdd migrate analyze ./docs/auth.md
```

Output:
```
📊 Document Analysis: auth.md

Title: Authentication System
Description: JWT-based authentication

SDD Compatibility:
  ✅ RFC 2119 keywords: 5
  ✅ GIVEN-WHEN-THEN scenarios: 2

Discovered Requirements:
  • The system SHALL issue JWT tokens
  • Token expiration time SHOULD be 24 hours
  ... and 3 more

💡 Recommendations:
  • This document is suitable for migration to SDD format!
  • Migrate with `sdd migrate docs ./docs/auth.md`.
```

### Scan Directory

```bash
sdd migrate scan ./docs
```

Output:
```
📂 Scan Results: ./docs

🟢 Ready for migration:
  • docs/auth.md
  • docs/payment.md

🟡 Some modifications needed:
  • docs/api.md

🔴 Additional work required:
  • docs/readme.md
  ... and 2 more

=== Summary ===
Total: 6, Ready: 2, Partial: 1, Not Ready: 3

Start migration with these commands:
  • sdd migrate docs docs/auth.md
```

## Supported External Tools

| Tool | Detection Criteria |
|------|-------------------|
| OpenSpec | `openspec/` directory, `AGENTS.md` file |
| Spec Kit | `.specify/` directory, `memory/constitution.md` |

## Related Documentation

- [sdd init](./init) - Project initialization
- [CLI Reference](./) - All commands
