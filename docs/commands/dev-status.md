# dev-status (Skill)

SDD CLI 구현 진행 상황을 보고하는 개발 스킬입니다.

> **Note**: 이것은 슬래시 커맨드가 아닌 **스킬**입니다. Claude가 작업 컨텍스트에 따라 자동으로 선택하여 사용합니다.

## 개요

`dev-status` 스킬은 SDD CLI 구현 진행 상황을 분석하고 Phase별 스펙 현황, 구현 완료율, 테스트 통과율을 보고합니다.

## 트리거 조건

Claude가 다음과 같은 요청을 받으면 자동으로 이 스킬을 사용합니다:

- "현황", "진행 상황", "얼마나 됐어"
- "status", "progress"

## 사용 예시

```
User: 현황 보여줘

Claude: 📊 SDD CLI 구현 현황

## 전체 진행률

구현: ████████░░ 80%
테스트: ███████░░░ 70%

## Phase별 현황

### Phase 0: Git 워크플로우
| 스펙 | 구현 | 테스트 |
|------|------|--------|
| git-branch | ✅ | ✅ |
| git-commit | ✅ | ✅ |
| git-pr | ✅ | ⏳ |

### Phase 1: 역추출
| 스펙 | 구현 | 테스트 |
|------|------|--------|
| reverse-scan | ✅ | ✅ |
| reverse-extract | ✅ | ✅ |
| reverse-review | ✅ | ✅ |
| reverse-finalize | ✅ | ✅ |

## 통계

- 총 스펙: 25개
- 구현 완료: 20개 (80%)
- 테스트 완료: 18개 (72%)
- 문서화 완료: 22개 (88%)

## 다음 작업 추천

1. ⏳ export/json-format (테스트 미완료)
2. ⏳ cicd/github-actions (구현 필요)
```

## 상세 모드

```
User: 상세 현황 보여줘

Claude: 추가 정보:
- 각 스펙별 코드 라인 수
- 테스트 커버리지 %
- 최근 변경 일시
- 의존성 상태
```

## 관련 스킬

- [`dev-next`](/commands/dev-next) - 다음 구현 추천
- [`dev-review`](/commands/dev-review) - 코드 리뷰
