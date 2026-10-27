# sdd quality

스펙의 품질을 분석하고 점수를 산출합니다.

## 사용법

```bash
sdd quality [feature] [options]
```

`feature`는 `<domain>/<feature>` 또는 유일한 `<feature>`입니다. 생략하거나 `--all`을 주면 프로젝트 전체를 분석합니다.

## 옵션

| 옵션 | 설명 |
|------|------|
| `-a, --all` | 프로젝트 전체 분석 |
| `--json` | JSON 형식으로 출력 |
| `--min-score <score>` | 최소 점수(퍼센트, 0~100, 기본: 0). 미달이면 종료 코드 2로 실패 |

## 품질 기준

스펙 하나는 여덟 가지 기준으로 100점 만점 채점됩니다:

| 기준 | 배점 | 확인 내용 |
|------|------|-----------|
| RFC 2119 키워드 | 10 | 대문자 SHALL / MUST / SHOULD / MAY (발견한 키워드 종류당 2점) |
| GIVEN-WHEN-THEN 시나리오 | 20 | 완전한 시나리오(개당 5점). 요구사항 아래에 쓴 시나리오도 인정 |
| 요구사항 명확성 | 15 | 요구사항 섹션과 `REQ-xx` ID (REQ 언급도 세며, `sdd sync`는 헤딩 정의만 셈) |
| 의존성 명시 | 10 | `depends` 필드: `depends: [..]`, `depends: []`, `depends: null`, `dependencies` |
| 문서 구조 | 15 | H1 제목, 요구사항 섹션, 시나리오 섹션, 개요 · 제약사항 · 비고 섹션 |
| Constitution 준수 | 10 | `constitution_version`이 프로젝트 constitution과 일치 |
| 참조 링크 | 10 | 관련 문서 링크 |
| 메타데이터 완성도 | 10 | 필수 · 선택 frontmatter 필드 |

플레이스홀더 시나리오 제목(`### 시나리오 없음`, `#### Scenario (TBD)`)과 코드 펜스 안의 제목은 무시합니다.

## 등급

| 점수 | 등급 |
|------|------|
| 90-100% | A |
| 80-89% | B |
| 70-79% | C |
| 60-69% | D |
| <60% | F |

## 예시

### 단일 스펙 분석

```bash
sdd quality auth/login
```

출력:
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

### 전체 스펙 분석

```bash
sdd quality --all
```

평균 등급, 등급 분포, 스펙별 점수를 출력합니다. 파싱할 수 없는 스펙은 평균에 0%로 반영되고 목록에 표시됩니다.

### CI 모드

```bash
sdd quality --all --min-score 70
```

리포트를 출력한 뒤, 점수가 `--min-score` 미만이면 종료 코드 2(`VALIDATION_FAILED`)로 끝납니다.

### JSON 출력

```bash
sdd quality auth/login --json
```

```json
{
  "specId": "login",
  "specPath": "/abs/path/to/project/.sdd/specs/auth/login/spec.md",
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
  ],
  "summary": "스펙 'login'의 품질 점수: 64/100 (64%, 등급: D)",
  "topSuggestions": [
    "frontmatter에 constitution_version을 추가하세요",
    "관련 문서나 외부 참조 링크를 추가하면 좋습니다"
  ]
}
```

`specPath`는 절대 경로이고 `items`에는 기준마다 항목이 하나씩 있습니다(여기서는 생략). `--all`이면 출력은
`{ averageScore, averagePercentage, grade, totalSpecs, specResults: [ 스펙별 위 객체 ], failedSpecs, summary }`입니다.

## 관련 문서

- [sdd validate](./validate) - 스펙 검증
- [sdd report](./report) - 프로젝트 리포트
- [CLI 참고 문서](./) - 전체 명령어
