/**
 * AGENTS.md 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import { generateAgentsMd, validateAgentsMdFormat } from '../../../src/generators/agents-md.js';

describe('generateAgentsMd', () => {
  it('프로젝트 이름을 포함한다', () => {
    const result = generateAgentsMd({ projectName: 'my-project' });

    expect(result).toContain('my-project');
  });

  it('프로젝트 설명을 포함한다', () => {
    const result = generateAgentsMd({
      projectName: 'my-project',
      projectDescription: '테스트 프로젝트입니다',
    });

    expect(result).toContain('테스트 프로젝트입니다');
  });

  it('기본 프로젝트 설명을 사용한다', () => {
    const result = generateAgentsMd({ projectName: 'my-project' });

    expect(result).toContain('프로젝트 설명을 추가하세요');
  });

  it('RFC 2119 키워드 테이블을 포함한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('SHALL');
    expect(result).toContain('MUST');
    expect(result).toContain('SHOULD');
    expect(result).toContain('MAY');
    expect(result).toContain('SHALL NOT');
  });

  it('GIVEN-WHEN-THEN 형식 설명을 포함한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('GIVEN');
    expect(result).toContain('WHEN');
    expect(result).toContain('THEN');
  });

  it('디렉토리 구조를 포함한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('.sdd/');
    expect(result).toContain('constitution.md');
    expect(result).toContain('specs/');
    expect(result).toContain('changes/');
  });

  it('워크플로우 섹션을 포함한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('신규 기능 워크플로우');
    expect(result).toContain('변경 워크플로우');
  });

  it('슬래시 커맨드 목록을 포함한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('/sdd.new');
    expect(result).toContain('/sdd.plan');
    expect(result).toContain('/sdd.validate');
  });
});

describe('validateAgentsMdFormat', () => {
  it('유효한 AGENTS.md를 통과시킨다', () => {
    const content = generateAgentsMd({ projectName: 'test' });
    const result = validateAgentsMdFormat(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('RFC 2119 키워드 누락 시 에러를 반환한다', () => {
    const content = `# AGENTS.md

> 워크플로우 지침

GIVEN something
WHEN action
THEN result
`;
    const result = validateAgentsMdFormat(content);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('RFC 2119'))).toBe(true);
  });

  it('GIVEN-WHEN-THEN 누락 시 에러를 반환한다', () => {
    const content = `# AGENTS.md

> 워크플로우 지침

SHALL do something
MUST do another
`;
    const result = validateAgentsMdFormat(content);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('GIVEN-WHEN-THEN'))).toBe(true);
  });

  it('상단 50줄만 검사한다', () => {
    // 상단 50줄에 필수 요소 없음
    const emptyLines = Array(60).fill('').join('\n');
    const content = emptyLines + '\nSHALL MUST GIVEN WHEN THEN';

    const result = validateAgentsMdFormat(content);

    expect(result.valid).toBe(false);
  });

  it('상단 50줄 내에 필수 요소가 있으면 통과한다', () => {
    const content = `# AGENTS.md

SHALL do this
MUST do that
GIVEN condition
WHEN action
THEN result
`;
    const result = validateAgentsMdFormat(content);

    expect(result.valid).toBe(true);
  });
});
