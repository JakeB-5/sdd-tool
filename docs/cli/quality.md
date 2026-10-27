# sdd quality

Analyzes spec quality and calculates scores.

## Usage

```bash
sdd quality [feature] [options]
```

`feature` is `<domain>/<feature>` or a unique `<feature>`. Without it (or with `--all`) the whole project is analyzed.

## Options

| Option | Description |
|--------|-------------|
| `-a, --all` | Analyze the whole project |
| `--json` | Output in JSON format |
| `--min-score <score>` | Minimum score in percent, 0-100 (default: 0). Exits with code 2 when the score is below it |

## Quality Criteria

Each spec is scored out of 100 points over eight criteria:

| Criterion | Points | What is checked |
|-----------|--------|-----------------|
| RFC 2119 keywords | 10 | Uppercase SHALL / MUST / SHOULD / MAY (2 points per distinct keyword found) |
| GIVEN-WHEN-THEN scenarios | 20 | Complete scenarios (5 points each); scenarios written under each requirement count too |
| Requirement clarity | 15 | A requirements section and `REQ-xx` ids (it counts REQ mentions, while `sdd sync` counts only heading definitions) |
| Dependencies declared | 10 | A `depends` field: `depends: [..]`, `depends: []`, `depends: null` or `dependencies` |
| Document structure | 15 | H1 title, requirements section, scenarios section, plus overview / constraints / notes sections |
| Constitution compliance | 10 | `constitution_version` matches the project constitution |
| Reference links | 10 | Links to related documents |
| Metadata completeness | 10 | Required and optional frontmatter fields |

Placeholder scenario headings (`### 시나리오 없음`, `#### Scenario (TBD)`) and headings inside code fences are ignored.

## Grades

| Score | Grade |
|-------|-------|
| 90-100% | A |
| 80-89% | B |
| 70-79% | C |
| 60-69% | D |
| <60% | F |

## Examples

### Single Spec Analysis

```bash
sdd quality auth/login
```

Output (CLI output is Korean):
```
📊 품질 분석: login
   🟠 등급: D (64%)
   📈 점수: 64/100

📋 항목별 점수:
   🔴 RFC 2119 키워드: 4/10 (40%)
      └─ 발견된 키워드: SHALL: 2개, SHOULD: 1개
   🔴 GIVEN-WHEN-THEN 시나리오: 5/20 (25%)
   ...

💡 개선 제안:
   - 추가 시나리오 작성을 권장합니다 (최소 2개)
```

### Analyze All Specs

```bash
sdd quality --all
```

Prints the average grade, the grade distribution and the score of every spec. Specs that cannot be parsed count as 0%
in the average and are listed.

### CI Mode

```bash
sdd quality --all --min-score 70
```

Prints the report, then exits with code 2 (`VALIDATION_FAILED`) when the score is below `--min-score`.

### JSON Output

```bash
sdd quality auth/login --json
```

```json
{
  "specId": "login",
  "specPath": ".sdd/specs/auth/login/spec.md",
  "totalScore": 64,
  "maxScore": 100,
  "percentage": 64,
  "grade": "D",
  "items": [
    {
      "name": "RFC 2119 키워드",
      "score": 4,
      "maxScore": 10,
      "percentage": 40,
      "details": ["발견된 키워드: SHALL: 2개, SHOULD: 1개"],
      "suggestions": []
    }
  ]
}
```

## Related Documentation

- [sdd validate](./validate) - Spec validation
- [sdd report](./report) - Project report
- [CLI Reference](./) - All commands
