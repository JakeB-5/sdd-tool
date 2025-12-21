/**
 * 체크리스트 관리
 */

/**
 * 체크리스트 항목
 */
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: ChecklistCategory;
}

/**
 * 체크리스트 카테고리
 */
export type ChecklistCategory =
  | 'pre-spec'      // 명세 작성 전
  | 'post-spec'     // 명세 작성 후
  | 'pre-plan'      // 계획 작성 전
  | 'post-plan'     // 계획 작성 후
  | 'pre-impl'      // 구현 전
  | 'post-impl'     // 구현 후
  | 'pre-review'    // 리뷰 전
  | 'post-review';  // 리뷰 후

/**
 * 기본 체크리스트 템플릿
 */
export const DEFAULT_CHECKLISTS: Record<ChecklistCategory, string[]> = {
  'pre-spec': [
    '기능 요구사항이 명확히 정의됨',
    '사용자 스토리가 작성됨',
    '관련 이해관계자와 논의 완료',
    '기존 기능과의 충돌 여부 확인',
  ],
  'post-spec': [
    'RFC 2119 키워드 사용 확인 (SHALL, MUST, SHOULD, MAY)',
    'GIVEN-WHEN-THEN 시나리오 포함',
    '비기능 요구사항 명시',
    'sdd validate 통과',
  ],
  'pre-plan': [
    '명세가 승인됨',
    '기술 스택 결정됨',
    '아키텍처 검토 완료',
    '의존성 확인',
  ],
  'post-plan': [
    '구현 단계가 명확히 정의됨',
    '리스크 분석 완료',
    '테스트 전략 수립',
    '헌법 준수 사항 확인',
  ],
  'pre-impl': [
    '작업이 분해됨 (tasks.md)',
    '브랜치가 생성됨',
    '개발 환경 준비',
    '관련 테스트 환경 확인',
  ],
  'post-impl': [
    '모든 작업 완료',
    '단위 테스트 작성 및 통과',
    '통합 테스트 통과',
    '코드 커버리지 목표 달성 (80%+)',
    '린트 및 타입 체크 통과',
  ],
  'pre-review': [
    '셀프 코드 리뷰 완료',
    '문서 업데이트',
    'PR 설명 작성',
    '테스트 결과 첨부',
  ],
  'post-review': [
    '리뷰 피드백 반영',
    '최종 테스트 통과',
    '스펙 상태 업데이트',
    '아카이브 준비',
  ],
};

/**
 * 체크리스트 생성
 */
export function createChecklist(category: ChecklistCategory): ChecklistItem[] {
  const items = DEFAULT_CHECKLISTS[category];
  return items.map((text, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    text,
    checked: false,
    category,
  }));
}

/**
 * 체크리스트를 마크다운으로 변환
 */
export function checklistToMarkdown(
  items: ChecklistItem[],
  title?: string
): string {
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  items.forEach(item => {
    const checkbox = item.checked ? '[x]' : '[ ]';
    content += `- ${checkbox} ${item.text}\n`;
  });

  return content;
}

/**
 * 마크다운에서 체크리스트 파싱
 */
export function parseChecklistFromMarkdown(
  content: string,
  category: ChecklistCategory
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const regex = /- \[([ x])\] (.+)/g;
  let match;
  let index = 0;

  while ((match = regex.exec(content)) !== null) {
    items.push({
      id: `${category}-${String(++index).padStart(2, '0')}`,
      text: match[2],
      checked: match[1] === 'x',
      category,
    });
  }

  return items;
}

/**
 * 체크리스트 완료 여부 확인
 */
export function isChecklistComplete(items: ChecklistItem[]): boolean {
  return items.every(item => item.checked);
}

/**
 * 체크리스트 진행률 계산
 */
export function getChecklistProgress(items: ChecklistItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = items.filter(item => item.checked).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * 체크리스트 항목 토글
 */
export function toggleChecklistItem(
  items: ChecklistItem[],
  itemId: string
): ChecklistItem[] {
  return items.map(item =>
    item.id === itemId ? { ...item, checked: !item.checked } : item
  );
}

/**
 * 워크플로우 단계별 체크리스트 생성
 */
export function createWorkflowChecklists(): Record<string, ChecklistItem[]> {
  return {
    '명세 작성 전': createChecklist('pre-spec'),
    '명세 작성 후': createChecklist('post-spec'),
    '계획 작성 전': createChecklist('pre-plan'),
    '계획 작성 후': createChecklist('post-plan'),
    '구현 전': createChecklist('pre-impl'),
    '구현 후': createChecklist('post-impl'),
    '리뷰 전': createChecklist('pre-review'),
    '리뷰 후': createChecklist('post-review'),
  };
}

/**
 * 전체 체크리스트 마크다운 생성
 */
export function generateFullChecklistMarkdown(): string {
  const checklists = createWorkflowChecklists();
  let content = `# SDD 워크플로우 체크리스트

> 각 단계별로 확인해야 할 항목들입니다.

---

`;

  for (const [title, items] of Object.entries(checklists)) {
    content += checklistToMarkdown(items, title);
    content += '\n---\n\n';
  }

  return content;
}
