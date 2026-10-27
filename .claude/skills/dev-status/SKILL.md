---
name: dev-status
description: SDD CLI 구현 진행 상황을 분석하고 Phase별 스펙 현황, 구현 완료율, 테스트 통과율을 보고합니다. 사용자가 "현황", "진행 상황", "얼마나 됐어", "status" 등을 요청할 때 사용합니다.
allowed-tools: Read Glob Grep Bash(pnpm vitest *)
---

# 구현 진행 상황

## Instructions

### 1. 스펙 현황 수집

`.sdd/specs/` 디렉토리 스캔:
- 전체 스펙 수
- Phase별 분류
- 상태별 분류 (draft, review, implemented 등)

### 2. 구현 완료율 계산

```
완료율 = (implemented 스펙 수) / (전체 스펙 수) × 100
```

### 3. 테스트 상태 확인

```bash
pnpm vitest run --reporter=json
```

### 4. 리포트 생성

## Examples

**사용자**: "현재 진행 상황 알려줘"

**응답**:
```
## SDD 구현 현황

### 전체 진행률: 65% (13/20 스펙)

### Phase별 현황

| Phase | 전체 | 완료 | 진행률 |
|-------|------|------|--------|
| Phase 1 | 8 | 8 | 100% |
| Phase 2 | 7 | 5 | 71% |
| Phase 3 | 5 | 0 | 0% |

### 테스트 현황
- 전체: 45개
- 통과: 42개 (93%)
- 실패: 3개

### 다음 작업 추천
→ Phase 2의 남은 2개 스펙 완료
```
