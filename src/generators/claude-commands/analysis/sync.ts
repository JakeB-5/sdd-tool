/**
 * /sdd.sync 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const syncCommand: ClaudeCommand = {
  name: 'sdd.sync',
  content: `---
description: 스펙-코드 동기화 상태를 검증합니다
allowed-tools: Bash, Read
argument-hint: [specId] [--json] [--ci]
---

스펙 요구사항과 코드 구현의 동기화 상태를 검증합니다.

## 개요

스펙의 REQ-xxx 요구사항이 코드에 구현되어 있는지 확인합니다.
코드에서 \`@spec REQ-xxx\` 주석이나 테스트에서 \`it('REQ-xxx: ...')\` 형식을 인식합니다.

## 명령어

\`\`\`bash
# 전체 스펙 동기화 검증
sdd sync

# 특정 스펙만 검증
sdd sync user-auth

# JSON 출력
sdd sync --json

# CI 모드 (동기화율 임계값 검사)
sdd sync --ci --threshold 80

# 마크다운 리포트
sdd sync --markdown
\`\`\`

## 코드 주석 규칙

\`\`\`typescript
/**
 * 사용자 로그인
 * @spec REQ-001
 * @spec REQ-002
 */
export async function login() { ... }
\`\`\`

## 테스트 매핑

\`\`\`typescript
it('REQ-001: 올바른 자격 증명으로 로그인한다', () => { ... });
\`\`\`

## 출력 예시

\`\`\`
=== SDD Sync: 스펙-코드 동기화 검증 ===

스펙: 3개, 요구사항: 15개

✓ 구현됨 (12/15)
  - REQ-001: 사용자 로그인 (src/auth/login.ts:45)
  ...

✗ 미구현 (3/15)
  - REQ-010: 비밀번호 재설정
  ...

동기화율: 80% (12/15)
\`\`\`

동기화 결과를 분석하고 미구현 요구사항에 대한 조치를 제안해주세요.
`,
};
