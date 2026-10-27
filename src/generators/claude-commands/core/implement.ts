/**
 * /sdd.implement 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const implementCommand: ClaudeCommand = {
  name: 'sdd.implement',
  content: `작업 목록을 기반으로 순차적으로 구현합니다.

## 지시사항

1. \`sdd status\`로 현재 진행 상황을 확인하세요
2. 해당 기능의 \`tasks.md\`를 읽고 다음 작업을 확인하세요
3. 작업을 구현하고 완료 시 상태를 업데이트하세요

## 구현 규칙

- 한 번에 하나의 작업만 진행
- 테스트 우선: 실패하는 테스트 없이 구현 코드를 먼저 쓰지 않음
- 커밋 메시지에 작업 ID 포함
- 코드·테스트에 \`@spec <domain>/<feature>#REQ-xx\` 참조 추가
- \`.sdd/constitution.md\`의 원칙 준수

## 작업 흐름

1. \`sdd new task <feature> <task-id> in-progress\`
2. 시나리오를 실패하는 테스트로 작성하고 실패 확인 (Red)
3. 테스트를 통과하는 최소 구현 (Green), 리팩터링 (Refactor)
4. \`sdd new task <feature> <task-id> completed\`
5. 커밋: \`feat(<feature>): <task-id> - <설명>\`

## 완료 조건

모든 작업이 완료되면:
1. \`sdd validate\`와 \`sdd sync\`로 최종 검증
2. \`sdd new status <feature> implemented\`
3. 커밋 후 PR 생성 또는 머지
4. \`/sdd.status\`로 전체 진행 상황 확인
`,
};
