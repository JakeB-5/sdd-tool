/**
 * /sdd.guide 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const guideCommand: ClaudeCommand = {
  name: 'sdd.guide',
  content: `SDD 워크플로우 가이드를 표시합니다.

## 개요

SDD(Spec-Driven Development) 방법론의 전체 워크플로우를 안내합니다.
처음 사용자나 워크플로우를 잊었을 때 참고하세요.

## SDD 핵심 원칙

1. **명세 우선**: 코드보다 명세를 먼저 작성
2. **추적 가능성**: 모든 구현은 명세에서 추적 가능
3. **점진적 구체화**: 개요 → 상세 → 구현
4. **변경 관리**: 모든 변경은 제안 → 검토 → 적용

## 전체 워크플로우

\`\`\`
┌─────────────────────────────────────────────────┐
│                   SDD 워크플로우                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. 시작 ─────> /sdd.start 또는 sdd start      │
│     │                                           │
│     ▼                                           │
│  2. Constitution ─> /sdd.constitution          │
│     │              (프로젝트 원칙 정의)           │
│     ▼                                           │
│  3. 새 기능 ────> /sdd.new                      │
│     │            (spec.md 작성)                 │
│     ▼                                           │
│  4. 계획 ─────> /sdd.plan                       │
│     │          (plan.md 작성)                   │
│     ▼                                           │
│  5. 작업분해 ──> /sdd.tasks                     │
│     │          (tasks.md 작성)                  │
│     ▼                                           │
│  6. 구현 ─────> /sdd.implement                  │
│     │          (순차적 구현)                     │
│     ▼                                           │
│  7. 검증 ─────> /sdd.validate                   │
│     │                                           │
│     ▼                                           │
│  8. 완료 ─────> 머지 또는 배포                   │
│                                                 │
└─────────────────────────────────────────────────┘
\`\`\`

## 변경 워크플로우

기존 스펙을 수정할 때:

\`\`\`
1. /sdd.change ──> proposal.md 작성
       │
       ▼
2. sdd change validate <id> ──> 검증
       │
       ▼
3. sdd change apply <id> ──> 적용
       │
       ▼
4. sdd change archive <id> ──> 아카이브
\`\`\`

## 슬래시 커맨드 요약

| 커맨드 | 설명 | 사용 시점 |
|--------|------|----------|
| /sdd.start | 통합 진입점 | 처음 시작 시 |
| /sdd.new | 새 기능 명세 | 새 기능 개발 시 |
| /sdd.plan | 구현 계획 | 명세 완료 후 |
| /sdd.tasks | 작업 분해 | 계획 완료 후 |
| /sdd.implement | 구현 | 작업 분해 후 |
| /sdd.validate | 검증 | 구현 완료 후 |
| /sdd.change | 변경 제안 | 기존 스펙 수정 시 |
| /sdd.constitution | 헌법 관리 | 프로젝트 설정 시 |
| /sdd.chat | 대화형 모드 | 언제든지 |
| /sdd.analyze | 요청 분석 | 규모 판단 시 |

## CLI 명령어 요약

\`\`\`bash
sdd init                    # 프로젝트 초기화
sdd start                   # 워크플로우 시작
sdd new <name>              # 새 기능 생성
sdd new <name> --numbered   # 번호 자동 부여
sdd validate                # 스펙 검증
sdd validate --check-links  # 링크 검증 포함
sdd status                  # 상태 확인
sdd list                    # 스펙 목록
sdd change -l               # 변경 목록
sdd impact <spec>           # 영향도 분석
sdd transition guide        # 전환 가이드
\`\`\`

## 도움말

더 자세한 정보:
- \`sdd --help\` - CLI 도움말
- \`sdd <command> --help\` - 명령어별 도움말
`,
};
