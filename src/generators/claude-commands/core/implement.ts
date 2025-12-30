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
- 각 작업 완료 후 테스트 작성 필수
- 커밋 메시지에 작업 ID 포함
- \`.sdd/constitution.md\`의 원칙 준수

## 작업 흐름

1. 작업 상태를 "진행 중"으로 변경
2. 코드 구현
3. 테스트 작성 및 실행
4. 작업 상태를 "완료"로 변경
5. 커밋: \`feat(<feature>): <task-id> - <설명>\`

## 완료 조건

모든 작업이 완료되면:
1. \`sdd validate\`로 최종 검증
2. 커밋 후 PR 생성 또는 머지
3. \`/sdd.status\`로 전체 진행 상황 확인
`,
};
