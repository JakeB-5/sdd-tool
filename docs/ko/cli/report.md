# sdd report

프로젝트 전체 리포트를 생성합니다.

## 사용법

```bash
sdd report [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `-f, --format <format>` | 출력 형식: `html`(기본), `markdown`, `json` |
| `-o, --output <path>` | 출력 파일 경로 (기본: 현재 디렉토리의 `sdd-report-<날짜>.<확장자>`) |
| `--title <title>` | 리포트 제목 |
| `--no-quality` | 품질 분석 제외 |
| `--no-validation` | 검증 결과 제외 |

리포트는 항상 파일로 저장되며, 명령은 저장한 경로를 출력합니다.

## 리포트 내용

| 섹션 | 설명 |
|------|------|
| 스펙 | 모든 스펙의 ID, 제목, 상태 |
| 품질 | 품질 분석 ([sdd quality](/ko/cli/quality) 참고). `--no-quality`로 제외 |
| 검증 | 검증 결과 ([sdd validate](/ko/cli/validate) 참고). `--no-validation`으로 제외 |

## 예시

### 기본 리포트

```bash
sdd report
# → sdd-report-2026-10-27.html
```

### Markdown 리포트

```bash
sdd report -f markdown -o ./reports/weekly.md
```

### JSON 리포트

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

`quality`는 `sdd quality --all --json`과 같은 구조이고, `validation`은 검증한 모든 파일과 그 에러 · 경고를 담습니다.
`--no-quality` / `--no-validation`을 주면 각각 빠집니다.

### 품질 · 검증 제외

```bash
sdd report --no-quality --no-validation
```

## CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Generate SDD Report
  run: sdd report -f json -o sdd-report.json

- name: Upload Report
  uses: actions/upload-artifact@v4
  with:
    name: sdd-report
    path: sdd-report.json
```

## 관련 문서

- [sdd quality](/ko/cli/quality) - 품질 분석
- [sdd status](/ko/cli/status) - 상태 확인
- [sdd sync](/ko/cli/sync) - 동기화 검증
