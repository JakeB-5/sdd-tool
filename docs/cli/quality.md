# sdd quality

스펙의 품질을 분석하고 점수를 산출합니다.

## 사용법

```bash
sdd quality [spec-id] [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--all` | 모든 스펙 분석 |
| `--json` | JSON 형식으로 출력 |
| `--threshold <n>` | 최소 품질 점수 (기본: 70) |
| `--ci` | CI 모드 (임계값 미달 시 실패) |

## 품질 지표

| 지표 | 설명 | 가중치 |
|------|------|--------|
| RFC 2119 키워드 | SHALL, MUST, SHOULD 등 사용 | 25% |
| 시나리오 완성도 | GIVEN-WHEN-THEN 형식 준수 | 25% |
| 메타데이터 완성도 | 필수 필드 존재 여부 | 20% |
| 요구사항 명확성 | 요구사항 구체성 | 15% |
| 문서 구조 | 섹션 구조화 정도 | 15% |

## 예시

### 단일 스펙 분석

```bash
sdd quality user-auth
```

출력:
```
=== 품질 분석: user-auth ===

📊 종합 점수: 85/100 (우수)

📋 세부 점수:
  • RFC 2119 키워드: 90/100
    - SHALL: 5개
    - SHOULD: 3개
    - MAY: 1개

  • 시나리오 완성도: 85/100
    - GIVEN-WHEN-THEN: 4개
    - 불완전 시나리오: 1개

  • 메타데이터: 80/100
    - ✅ id, title, status
    - ⚠️  depends 미정의

  • 요구사항 명확성: 85/100
    - 구체적 요구사항: 8개
    - 모호한 표현: 1개

  • 문서 구조: 80/100
    - ✅ 섹션 구분 양호
    - ⚠️  예시 부족

💡 개선 제안:
  1. depends 필드를 추가하세요
  2. 시나리오 2번의 THEN 절을 구체화하세요
  3. API 예시를 추가하면 좋겠습니다
```

### 전체 스펙 분석

```bash
sdd quality --all
```

출력:
```
=== 전체 품질 분석 ===

📊 평균 점수: 78/100

스펙별 점수:
  🟢 user-auth: 85
  🟢 user-profile: 82
  🟡 order-checkout: 75
  🟡 payment-flow: 72
  🔴 notification: 58

통계:
  • 우수 (80+): 2개
  • 양호 (70-79): 2개
  • 미흡 (70 미만): 1개
```

### CI 모드

```bash
sdd quality --all --ci --threshold 70
```

품질 점수가 임계값 미달 시 종료 코드 1을 반환합니다.

### JSON 출력

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
    "depends 필드를 추가하세요",
    "시나리오 2번의 THEN 절을 구체화하세요"
  ]
}
```

## 품질 등급

| 점수 | 등급 | 설명 |
|------|------|------|
| 90-100 | 🟢 최우수 | 프로덕션 준비 완료 |
| 80-89 | 🟢 우수 | 약간의 개선 권장 |
| 70-79 | 🟡 양호 | 개선 필요 |
| 60-69 | 🟡 미흡 | 상당한 개선 필요 |
| 60 미만 | 🔴 부적합 | 대폭 수정 필요 |

## 관련 문서

- [sdd validate](/cli/validate) - 스펙 검증
- [sdd report](/cli/report) - 프로젝트 리포트
- [품질 가이드](/guide/quality)
