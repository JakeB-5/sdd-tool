/**
 * /sdd.transition 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const transitionCommand: ClaudeCommand = {
  name: 'sdd.transition',
  content: `워크플로우 간 전환을 수행합니다.

## 개요

작업 중 워크플로우를 변경해야 할 때 사용합니다:
- **new → change**: 새 기능이 기존 스펙 수정으로 변경
- **change → new**: 변경 범위가 커서 새 기능으로 분리

## new → change 전환

### 사용 시점
- 새 기능 작성 중 기존 스펙과 중복 발견
- 기존 기능 확장이 더 적절한 경우
- 의존성 분석 결과 기존 스펙 수정 필요

### 명령어

\`\`\`bash
sdd transition new-to-change <spec-id>
  -t, --title <title>    # 변경 제안 제목
  -r, --reason <reason>  # 전환 사유
\`\`\`

### 결과
- 새 변경 제안 생성 (.sdd/changes/<id>/)
- proposal.md, delta.md, tasks.md 생성
- 기존 스펙 참조 자동 설정

## change → new 전환

### 사용 시점
- 변경 범위가 너무 커서 별도 기능으로 분리 필요
- 기존 스펙과 독립적인 새 기능으로 발전
- 영향도 분석 결과 분리가 안전

### 명령어

\`\`\`bash
sdd transition change-to-new <change-id>
  -n, --name <name>      # 새 기능 이름
  -r, --reason <reason>  # 전환 사유
\`\`\`

### 결과
- 새 스펙 생성 (.sdd/specs/<name>/)
- spec.md, plan.md, tasks.md 생성
- 원본 변경 제안은 'transitioned' 상태로 변경

## 전환 판단 기준

### new → change 권장
- 영향받는 스펙 수 ≤ 3개
- 변경이 기존 기능의 자연스러운 확장
- 새 시나리오 추가보다 기존 시나리오 수정 중심

### change → new 권장
- 영향받는 스펙 수 > 3개
- 새로운 개념/도메인 도입
- 기존 스펙과 독립적으로 테스트 가능

## 가이드 보기

\`\`\`bash
sdd transition guide
\`\`\`
`,
};
