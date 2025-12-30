/**
 * /sdd.analyze 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const analyzeCommand: ClaudeCommand = {
  name: 'sdd.analyze',
  content: `사용자 요청을 분석하여 적절한 워크플로우를 추천합니다.

## 개요

자연어 요청을 분석하여 작업 규모를 판단하고, 적절한 SDD 워크플로우를 추천합니다.

## 분석 기준

### 작업 규모 판단

**소규모 (Small)**
- 키워드: 수정, 변경, 버그, 오타, 추가(단순)
- 워크플로우: change 또는 직접 수정

**중규모 (Medium)**
- 키워드: 기능 추가, 개선, 확장, 리팩터링
- 워크플로우: new → plan → tasks

**대규모 (Large)**
- 키워드: 시스템, 아키텍처, 마이그레이션, 전면 개편
- 워크플로우: research → new → plan → tasks → prepare

### 워크플로우 선택

| 규모 | 추천 워크플로우 | 필수 산출물 |
|------|----------------|-------------|
| Small | /sdd.change | proposal.md |
| Medium | /sdd.new → /sdd.plan | spec.md, plan.md |
| Large | /sdd.research → /sdd.new | research.md, spec.md, plan.md |

## 사용 방법

1. 사용자의 요청을 입력받습니다
2. 키워드와 컨텍스트를 분석합니다
3. 작업 규모를 판단합니다
4. 적절한 워크플로우를 추천합니다

## 예시

**입력:** "로그인 기능 추가해줘"
**분석:**
- 키워드: "기능 추가" → 중규모
- 추천: /sdd.new → /sdd.plan → /sdd.tasks → /sdd.implement

**입력:** "로그인 버튼 색상 변경"
**분석:**
- 키워드: "변경" → 소규모
- 추천: 직접 수정 또는 /sdd.change

**입력:** "마이크로서비스 아키텍처로 전환"
**분석:**
- 키워드: "아키텍처", "전환" → 대규모
- 추천: /sdd.research → /sdd.new → /sdd.plan
`,
};
