/**
 * 슬래시 커맨드 프롬프트 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  FORMAT_GUIDE,
  CHANGE_PROMPT,
  APPLY_PROMPT,
  ARCHIVE_PROMPT,
  IMPACT_PROMPT,
  VALIDATE_PROMPT,
  NEW_PROMPT,
  PLAN_PROMPT,
  TASKS_PROMPT,
  getPrompt,
  getAvailableCommands,
} from '../../../src/prompts/index.js';

describe('FORMAT_GUIDE', () => {
  it('RFC 2119 키워드를 포함한다', () => {
    expect(FORMAT_GUIDE).toContain('SHALL');
    expect(FORMAT_GUIDE).toContain('MUST');
    expect(FORMAT_GUIDE).toContain('SHOULD');
    expect(FORMAT_GUIDE).toContain('MAY');
    expect(FORMAT_GUIDE).toContain('SHALL NOT');
  });

  it('GIVEN-WHEN-THEN 형식을 포함한다', () => {
    expect(FORMAT_GUIDE).toContain('GIVEN');
    expect(FORMAT_GUIDE).toContain('WHEN');
    expect(FORMAT_GUIDE).toContain('THEN');
  });
});

describe('CHANGE_PROMPT', () => {
  it('형식 가이드를 포함한다', () => {
    expect(CHANGE_PROMPT).toContain('RFC 2119');
    expect(CHANGE_PROMPT).toContain('GIVEN-WHEN-THEN');
  });

  it('생성 전 체크리스트를 포함한다', () => {
    expect(CHANGE_PROMPT).toContain('생성 전 체크리스트');
    expect(CHANGE_PROMPT).toContain('변경 대상 스펙 확인');
  });

  it('생성 후 확인 항목을 포함한다', () => {
    expect(CHANGE_PROMPT).toContain('생성 후 확인');
    expect(CHANGE_PROMPT).toContain('sdd validate');
  });

  it('델타 형식을 포함한다', () => {
    expect(CHANGE_PROMPT).toContain('ADDED');
    expect(CHANGE_PROMPT).toContain('MODIFIED');
    expect(CHANGE_PROMPT).toContain('REMOVED');
  });
});

describe('APPLY_PROMPT', () => {
  it('적용 전 체크리스트를 포함한다', () => {
    expect(APPLY_PROMPT).toContain('적용 전 체크리스트');
    expect(APPLY_PROMPT).toContain('approved');
  });

  it('적용 프로세스를 포함한다', () => {
    expect(APPLY_PROMPT).toContain('적용 프로세스');
    expect(APPLY_PROMPT).toContain('delta.md');
  });

  it('다음 단계 안내를 포함한다', () => {
    expect(APPLY_PROMPT).toContain('/sdd:archive');
  });
});

describe('ARCHIVE_PROMPT', () => {
  it('아카이브 전 체크리스트를 포함한다', () => {
    expect(ARCHIVE_PROMPT).toContain('아카이브 전 체크리스트');
  });

  it('아카이브 프로세스를 포함한다', () => {
    expect(ARCHIVE_PROMPT).toContain('아카이브 프로세스');
    expect(ARCHIVE_PROMPT).toContain('.sdd/archive/');
  });
});

describe('IMPACT_PROMPT', () => {
  it('영향도 분석 내용을 포함한다', () => {
    expect(IMPACT_PROMPT).toContain('영향도 분석');
    expect(IMPACT_PROMPT).toContain('의존성 그래프');
    expect(IMPACT_PROMPT).toContain('리스크 점수');
  });

  it('CLI 사용법을 포함한다', () => {
    expect(IMPACT_PROMPT).toContain('sdd impact');
    expect(IMPACT_PROMPT).toContain('--graph');
    expect(IMPACT_PROMPT).toContain('--json');
  });

  it('영향 수준 기준을 포함한다', () => {
    expect(IMPACT_PROMPT).toContain('높음');
    expect(IMPACT_PROMPT).toContain('중간');
    expect(IMPACT_PROMPT).toContain('낮음');
  });
});

describe('VALIDATE_PROMPT', () => {
  it('검증 항목을 포함한다', () => {
    expect(VALIDATE_PROMPT).toContain('검증 항목');
    expect(VALIDATE_PROMPT).toContain('YAML frontmatter');
    expect(VALIDATE_PROMPT).toContain('RFC 2119');
    expect(VALIDATE_PROMPT).toContain('GIVEN-WHEN-THEN');
  });

  it('CLI 사용법을 포함한다', () => {
    expect(VALIDATE_PROMPT).toContain('sdd validate');
    expect(VALIDATE_PROMPT).toContain('--strict');
  });
});

describe('NEW_PROMPT', () => {
  it('명세 생성 관련 내용을 포함한다', () => {
    expect(NEW_PROMPT).toContain('신규 기능 명세');
    expect(NEW_PROMPT).toContain('spec.md');
  });

  it('형식 가이드를 포함한다', () => {
    expect(NEW_PROMPT).toContain('RFC 2119');
    expect(NEW_PROMPT).toContain('GIVEN-WHEN-THEN');
  });

  it('CLI 사용법을 포함한다', () => {
    expect(NEW_PROMPT).toContain('sdd new');
    expect(NEW_PROMPT).toContain('--all');
  });
});

describe('PLAN_PROMPT', () => {
  it('구현 계획 관련 내용을 포함한다', () => {
    expect(PLAN_PROMPT).toContain('구현 계획');
    expect(PLAN_PROMPT).toContain('plan.md');
  });

  it('기술 결정 섹션을 포함한다', () => {
    expect(PLAN_PROMPT).toContain('기술 결정');
    expect(PLAN_PROMPT).toContain('근거');
  });

  it('CLI 사용법을 포함한다', () => {
    expect(PLAN_PROMPT).toContain('sdd new plan');
  });
});

describe('TASKS_PROMPT', () => {
  it('작업 분해 관련 내용을 포함한다', () => {
    expect(TASKS_PROMPT).toContain('작업 분해');
    expect(TASKS_PROMPT).toContain('tasks.md');
  });

  it('작업 상태를 포함한다', () => {
    expect(TASKS_PROMPT).toContain('대기');
    expect(TASKS_PROMPT).toContain('진행 중');
    expect(TASKS_PROMPT).toContain('완료');
  });

  it('CLI 사용법을 포함한다', () => {
    expect(TASKS_PROMPT).toContain('sdd new tasks');
  });
});

describe('getPrompt', () => {
  it('존재하는 명령어 프롬프트를 반환한다', () => {
    expect(getPrompt('change')).toBe(CHANGE_PROMPT);
    expect(getPrompt('apply')).toBe(APPLY_PROMPT);
    expect(getPrompt('archive')).toBe(ARCHIVE_PROMPT);
    expect(getPrompt('impact')).toBe(IMPACT_PROMPT);
    expect(getPrompt('validate')).toBe(VALIDATE_PROMPT);
    expect(getPrompt('new')).toBe(NEW_PROMPT);
    expect(getPrompt('plan')).toBe(PLAN_PROMPT);
    expect(getPrompt('tasks')).toBe(TASKS_PROMPT);
  });

  it('존재하지 않는 명령어는 undefined를 반환한다', () => {
    expect(getPrompt('unknown')).toBeUndefined();
  });
});

describe('getAvailableCommands', () => {
  it('모든 명령어를 반환한다', () => {
    const commands = getAvailableCommands();

    expect(commands).toContain('change');
    expect(commands).toContain('apply');
    expect(commands).toContain('archive');
    expect(commands).toContain('impact');
    expect(commands).toContain('validate');
    expect(commands).toContain('new');
    expect(commands).toContain('plan');
    expect(commands).toContain('tasks');
    expect(commands).toHaveLength(8);
  });
});
