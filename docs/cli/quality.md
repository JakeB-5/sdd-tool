# sdd quality

Analyzes spec quality and calculates scores.

## Usage

```bash
sdd quality [spec-id] [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--all` | Analyze all specs |
| `--json` | Output in JSON format |
| `--threshold <n>` | Minimum quality score (default: 70) |
| `--ci` | CI mode (fail if below threshold) |

## Quality Metrics

| Metric | Description | Weight |
|--------|-------------|--------|
| RFC 2119 Keywords | Usage of SHALL, MUST, SHOULD, etc. | 25% |
| Scenario Completeness | GIVEN-WHEN-THEN format compliance | 25% |
| Metadata Completeness | Required field presence | 20% |
| Requirement Clarity | Requirement specificity | 15% |
| Document Structure | Section organization | 15% |

## Examples

### Single Spec Analysis

```bash
sdd quality user-auth
```

Output:
```
=== Quality Analysis: user-auth ===

📊 Overall Score: 85/100 (Excellent)

📋 Detailed Scores:
  • RFC 2119 Keywords: 90/100
    - SHALL: 5
    - SHOULD: 3
    - MAY: 1

  • Scenario Completeness: 85/100
    - GIVEN-WHEN-THEN: 4
    - Incomplete scenarios: 1

  • Metadata: 80/100
    - ✅ id, title, status
    - ⚠️  depends not defined

  • Requirement Clarity: 85/100
    - Specific requirements: 8
    - Ambiguous expressions: 1

  • Document Structure: 80/100
    - ✅ Good section separation
    - ⚠️  Lacking examples

💡 Improvement Suggestions:
  1. Add the depends field
  2. Make the THEN clause in scenario 2 more specific
  3. Adding API examples would be helpful
```

### Analyze All Specs

```bash
sdd quality --all
```

Output:
```
=== Overall Quality Analysis ===

📊 Average Score: 78/100

Scores by Spec:
  🟢 user-auth: 85
  🟢 user-profile: 82
  🟡 order-checkout: 75
  🟡 payment-flow: 72
  🔴 notification: 58

Statistics:
  • Excellent (80+): 2
  • Good (70-79): 2
  • Needs Improvement (<70): 1
```

### CI Mode

```bash
sdd quality --all --ci --threshold 70
```

Returns exit code 1 if quality score is below threshold.

### JSON Output

```bash
sdd quality user-auth --json
```

```json
{
  "specId": "user-auth",
  "score": 85,
  "grade": "excellent",
  "breakdown": {
    "rfc2119": 90,
    "scenarios": 85,
    "metadata": 80,
    "clarity": 85,
    "structure": 80
  },
  "suggestions": [
    "Add the depends field",
    "Make the THEN clause in scenario 2 more specific"
  ]
}
```

## Quality Grades

| Score | Grade | Description |
|-------|-------|-------------|
| 90-100 | 🟢 Excellent | Production ready |
| 80-89 | 🟢 Good | Minor improvements recommended |
| 70-79 | 🟡 Acceptable | Improvement needed |
| 60-69 | 🟡 Needs Work | Significant improvement needed |
| <60 | 🔴 Inadequate | Major revision required |

## Related Documentation

- [sdd validate](./validate) - Spec validation
- [sdd report](./report) - Project report
- [CLI Reference](./) - All commands
