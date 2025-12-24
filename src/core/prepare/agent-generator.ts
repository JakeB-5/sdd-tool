/**
 * 서브에이전트 생성기
 * 에이전트 정의 파일 초안 생성
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DetectedTool } from './schemas.js';

/**
 * 에이전트 생성 옵션
 */
export interface AgentGeneratorOptions {
  model?: string;
  tools?: string[];
}

/**
 * 생성된 에이전트
 */
export interface GeneratedAgent {
  name: string;
  filePath: string;
  content: string;
}

/**
 * 에이전트 생성기 클래스
 */
export class AgentGenerator {
  private agentsDir: string;

  constructor(projectRoot: string) {
    this.agentsDir = path.join(projectRoot, '.claude', 'agents');
  }

  /**
   * 감지된 도구에서 에이전트 초안 생성
   */
  generate(tool: DetectedTool, options?: AgentGeneratorOptions): GeneratedAgent {
    const model = options?.model ?? 'sonnet';
    const tools = options?.tools ?? this.getDefaultTools(tool.name);

    const content = this.generateContent(tool, model, tools);
    const filePath = path.join(this.agentsDir, `${tool.name}.md`);

    return {
      name: tool.name,
      filePath,
      content,
    };
  }

  /**
   * 에이전트 파일 생성
   */
  async writeAgent(agent: GeneratedAgent): Promise<void> {
    // 디렉토리 생성
    if (!fs.existsSync(this.agentsDir)) {
      fs.mkdirSync(this.agentsDir, { recursive: true });
    }

    fs.writeFileSync(agent.filePath, agent.content, 'utf-8');
  }

  /**
   * 에이전트 콘텐츠 생성
   */
  private generateContent(tool: DetectedTool, model: string, tools: string[]): string {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${tool.name}`);
    lines.push(`description: ${tool.description}`);
    lines.push(`tools: ${tools.join(', ')}`);
    lines.push(`model: ${model}`);
    lines.push('---');
    lines.push('');

    // 제목
    lines.push(`# ${this.formatTitle(tool.name)} Agent`);
    lines.push('');

    // 설명
    lines.push(tool.description);
    lines.push('');

    // 지침
    lines.push('## Instructions');
    lines.push('');
    lines.push(...this.getInstructions(tool.name));
    lines.push('');

    // 감지 근거
    if (tool.sources.length > 0) {
      lines.push('## Detection Sources');
      lines.push('');
      lines.push('> 이 에이전트는 다음 문서에서 감지된 키워드를 기반으로 생성되었습니다.');
      lines.push('');
      for (const source of tool.sources.slice(0, 5)) {
        lines.push(`- ${source.file}:${source.line} - "${source.text.substring(0, 50)}..."`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 에이전트별 기본 도구
   */
  private getDefaultTools(name: string): string[] {
    const toolMap: Record<string, string[]> = {
      'test-runner': ['Read', 'Glob', 'Grep', 'Bash'],
      'api-scaffold': ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
      'component-gen': ['Read', 'Write', 'Edit', 'Glob'],
      'doc-generator': ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
      'code-reviewer': ['Read', 'Glob', 'Grep', 'Bash'],
    };

    return toolMap[name] ?? ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'];
  }

  /**
   * 에이전트별 지침
   */
  private getInstructions(name: string): string[] {
    const instructionMap: Record<string, string[]> = {
      'test-runner': [
        '1. 테스트 파일 탐색 (`*.test.ts`, `*.spec.ts`)',
        '2. 테스트 실행 (`vitest run` 또는 `jest`)',
        '3. 실패한 테스트 분석',
        '4. 커버리지 리포트 생성',
      ],
      'api-scaffold': [
        '1. API 사양 분석',
        '2. 라우터/컨트롤러 보일러플레이트 생성',
        '3. 타입 정의 생성',
        '4. 기본 테스트 케이스 생성',
      ],
      'component-gen': [
        '1. 컴포넌트 요구사항 분석',
        '2. 컴포넌트 파일 생성',
        '3. 스타일 파일 생성',
        '4. 기본 테스트 생성',
      ],
      'doc-generator': [
        '1. 코드베이스 분석',
        '2. JSDoc/TSDoc 주석 생성',
        '3. README 업데이트',
        '4. API 문서 생성',
      ],
      'code-reviewer': [
        '1. 변경된 파일 분석',
        '2. 코드 품질 검사',
        '3. 보안 취약점 검사',
        '4. 개선 제안 작성',
      ],
    };

    return instructionMap[name] ?? [
      '1. 작업 요구사항 분석',
      '2. 필요한 파일 탐색',
      '3. 작업 수행',
      '4. 결과 검증',
    ];
  }

  /**
   * 이름 포맷팅 (kebab-case → Title Case)
   */
  private formatTitle(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
