# sdd report

프로젝트 전체 리포트를 생성합니다.

## 사용법

```bash
sdd report [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--json` | JSON 형식으로 출력 |
| `--markdown` | 마크다운 파일로 저장 |
| `-o, --output <file>` | 출력 파일 경로 |
| `--include <sections>` | 포함할 섹션 (쉼표 구분) |

## 리포트 섹션

| 섹션 | 설명 |
|------|------|
| `summary` | 프로젝트 요약 |
| `specs` | 스펙 현황 |
| `domains` | 도메인 현황 |
| `quality` | 품질 분석 |
| `changes` | 변경 현황 |
| `sync` | 동기화 상태 |

## 예시

### 기본 리포트

```bash
sdd report
```

출력:
```
=== SDD 프로젝트 리포트 ===

📅 생성일: 2025-01-07

📊 프로젝트 요약:
  • 총 스펙: 12개
  • 도메인: 4개
  • 평균 품질: 78/100

📋 스펙 상태:
  • draft: 3개
  • review: 2개
  • approved: 5개
  • implemented: 2개

🏷️ 도메인 분포:
  • auth: 4개 스펙
  • user: 3개 스펙
  • order: 3개 스펙
  • payment: 2개 스펙

🔄 변경 현황:
  • 대기 중: 2개
  • 이번 주 적용: 3개

🔗 동기화 상태:
  • 동기화됨: 8개
  • 불일치: 2개
  • 미연결: 2개
```

### 마크다운 파일로 저장

```bash
sdd report --markdown -o ./reports/weekly.md
```

### JSON 출력

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

### 특정 섹션만 포함

```bash
sdd report --include summary,quality,sync
```

## CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Generate SDD Report
  run: |
    sdd report --json > sdd-report.json

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
