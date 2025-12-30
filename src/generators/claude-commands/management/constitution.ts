/**
 * /sdd.constitution 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const constitutionCommand: ClaudeCommand = {
  name: 'sdd.constitution',
  content: `프로젝트 Constitution(헌법)을 관리합니다.

## 개요

Constitution은 프로젝트의 핵심 원칙을 정의하는 문서입니다.
모든 스펙과 구현은 Constitution의 원칙을 준수해야 합니다.

## 지시사항

### 새 프로젝트 설정

1. 사용자에게 프로젝트의 핵심 가치와 원칙을 질문하세요
2. \`.sdd/constitution.md\` 파일을 열어 내용을 작성하세요
3. \`sdd constitution validate\`로 형식을 검증하세요

### 기존 Constitution 수정

1. \`sdd constitution show\`로 현재 내용을 확인하세요
2. Constitution 수정 후 버전을 업데이트하세요:
   - \`sdd constitution bump --patch -m "문구 수정"\`
   - \`sdd constitution bump --minor -m "새 원칙 추가"\`
   - \`sdd constitution bump --major -m "핵심 원칙 변경"\`

## Constitution 구조

\`\`\`markdown
---
version: 1.0.0
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Constitution: 프로젝트명

> 프로젝트 설명

## 핵심 원칙

### 1. 원칙명
- 규칙 (SHALL/MUST/SHOULD/MAY)

## 금지 사항
- 금지 규칙 (SHALL NOT/MUST NOT)

## 기술 스택
- 기술 선택

## 품질 기준
- 품질 요구사항
\`\`\`

## 버전 관리

- **MAJOR**: 핵심 원칙 변경 (기존 스펙에 영향)
- **MINOR**: 새 원칙 추가
- **PATCH**: 문구 수정, 오타 수정

## 명령어

\`\`\`bash
sdd constitution show      # 현재 Constitution 표시
sdd constitution version   # 버전만 표시
sdd constitution validate  # 형식 검증
sdd constitution history   # 변경 이력 조회
sdd constitution bump      # 버전 업데이트
\`\`\`
`,
};
