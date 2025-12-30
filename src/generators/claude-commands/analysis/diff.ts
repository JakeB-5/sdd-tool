/**
 * /sdd.diff 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const diffCommand: ClaudeCommand = {
  name: 'sdd.diff',
  content: `---
description: 스펙 변경사항을 시각화합니다
allowed-tools: Bash, Read
argument-hint: [commit1] [commit2] [--staged] [--stat]
---

스펙 파일의 변경사항을 구조적으로 비교하여 시각화합니다.

## 개요

Git diff와 유사하게 스펙 변경을 보여주되, 요구사항/시나리오/키워드 변경을 구조적으로 인식합니다.

## 명령어

\`\`\`bash
# 작업 디렉토리 변경
sdd diff

# 스테이징된 변경
sdd diff --staged

# 커밋 간 비교
sdd diff abc123 def456

# 브랜치 비교
sdd diff main..feature/auth

# 특정 스펙만
sdd diff --spec user-auth

# 옵션
sdd diff --stat              # 통계 요약
sdd diff --name-only         # 파일명만
sdd diff --json              # JSON 출력
sdd diff --no-color          # 컬러 없음
\`\`\`

## 감지 항목

- **요구사항**: REQ-xxx 추가/수정/삭제
- **시나리오**: GIVEN-WHEN-THEN 변경
- **키워드**: RFC 2119 키워드 변경 (SHOULD → SHALL 등)
- **메타데이터**: YAML frontmatter 변경

## 출력 예시

\`\`\`
=== SDD Diff ===

.sdd/specs/user-auth/spec.md

  요구사항 변경:
  ~ REQ-001: 사용자 로그인
    - 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHOULD)
    + 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL)
    ⚠️ REQ-001: SHOULD → SHALL (강화)

  + REQ-005: 소셜 로그인
    + 시스템은 Google OAuth를 지원해야 한다(MAY)

  시나리오 변경:
  + Scenario: Google 로그인
\`\`\`

## 통계 요약 (--stat)

\`\`\`
=== SDD Diff --stat ===

.sdd/specs/user-auth/spec.md
  요구사항: +1, ~1, -0
  시나리오: +1, ~0, -0
  키워드 변경: 1개 (강화: 1, 약화: 0)

총 변경: 1개 파일, 요구사항 +1 ~1 -0
\`\`\`

변경 내용을 분석하고 영향도를 평가해주세요.
`,
};
