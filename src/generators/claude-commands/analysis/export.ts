/**
 * /sdd.export 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const exportCommand: ClaudeCommand = {
  name: 'sdd.export',
  content: `---
description: 스펙을 HTML, JSON 등으로 내보내기
allowed-tools: Bash, Read, Write
argument-hint: [specId] [--format html] [-o output.html]
---

스펙 문서를 다양한 형식으로 내보냅니다.

## 개요

스펙을 HTML, JSON, 마크다운 형식으로 변환하여 팀원, 이해관계자와 공유합니다.

## 명령어

\`\`\`bash
# 단일 스펙 HTML 내보내기
sdd export user-auth --format html

# 전체 스펙 내보내기
sdd export --all --format html

# JSON 형식
sdd export user-auth --format json

# 마크다운 병합
sdd export --all --format markdown

# 출력 경로 지정
sdd export user-auth -o ./docs/user-auth.html

# 다크 테마
sdd export --all --theme dark

# 목차 제외
sdd export user-auth --no-toc
\`\`\`

## 지원 형식

| 형식 | 설명 |
|------|------|
| html | 스타일 포함 HTML (기본값) |
| json | 구조화된 JSON |
| markdown | 마크다운 병합 (.md) |

PDF는 직접 생성하지 않습니다. HTML로 내보낸 뒤 브라우저에서 인쇄하세요.

## HTML 기능

- 반응형 디자인
- 자동 목차 생성
- RFC 2119 키워드 강조
- GIVEN/WHEN/THEN 시각화
- 라이트/다크 테마
- 인쇄 최적화

## JSON 구조

스펙 수와 관계없이 항상 \`specs\` 배열을 가진 객체입니다.

\`\`\`json
{
  "specs": [
    {
      "id": "auth/user-auth",
      "title": "사용자 인증",
      "requirements": [
        { "id": "REQ-001", "title": "로그인", "keyword": "SHALL", "priority": "high" }
      ],
      "scenarios": [...]
    }
  ]
}
\`\`\`

## 출력 예시

\`\`\`
=== SDD 내보내기 ===

형식: HTML
스펙: 3개
출력: ./specs.html
크기: 45.32 KB
\`\`\`

내보낸 파일의 내용을 확인하고 필요시 추가 형식으로 내보내세요.
`,
};
