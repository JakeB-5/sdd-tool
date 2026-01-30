# sdd report

Generates a comprehensive project report.

## Usage

```bash
sdd report [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--markdown` | Save as markdown file |
| `-o, --output <file>` | Output file path |
| `--include <sections>` | Include specific sections (comma-separated) |

## Report Sections

| Section | Description |
|---------|-------------|
| `summary` | Project summary |
| `specs` | Specs overview |
| `domains` | Domains overview |
| `quality` | Quality analysis |
| `changes` | Changes overview |
| `sync` | Sync status |

## Examples

### Basic Report

```bash
sdd report
```

Output:
```
=== SDD Project Report ===

📅 Generated: 2025-01-07

📊 Project Summary:
  • Total Specs: 12
  • Domains: 4
  • Average Quality: 78/100

📋 Spec Status:
  • draft: 3
  • review: 2
  • approved: 5
  • implemented: 2

🏷️ Domain Distribution:
  • auth: 4 specs
  • user: 3 specs
  • order: 3 specs
  • payment: 2 specs

🔄 Changes Overview:
  • Pending: 2
  • Applied this week: 3

🔗 Sync Status:
  • Synced: 8
  • Out of sync: 2
  • Unlinked: 2
```

### Save as Markdown

```bash
sdd report --markdown -o ./reports/weekly.md
```

### JSON Output

```bash
sdd report --json
```

```json
{
  "generatedAt": "2025-01-07T12:00:00Z",
  "summary": {
    "totalSpecs": 12,
    "totalDomains": 4,
    "averageQuality": 78
  },
  "specs": {
    "byStatus": {
      "draft": 3,
      "review": 2,
      "approved": 5,
      "implemented": 2
    }
  },
  "domains": [
    { "name": "auth", "specCount": 4 },
    { "name": "user", "specCount": 3 }
  ],
  "changes": {
    "pending": 2,
    "appliedThisWeek": 3
  },
  "sync": {
    "synced": 8,
    "outOfSync": 2,
    "unlinked": 2
  }
}
```

### Include Specific Sections Only

```bash
sdd report --include summary,quality,sync
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Generate SDD Report
  run: |
    sdd report --json > sdd-report.json

- name: Upload Report
  uses: actions/upload-artifact@v4
  with:
    name: sdd-report
    path: sdd-report.json
```

## Related Documentation

- [sdd quality](/cli/quality) - Quality analysis
- [sdd status](/cli/status) - Status check
- [sdd sync](/cli/sync) - Sync validation
