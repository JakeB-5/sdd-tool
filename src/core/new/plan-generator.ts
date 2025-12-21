/**
 * 구현 계획 생성기
 */
import { Plan } from './schemas.js';

/**
 * 계획 생성 옵션
 */
export interface GeneratePlanOptions {
  featureId: string;
  featureTitle: string;
  overview: string;
  techDecisions?: Array<{
    decision: string;
    rationale: string;
    alternatives?: string[];
  }>;
  phases?: Array<{
    name: string;
    description: string;
    deliverables: string[];
  }>;
  risks?: Array<{
    risk: string;
    mitigation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  testingStrategy?: string;
  constitutionCompliance?: string[];
}

/**
 * plan.md 파일 내용 생성
 */
export function generatePlan(options: GeneratePlanOptions): string {
  const today = new Date().toISOString().split('T')[0];

  let content = `---
feature: ${options.featureId}
created: ${today}
status: draft
---

# 구현 계획: ${options.featureTitle}

> ${options.overview}

---

## 개요

${options.overview}

---

## 기술 결정

`;

  if (options.techDecisions?.length) {
    options.techDecisions.forEach((td, index) => {
      content += `### 결정 ${index + 1}: ${td.decision}

**근거:** ${td.rationale}

`;
      if (td.alternatives?.length) {
        content += `**대안 검토:**
${td.alternatives.map(alt => `- ${alt}`).join('\n')}

`;
      }
    });
  } else {
    content += `### 결정 1: [기술 결정 사항]

**근거:** [결정 근거]

**대안 검토:**
- [대안 1]
- [대안 2]

`;
  }

  content += `---

## 구현 단계

`;

  if (options.phases?.length) {
    options.phases.forEach((phase, index) => {
      content += `### Phase ${index + 1}: ${phase.name}

${phase.description}

**산출물:**
${phase.deliverables.map(d => `- [ ] ${d}`).join('\n')}

`;
    });
  } else {
    content += `### Phase 1: 기반 구조

[기반 구조 설명]

**산출물:**
- [ ] [산출물 1]
- [ ] [산출물 2]

### Phase 2: 핵심 기능

[핵심 기능 설명]

**산출물:**
- [ ] [산출물 1]
- [ ] [산출물 2]

### Phase 3: 통합 및 테스트

[통합 및 테스트 설명]

**산출물:**
- [ ] [산출물 1]
- [ ] [산출물 2]

`;
  }

  content += `---

## 리스크 분석

`;

  if (options.risks?.length) {
    content += `| 리스크 | 영향도 | 완화 전략 |
|--------|--------|----------|
`;
    options.risks.forEach(r => {
      const impactIcon = r.impact === 'high' ? '🔴' : r.impact === 'medium' ? '🟡' : '🟢';
      content += `| ${r.risk} | ${impactIcon} ${r.impact.toUpperCase()} | ${r.mitigation} |
`;
    });
    content += '\n';
  } else {
    content += `| 리스크 | 영향도 | 완화 전략 |
|--------|--------|----------|
| [리스크 1] | 🟡 MEDIUM | [완화 전략] |

`;
  }

  content += `---

## 테스트 전략

`;

  if (options.testingStrategy) {
    content += `${options.testingStrategy}

`;
  } else {
    content += `### 단위 테스트

- 각 모듈별 단위 테스트 작성
- 커버리지 목표: 80% 이상

### 통합 테스트

- API 엔드포인트 통합 테스트
- 시나리오 기반 테스트

### E2E 테스트

- 주요 사용자 시나리오 검증

`;
  }

  if (options.constitutionCompliance?.length) {
    content += `---

## 헌법 준수 사항

${options.constitutionCompliance.map(c => `- ${c}`).join('\n')}
`;
  }

  content += `
---

## 다음 단계

1. [ ] 이 계획에 대한 검토 및 승인
2. [ ] \`/sdd:tasks\` 명령으로 작업 분해
3. [ ] 구현 시작
`;

  return content;
}

/**
 * 계획 파싱
 */
export function parsePlan(content: string): Plan | null {
  // 기본 구조 추출
  const overviewMatch = content.match(/## 개요\s*\n\n([\s\S]*?)(?=\n---|\n##)/);
  const overview = overviewMatch ? overviewMatch[1].trim() : '';

  // 기술 결정 추출
  const techDecisions: Plan['techDecisions'] = [];
  const techMatch = content.match(/## 기술 결정\s*\n([\s\S]*?)(?=\n---)/);
  if (techMatch) {
    const decisions = techMatch[1].match(/### 결정 \d+: ([^\n]+)\s*\n\n\*\*근거:\*\* ([^\n]+)/g);
    if (decisions) {
      for (const d of decisions) {
        const match = d.match(/### 결정 \d+: ([^\n]+)\s*\n\n\*\*근거:\*\* ([^\n]+)/);
        if (match) {
          techDecisions.push({
            decision: match[1],
            rationale: match[2],
          });
        }
      }
    }
  }

  // 단계 추출
  const phases: Plan['phases'] = [];
  const phaseMatches = content.matchAll(/### Phase \d+: ([^\n]+)\s*\n+([^\n*]+)\s*\n+\*\*산출물:\*\*\s*\n([\s\S]*?)(?=\n###|\n---|$)/g);
  for (const match of phaseMatches) {
    const deliverables = match[3]
      .split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.replace(/^- \[[ x]\] /, '').trim());

    phases.push({
      name: match[1],
      description: match[2].trim(),
      deliverables,
    });
  }

  if (!overview) {
    return null;
  }

  return {
    overview,
    techDecisions,
    phases,
  };
}

/**
 * 계획 상태 업데이트
 */
export function updatePlanStatus(content: string, newStatus: string): string {
  return content.replace(
    /^(---\n[\s\S]*?)status:\s*\w+/m,
    `$1status: ${newStatus}`
  );
}
