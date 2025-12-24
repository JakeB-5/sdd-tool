/**
 * 스킬 생성기
 * 스킬 정의 파일 초안 생성
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DetectedTool } from './schemas.js';

/**
 * 스킬 생성 옵션
 */
export interface SkillGeneratorOptions {
  allowedTools?: string[];
}

/**
 * 생성된 스킬
 */
export interface GeneratedSkill {
  name: string;
  dirPath: string;
  filePath: string;
  content: string;
}

/**
 * 스킬 생성기 클래스
 */
export class SkillGenerator {
  private skillsDir: string;

  constructor(projectRoot: string) {
    this.skillsDir = path.join(projectRoot, '.claude', 'skills');
  }

  /**
   * 감지된 도구에서 스킬 초안 생성
   */
  generate(tool: DetectedTool, options?: SkillGeneratorOptions): GeneratedSkill {
    const allowedTools = options?.allowedTools ?? this.getDefaultTools(tool.name);

    const content = this.generateContent(tool, allowedTools);
    const dirPath = path.join(this.skillsDir, tool.name);
    const filePath = path.join(dirPath, 'SKILL.md');

    return {
      name: tool.name,
      dirPath,
      filePath,
      content,
    };
  }

  /**
   * 스킬 파일 생성
   */
  async writeSkill(skill: GeneratedSkill): Promise<void> {
    // 디렉토리 생성
    if (!fs.existsSync(skill.dirPath)) {
      fs.mkdirSync(skill.dirPath, { recursive: true });
    }

    fs.writeFileSync(skill.filePath, skill.content, 'utf-8');
  }

  /**
   * 스킬 콘텐츠 생성
   */
  private generateContent(tool: DetectedTool, allowedTools: string[]): string {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${tool.name}`);
    lines.push(`description: ${tool.description}`);
    lines.push(`allowed-tools: ${allowedTools.join(', ')}`);
    lines.push('---');
    lines.push('');

    // 제목
    lines.push(`# ${this.formatTitle(tool.name)} Skill`);
    lines.push('');

    // 설명
    lines.push(tool.description);
    lines.push('');

    // 지침
    lines.push('## Instructions');
    lines.push('');
    lines.push(...this.getInstructions(tool.name));
    lines.push('');

    // 사용 예시
    lines.push('## Examples');
    lines.push('');
    lines.push(...this.getExamples(tool.name));
    lines.push('');

    // 감지 근거
    if (tool.sources.length > 0) {
      lines.push('## Detection Sources');
      lines.push('');
      lines.push('> 이 스킬은 다음 문서에서 감지된 키워드를 기반으로 생성되었습니다.');
      lines.push('');
      for (const source of tool.sources.slice(0, 5)) {
        lines.push(`- ${source.file}:${source.line} - "${source.text.substring(0, 50)}..."`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 스킬별 기본 도구
   */
  private getDefaultTools(name: string): string[] {
    const toolMap: Record<string, string[]> = {
      'test': ['Read', 'Glob', 'Grep', 'Bash'],
      'gen-api': ['Read', 'Write', 'Edit', 'Glob'],
      'gen-component': ['Read', 'Write', 'Edit', 'Glob'],
      'db-migrate': ['Read', 'Write', 'Bash'],
      'doc': ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
      'gen-types': ['Read', 'Write', 'Edit', 'Glob'],
      'lint': ['Read', 'Bash'],
      'review': ['Read', 'Glob', 'Grep'],
    };

    return toolMap[name] ?? ['Read', 'Write', 'Edit', 'Glob'];
  }

  /**
   * 스킬별 지침
   */
  private getInstructions(name: string): string[] {
    const instructionMap: Record<string, string[]> = {
      'test': [
        '1. 대상 파일 또는 모듈 분석',
        '2. 테스트 케이스 작성',
        '3. 테스트 실행 및 결과 확인',
        '4. 커버리지 개선 제안',
      ],
      'gen-api': [
        '1. API 요구사항 분석',
        '2. 엔드포인트 구조 설계',
        '3. 라우터/컨트롤러 코드 생성',
        '4. 타입 정의 생성',
      ],
      'gen-component': [
        '1. 컴포넌트 요구사항 분석',
        '2. 컴포넌트 구조 설계',
        '3. 컴포넌트 코드 생성',
        '4. 스타일 및 테스트 생성',
      ],
      'db-migrate': [
        '1. 스키마 변경사항 분석',
        '2. 마이그레이션 파일 생성',
        '3. 마이그레이션 실행',
        '4. 롤백 스크립트 검증',
      ],
      'doc': [
        '1. 코드베이스 분석',
        '2. 문서화 대상 식별',
        '3. 문서 생성 (README, API 문서 등)',
        '4. 기존 문서 업데이트',
      ],
      'gen-types': [
        '1. 데이터 구조 분석',
        '2. TypeScript 타입/인터페이스 생성',
        '3. Zod 스키마 생성 (필요시)',
        '4. 타입 내보내기 설정',
      ],
      'lint': [
        '1. 린트 규칙 확인',
        '2. 린트 오류 검사',
        '3. 자동 수정 가능한 오류 수정',
        '4. 수동 수정 필요한 항목 리포트',
      ],
      'review': [
        '1. 변경된 코드 분석',
        '2. 코드 품질 검사',
        '3. 잠재적 문제점 식별',
        '4. 개선 제안 작성',
      ],
    };

    return instructionMap[name] ?? [
      '1. 요구사항 분석',
      '2. 작업 수행',
      '3. 결과 검증',
      '4. 리포트 작성',
    ];
  }

  /**
   * 스킬별 사용 예시
   */
  private getExamples(name: string): string[] {
    const exampleMap: Record<string, string[]> = {
      'test': [
        '**사용자**: UserService에 대한 테스트를 작성해줘',
        '',
        '**응답**: UserService의 주요 메서드에 대한 테스트 케이스를 작성하겠습니다...',
      ],
      'gen-api': [
        '**사용자**: 사용자 CRUD API를 생성해줘',
        '',
        '**응답**: 사용자 관리를 위한 CRUD API 엔드포인트를 생성하겠습니다...',
      ],
      'gen-component': [
        '**사용자**: 모달 컴포넌트를 만들어줘',
        '',
        '**응답**: 재사용 가능한 모달 컴포넌트를 생성하겠습니다...',
      ],
      'doc': [
        '**사용자**: API 문서를 업데이트해줘',
        '',
        '**응답**: 현재 API 엔드포인트를 분석하여 문서를 업데이트하겠습니다...',
      ],
    };

    return exampleMap[name] ?? [
      `**사용자**: ${this.formatTitle(name)} 작업을 수행해줘`,
      '',
      '**응답**: 요청하신 작업을 수행하겠습니다...',
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
