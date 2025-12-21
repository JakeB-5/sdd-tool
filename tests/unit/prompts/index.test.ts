/**
 * 슬래시 커맨드 프롬프트 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  FORMAT_GUIDE,
  CHANGE_PROMPT,
  APPLY_PROMPT,
  ARCHIVE_PROMPT,
  VALIDATE_PROMPT,
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

describe('getPrompt', () => {
  it('존재하는 명령어 프롬프트를 반환한다', () => {
    expect(getPrompt('change')).toBe(CHANGE_PROMPT);
    expect(getPrompt('apply')).toBe(APPLY_PROMPT);
    expect(getPrompt('archive')).toBe(ARCHIVE_PROMPT);
    expect(getPrompt('validate')).toBe(VALIDATE_PROMPT);
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
    expect(commands).toContain('validate');
    expect(commands).toHaveLength(4);
  });
});
