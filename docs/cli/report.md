# sdd report

Generates a comprehensive project report.

## Usage

```bash
sdd report [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output format: `html` (default), `markdown`, `json` |
| `-o, --output <path>` | Output file path (default: `sdd-report-<date>.<ext>` in the current directory) |
| `--title <title>` | Report title |
| `--no-quality` | Leave out the quality analysis |
| `--no-validation` | Leave out the validation results |

The report is always written to a file; the command prints the path.

## Report Contents

| Section | Description |
|---------|-------------|
| Specs | Every spec with its id, title and status |
| Quality | Quality analysis (see [sdd quality](/cli/quality)); skipped with `--no-quality` |
| Validation | Validation results (see [sdd validate](/cli/validate)); skipped with `--no-validation` |

## Examples

### Basic Report

```bash
sdd report
# → sdd-report-2026-10-27.html
```

### Markdown Report

```bash
sdd report -f markdown -o ./reports/weekly.md
```

### JSON Report

```bash
sdd report -f json -o sdd-report.json
```

```json
{
  "title": "SDD 프로젝트 리포트",
  "generatedAt": "2026-10-27T11:41:03.082Z",
  "projectPath": "/abs/path/to/project/.sdd",
  "specs": [
    { "id": "auth/login", "title": "User Login", "status": "implemented" }
  ],
  "summary": {
    "totalSpecs": 13,
    "byPhase": { "unknown": 13 },
    "byStatus": { "implemented": 1, "draft": 12 },
    "averageQuality": 54,
    "validationErrors": 0,
    "validationWarnings": 7
  },
  "quality": { "averageScore": 54, "grade": "F", "specResults": ["..."] },
  "validation": { "passed": 13, "failed": 0, "warnings": 7, "files": ["..."] }
}
```

`quality` has the shape of `sdd quality --all --json` and `validation` lists every validated file with its errors and
warnings; both are omitted with `--no-quality` / `--no-validation`.

### Without Quality and Validation

```bash
sdd report --no-quality --no-validation
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Generate SDD Report
  run: sdd report -f json -o sdd-report.json

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
