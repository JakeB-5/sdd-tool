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

스펙의 REQ-xx 요구사항이 코드 또는 테스트에서 참조되는지 확인합니다.
REQ ID는 스펙마다 따로 매겨지므로 \`<domain>/<feature>#REQ-xx\` 형식으로 스펙을 지정합니다
(feature 이름이 유일하면 \`<feature>#REQ-xx\`도 가능).
bare \`@spec REQ-01\`은 그 ID를 가진 스펙이 하나뿐일 때만 매칭되고, 여러 스펙에 있으면 무시되며
"경고" 섹션에 보고됩니다. 코드 또는 테스트 중 하나에서 참조되면 구현됨, 아니면 미구현입니다.

## 명령어

\`\`\`bash
# 전체 스펙 동기화 검증
sdd sync

# 특정 스펙만 검증
sdd sync auth/login

# JSON 출력 (stdout에는 JSON만)
sdd sync --json

# CI 모드 (동기화율이 임계값 미만이면 종료 코드 2, 기본 임계값 100)
sdd sync --ci --threshold 80

# 마크다운 리포트
sdd sync --markdown
\`\`\`

## 코드 주석 규칙

\`\`\`typescript
/**
 * 사용자 로그인
 * @spec auth/login#REQ-01
 * @spec auth/login#REQ-02
 */
export async function login() { ... }
\`\`\`

## 테스트 매핑

\`\`\`typescript
it('auth/login#REQ-01: 올바른 자격 증명으로 로그인한다', () => { ... });
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
