/**
 * AGENTS.md 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generateAgentsMd,
  generateAgentsMdBlock,
  buildAgentsMdContent,
  hasSddBlock,
  validateAgentsMdFormat,
  SDD_BLOCK_BEGIN,
  SDD_BLOCK_END,
} from '../../../src/generators/agents-md.js';
import { generateAgents } from '../../../src/generators/agents/index.js';
import { generateClaudeSkills } from '../../../src/generators/claude-skills.js';

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

  it('생성되는 스킬 이름과 실제 CLI 명령어를 안내한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('`sdd-spec`');
    expect(result).toContain('`sdd-plan`');
    expect(result).toContain('`sdd-validate`');
    expect(result).toContain('sdd change apply <id>');
    expect(result).toContain('sdd change archive <id>');
  });

  it('Claude Code(/)와 Codex($) 호출 방법을 모두 안내한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('`/sdd-spec auth/login`');
    expect(result).toContain('`$sdd-spec auth/login`');
    expect(result).toContain('.claude/skills/');
    expect(result).toContain('.agents/skills/');
    expect(result).not.toContain('Claude Code에서는');
  });

  it('생성되는 모든 서브에이전트를 안내한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    for (const agent of generateAgents()) {
      expect(result).toContain(`\`${agent.name}\``);
    }
    expect(result).toContain('.claude/agents/');
    expect(result).toContain('.codex/agents/');
  });

  it('더 이상 .sdd/AGENTS.md를 안내하지 않는다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).not.toContain('AGENTS.md          # 이 파일');
    expect(result).not.toContain('.sdd/AGENTS.md');
  });

  it('존재하지 않는 dot 표기 커맨드를 안내하지 않는다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).not.toMatch(/\/sdd\.[a-z]/);
    expect(result).not.toContain('/sdd-new');
    expect(result).not.toContain('/sdd-change');
  });

  it('스킬 이름은 모두 실제로 생성되는 스킬 또는 서브에이전트다', () => {
    const result = generateAgentsMd({ projectName: 'test' });
    const known = new Set([
      ...generateClaudeSkills().map((s) => s.name),
      ...generateAgents().map((a) => a.name),
    ]);
    const referenced = [...result.matchAll(/`[/$]?(sdd-[a-z-]+)/g)].map((m) => m[1]);

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of referenced) {
      expect(known.has(name), name).toBe(true);
    }
  });

  it('domains.yml은 선택 항목으로 안내한다', () => {
    const result = generateAgentsMd({ projectName: 'test' });

    expect(result).toContain('domains.yml        # 도메인 정의 (선택, sdd init --with-domains)');
  });
});

describe('generateAgentsMdBlock', () => {
  it('감싼 마커 안에 지침을 넣는다', () => {
    const block = generateAgentsMdBlock({ projectName: 'demo' });
    const lines = block.split('\n');

    expect(lines[0]).toBe(SDD_BLOCK_BEGIN);
    expect(lines[lines.length - 1]).toBe(SDD_BLOCK_END);
    expect(block).toContain('# SDD Workflow Guide');
    expect(block.match(/<!-- sdd:(begin|end) -->/g)).toHaveLength(2);
  });

  it('Codex 기본 project_doc_max_bytes(32 KiB)보다 충분히 작다 (< 16 KiB)', () => {
    const block = generateAgentsMdBlock({ projectName: 'a-fairly-long-project-name' });
    expect(Buffer.byteLength(block, 'utf-8')).toBeLessThan(16 * 1024);
  });
});

describe('buildAgentsMdContent', () => {
  const block = `${SDD_BLOCK_BEGIN}\nguide v2\n${SDD_BLOCK_END}`;
  const oldBlock = `${SDD_BLOCK_BEGIN}\nguide v1\n${SDD_BLOCK_END}`;

  it('파일이 없으면 블록만으로 만든다', () => {
    expect(buildAgentsMdContent(null, block)).toBe(`${block}\n`);
  });

  it('블록이 없으면 사용자 내용 뒤에 덧붙인다', () => {
    expect(buildAgentsMdContent('# Mine\n', block)).toBe(`# Mine\n\n${block}\n`);
    expect(buildAgentsMdContent('# Mine', block)).toBe(`# Mine\n\n${block}\n`);
    expect(buildAgentsMdContent('', block)).toBe(`${block}\n`);
  });

  it('기존 블록만 교체하고 앞뒤 사용자 내용은 보존한다', () => {
    const existing = `# Mine\n\nintro\n\n${oldBlock}\n\n## After\nkeep me\n`;
    expect(buildAgentsMdContent(existing, block)).toBe(`# Mine\n\nintro\n\n${block}\n\n## After\nkeep me\n`);
  });

  it('같은 블록이면 null (멱등)', () => {
    const once = buildAgentsMdContent('# Mine\n', block)!;
    expect(buildAgentsMdContent(once, block)).toBeNull();
    expect(buildAgentsMdContent(buildAgentsMdContent(null, block)!, block)).toBeNull();
  });

  it('CRLF 파일은 CRLF로 블록을 쓰고 블록 밖 내용은 그대로 둔다', () => {
    const appended = buildAgentsMdContent('# Mine\r\nrule\r\n', block)!;
    expect(appended).toBe(`# Mine\r\nrule\r\n\r\n${block.split('\n').join('\r\n')}\r\n`);

    const existing = `# Mine\r\n${oldBlock.split('\n').join('\r\n')}\r\ntail\r\n`;
    expect(buildAgentsMdContent(existing, block)).toBe(
      `# Mine\r\n${block.split('\n').join('\r\n')}\r\ntail\r\n`
    );
    expect(buildAgentsMdContent(buildAgentsMdContent(existing, block)!, block)).toBeNull();
  });

  it('코드 블록 안의 마커는 무시한다', () => {
    const existing = `# Mine\n\n\`\`\`md\n${SDD_BLOCK_BEGIN}\n\`\`\`\n`;
    expect(buildAgentsMdContent(existing, block)).toBe(`${existing}\n${block}\n`);
  });

  it('선행 BOM을 그대로 보존한다', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(buildAgentsMdContent(`${bom}${oldBlock}\ntail\n`, block)).toBe(`${bom}${block}\ntail\n`);
    expect(buildAgentsMdContent(`${bom}# Mine\n`, block)).toBe(`${bom}# Mine\n\n${block}\n`);
    expect(buildAgentsMdContent(`${bom}${block}\n`, block)).toBeNull();
  });

  it('마커 짝이 맞지 않으면 수정하지 않고 에러를 던진다', () => {
    expect(() => buildAgentsMdContent(`${SDD_BLOCK_BEGIN}\nx\n`, block)).toThrow(/마커/);
    expect(() => buildAgentsMdContent(`${SDD_BLOCK_END}\n${SDD_BLOCK_BEGIN}\n`, block)).toThrow(/마커/);
    expect(() => buildAgentsMdContent(`${oldBlock}\n${oldBlock}\n`, block)).toThrow(/마커/);
  });
});

describe('hasSddBlock', () => {
  it('펜스 밖의 짝이 맞는 블록만 인정한다', () => {
    expect(hasSddBlock(`# Mine\n${SDD_BLOCK_BEGIN}\nx\n${SDD_BLOCK_END}\n`)).toBe(true);
    expect(hasSddBlock(`${String.fromCharCode(0xfeff)}${SDD_BLOCK_BEGIN}\r\nx\r\n${SDD_BLOCK_END}\r\n`)).toBe(true);
    expect(hasSddBlock(`\`\`\`md\n${SDD_BLOCK_BEGIN}\n${SDD_BLOCK_END}\n\`\`\`\n`)).toBe(false);
    expect(hasSddBlock(`${SDD_BLOCK_BEGIN}\nno end\n`)).toBe(false);
    expect(hasSddBlock('# Mine\n')).toBe(false);
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
