/**
 * /sdd.plan 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const planCommand: ClaudeCommand = {
  name: 'sdd.plan',
  content: `기능 명세에 대한 구현 계획을 작성합니다.

## 지시사항

1. \`.sdd/specs/\` 디렉토리에서 계획을 작성할 기능을 확인하세요
2. 해당 기능의 \`spec.md\`를 읽고 요구사항을 분석하세요
3. \`sdd new plan <feature-id>\` 명령어로 계획 템플릿을 생성하거나 기존 \`plan.md\`를 수정하세요

## 계획 작성 규칙

- 기술 결정사항과 그 근거를 명시
- 구현 단계(Phase)를 나누어 정의
- 각 단계별 산출물 목록 작성
- 리스크 분석 및 완화 전략 포함
- 테스트 전략 수립

## 계획 구조

\`\`\`markdown
## 기술 결정
### 결정 1: [제목]
**근거:** [왜 이 기술/방식을 선택했는지]

## 구현 단계
### Phase 1: 기반 구조
[설명]
**산출물:**
- [ ] 산출물 1
- [ ] 산출물 2

## 리스크 분석
| 리스크 | 영향도 | 완화 전략 |
\`\`\`

완료 후 \`/sdd.tasks\`로 작업을 분해하세요.
`,
};
