/**
 * /sdd.prepare 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const prepareCommand: ClaudeCommand = {
  name: 'sdd.prepare',
  content: `기능 구현 전 필요한 서브에이전트와 스킬을 점검합니다.

## 개요

스펙/계획/작업 문서를 분석하여 구현에 필요한 Claude Code 서브에이전트와 스킬을 감지하고,
누락된 도구가 있으면 자동으로 생성합니다.

## 지시사항

1. \`sdd prepare <feature-id>\` 명령어를 실행하세요
2. 감지된 도구 목록과 존재 여부를 확인하세요
3. 누락된 도구 생성 여부를 결정하세요

## 워크플로우

\`\`\`
/sdd.new → /sdd.plan → /sdd.tasks → sdd prepare → /sdd.implement
\`\`\`

## 명령어

\`\`\`bash
# 기본 사용 (대화형)
sdd prepare user-auth

# 미리보기 (파일 생성 없음)
sdd prepare user-auth --dry-run

# 자동 승인 (누락 도구 자동 생성)
sdd prepare user-auth --auto-approve

# JSON 출력
sdd prepare user-auth --json
\`\`\`

## 감지 대상

### 서브에이전트 (\`.claude/agents/*.md\`)

| 에이전트 | 감지 키워드 | 설명 |
|----------|-------------|------|
| test-runner | 테스트, test, jest, vitest | 테스트 실행 |
| api-scaffold | api, rest, endpoint | API 스캐폴딩 |
| component-gen | component, 컴포넌트, react | 컴포넌트 생성 |
| code-reviewer | review, 리뷰 | 코드 리뷰 |

### 스킬 (\`.claude/skills/<name>/SKILL.md\`)

| 스킬 | 감지 키워드 | 설명 |
|------|-------------|------|
| test | 테스트, test | 테스트 작성 |
| gen-api | api, rest | API 생성 |
| gen-component | component | 컴포넌트 생성 |
| db-migrate | database, 마이그레이션 | DB 마이그레이션 |
| gen-doc | 문서, doc | 문서 생성 |

## 출력 예시

\`\`\`
=== SDD Prepare: user-auth ===

분석 대상: 3개 문서, 5개 태스크

--- 서브에이전트 ---
  [x] test-runner (존재)
  [ ] api-scaffold (없음) → 생성 필요

--- 스킬 ---
  [x] test (존재)
  [ ] gen-api (없음) → 생성 필요

누락된 도구를 생성하시겠습니까? (y/n)
\`\`\`

## 생성 파일 구조

\`\`\`
.claude/
├── agents/
│   └── api-scaffold.md     # 에이전트 정의
└── skills/
    └── gen-api/
        └── SKILL.md        # 스킬 정의
\`\`\`

완료 후 \`/sdd.implement\`로 구현을 시작하세요.
`,
};
