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
| 품질 | 품질 분석 ([sdd quality](/cli/quality) 참고). `--no-quality`로 제외 |
| 검증 | 검증 결과 ([sdd validate](/cli/validate) 참고). `--no-validation`으로 제외 |

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
  "specs": [
    { "id": "auth/login", "title": "login", "status": "draft" }
  ]
}
```

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

- [sdd quality](/cli/quality) - 품질 분석
- [sdd status](/cli/status) - 상태 확인
- [sdd sync](/cli/sync) - 동기화 검증
