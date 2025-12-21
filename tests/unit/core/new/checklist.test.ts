/**
 * 체크리스트 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CHECKLISTS,
  createChecklist,
  checklistToMarkdown,
  parseChecklistFromMarkdown,
  isChecklistComplete,
  getChecklistProgress,
  toggleChecklistItem,
  createWorkflowChecklists,
  generateFullChecklistMarkdown,
} from '../../../../src/core/new/checklist.js';

describe('DEFAULT_CHECKLISTS', () => {
  it('모든 카테고리의 체크리스트가 정의되어 있다', () => {
    expect(DEFAULT_CHECKLISTS['pre-spec']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['post-spec']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['pre-plan']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['post-plan']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['pre-impl']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['post-impl']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['pre-review']).toBeDefined();
    expect(DEFAULT_CHECKLISTS['post-review']).toBeDefined();
  });

  it('각 체크리스트에 항목이 있다', () => {
    for (const category of Object.keys(DEFAULT_CHECKLISTS)) {
      expect(DEFAULT_CHECKLISTS[category as keyof typeof DEFAULT_CHECKLISTS].length).toBeGreaterThan(0);
    }
  });
});

describe('createChecklist', () => {
  it('카테고리에 맞는 체크리스트를 생성한다', () => {
    const checklist = createChecklist('pre-spec');

    expect(checklist.length).toBe(DEFAULT_CHECKLISTS['pre-spec'].length);
    expect(checklist[0].category).toBe('pre-spec');
    expect(checklist[0].checked).toBe(false);
    expect(checklist[0].id).toMatch(/^pre-spec-\d+$/);
  });
});

describe('checklistToMarkdown', () => {
  it('체크리스트를 마크다운으로 변환한다', () => {
    const items = [
      { id: 'test-01', text: '항목 1', checked: false, category: 'pre-spec' as const },
      { id: 'test-02', text: '항목 2', checked: true, category: 'pre-spec' as const },
    ];

    const markdown = checklistToMarkdown(items);

    expect(markdown).toContain('- [ ] 항목 1');
    expect(markdown).toContain('- [x] 항목 2');
  });

  it('제목을 포함할 수 있다', () => {
    const items = [
      { id: 'test-01', text: '항목', checked: false, category: 'pre-spec' as const },
    ];

    const markdown = checklistToMarkdown(items, '체크리스트');

    expect(markdown).toContain('## 체크리스트');
  });
});

describe('parseChecklistFromMarkdown', () => {
  it('마크다운에서 체크리스트를 파싱한다', () => {
    const markdown = `## 체크리스트

- [ ] 미완료 항목
- [x] 완료된 항목
`;

    const items = parseChecklistFromMarkdown(markdown, 'pre-spec');

    expect(items).toHaveLength(2);
    expect(items[0].text).toBe('미완료 항목');
    expect(items[0].checked).toBe(false);
    expect(items[1].text).toBe('완료된 항목');
    expect(items[1].checked).toBe(true);
  });
});

describe('isChecklistComplete', () => {
  it('모든 항목이 체크되면 true를 반환한다', () => {
    const items = [
      { id: 't1', text: '항목', checked: true, category: 'pre-spec' as const },
      { id: 't2', text: '항목', checked: true, category: 'pre-spec' as const },
    ];

    expect(isChecklistComplete(items)).toBe(true);
  });

  it('하나라도 미체크면 false를 반환한다', () => {
    const items = [
      { id: 't1', text: '항목', checked: true, category: 'pre-spec' as const },
      { id: 't2', text: '항목', checked: false, category: 'pre-spec' as const },
    ];

    expect(isChecklistComplete(items)).toBe(false);
  });
});

describe('getChecklistProgress', () => {
  it('진행률을 계산한다', () => {
    const items = [
      { id: 't1', text: '항목', checked: true, category: 'pre-spec' as const },
      { id: 't2', text: '항목', checked: true, category: 'pre-spec' as const },
      { id: 't3', text: '항목', checked: false, category: 'pre-spec' as const },
      { id: 't4', text: '항목', checked: false, category: 'pre-spec' as const },
    ];

    const progress = getChecklistProgress(items);

    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(4);
    expect(progress.percentage).toBe(50);
  });

  it('빈 체크리스트는 0%를 반환한다', () => {
    const progress = getChecklistProgress([]);

    expect(progress.percentage).toBe(0);
  });
});

describe('toggleChecklistItem', () => {
  it('항목의 체크 상태를 토글한다', () => {
    const items = [
      { id: 't1', text: '항목', checked: false, category: 'pre-spec' as const },
    ];

    const toggled = toggleChecklistItem(items, 't1');

    expect(toggled[0].checked).toBe(true);
  });

  it('존재하지 않는 ID는 무시한다', () => {
    const items = [
      { id: 't1', text: '항목', checked: false, category: 'pre-spec' as const },
    ];

    const toggled = toggleChecklistItem(items, 'unknown');

    expect(toggled[0].checked).toBe(false);
  });
});

describe('createWorkflowChecklists', () => {
  it('모든 워크플로우 단계의 체크리스트를 생성한다', () => {
    const checklists = createWorkflowChecklists();

    expect(Object.keys(checklists)).toContain('명세 작성 전');
    expect(Object.keys(checklists)).toContain('명세 작성 후');
    expect(Object.keys(checklists)).toContain('계획 작성 전');
    expect(Object.keys(checklists)).toContain('계획 작성 후');
    expect(Object.keys(checklists)).toContain('구현 전');
    expect(Object.keys(checklists)).toContain('구현 후');
    expect(Object.keys(checklists)).toContain('리뷰 전');
    expect(Object.keys(checklists)).toContain('리뷰 후');
  });
});

describe('generateFullChecklistMarkdown', () => {
  it('전체 체크리스트 마크다운을 생성한다', () => {
    const markdown = generateFullChecklistMarkdown();

    expect(markdown).toContain('# SDD 워크플로우 체크리스트');
    expect(markdown).toContain('## 명세 작성 전');
    expect(markdown).toContain('## 구현 후');
    expect(markdown).toContain('- [ ]');
  });
});
