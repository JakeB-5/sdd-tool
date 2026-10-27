/**
 * 스펙 파서 - 스펙 파일에서 요구사항 ID 추출
 */
import { promises as fs, statSync } from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../../utils/frontmatter.js';
import type { ExtractedRequirement } from './schemas.js';
import {
  listSpecs as listSpecLocations,
  resolveSpec,
  type SpecLocation,
} from '../spec/locator.js';

/**
 * 요구사항 ID 패턴
 * - REQ-001, REQ-01, REQ-1
 * - req-001 (소문자도 허용)
 */
const REQ_ID_PATTERN = /\b(REQ-\d+)\b/gi;

/**
 * RFC 2119 키워드 패턴
 */
const RFC_KEYWORD_PATTERN = /\((SHALL|MUST|SHOULD|MAY|SHALL NOT|MUST NOT)\)/i;

/**
 * 요구사항 섹션 헤더 패턴
 * - ### REQ-001: 제목
 * - #### REQ-01: 제목
 */
const REQ_HEADER_PATTERN = /^#{2,4}\s*(REQ-\d+):\s*(.+)$/i;

export class SpecParser {
  private specsDir: string;

  constructor(private projectRoot: string) {
    this.specsDir = path.join(projectRoot, '.sdd', 'specs');
  }

  /**
   * 특정 스펙에서 요구사항 추출 (ref: <domain>/<feature>, bare feature, 레거시 id)
   */
  async parseSpec(specRef: string): Promise<ExtractedRequirement[]> {
    const resolved = await resolveSpec(path.join(this.projectRoot, '.sdd'), specRef);
    if (!resolved.success) {
      return [];
    }
    return this.parseLocation(resolved.data);
  }

  /**
   * 모든 스펙에서 요구사항 추출
   */
  async parseAllSpecs(): Promise<ExtractedRequirement[]> {
    const locations = await listSpecLocations(path.join(this.projectRoot, '.sdd'));
    const allRequirements: ExtractedRequirement[] = [];

    for (const location of locations) {
      allRequirements.push(...(await this.parseLocation(location)));
    }

    return allRequirements;
  }

  /**
   * 스펙 목록 조회 (canonical id)
   */
  async listSpecs(): Promise<string[]> {
    const locations = await listSpecLocations(path.join(this.projectRoot, '.sdd'));
    return locations.map(l => l.id);
  }

  private async parseLocation(location: SpecLocation): Promise<ExtractedRequirement[]> {
    try {
      const content = await fs.readFile(location.specPath, 'utf-8');
      return this.extractRequirements(content, location.id);
    } catch {
      return [];
    }
  }

  /**
   * 마크다운 컨텐츠에서 요구사항 추출
   */
  private extractRequirements(content: string, specId: string): ExtractedRequirement[] {
    const { content: body } = parseFrontmatter(content);
    const lines = body.split('\n');
    const requirements: ExtractedRequirement[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 헤더 형식 체크: ### REQ-001: 제목
      const headerMatch = line.match(REQ_HEADER_PATTERN);
      if (headerMatch) {
        const id = headerMatch[1].toUpperCase();
        if (!seenIds.has(id)) {
          seenIds.add(id);

          // 다음 줄들에서 키워드 찾기
          const keyword = this.findKeywordInContext(lines, i);

          requirements.push({
            id,
            specId,
            title: headerMatch[2].trim(),
            line: lineNum,
            keyword,
          });
        }
        continue;
      }

      // 본문에서 REQ-xxx 패턴 찾기
      const matches = line.matchAll(REQ_ID_PATTERN);
      for (const match of matches) {
        const id = match[1].toUpperCase();
        if (!seenIds.has(id)) {
          seenIds.add(id);

          // 같은 줄에서 키워드 찾기
          const keywordMatch = line.match(RFC_KEYWORD_PATTERN);

          requirements.push({
            id,
            specId,
            line: lineNum,
            description: line.trim(),
            keyword: keywordMatch
              ? (keywordMatch[1].toUpperCase() as ExtractedRequirement['keyword'])
              : undefined,
          });
        }
      }
    }

    return requirements;
  }

  /**
   * 컨텍스트에서 RFC 2119 키워드 찾기
   */
  private findKeywordInContext(
    lines: string[],
    headerIndex: number
  ): ExtractedRequirement['keyword'] | undefined {
    // 헤더 이후 5줄 내에서 키워드 찾기
    for (let i = headerIndex; i < Math.min(headerIndex + 5, lines.length); i++) {
      const match = lines[i].match(RFC_KEYWORD_PATTERN);
      if (match) {
        return match[1].toUpperCase() as ExtractedRequirement['keyword'];
      }
    }
    return undefined;
  }

  /**
   * 스펙 디렉토리 존재 여부
   */
  exists(): boolean {
    try {
      const stat = statSync(this.specsDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
