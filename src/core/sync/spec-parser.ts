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
 * RFC 2119 키워드 패턴
 */
const RFC_KEYWORD_PATTERN = /\((SHALL|MUST|SHOULD|MAY|SHALL NOT|MUST NOT)\)/i;

/**
 * 요구사항 정의 헤더 패턴
 *
 * A requirement is only counted when the spec *defines* it with a heading.
 * REQ IDs merely mentioned in prose (e.g. "see `pricing/checkout` REQ-05") are
 * references to other specs/requirements and must not become requirements.
 *
 * - ### REQ-001: 제목
 * - #### REQ-01: 제목
 * - ### REQ-01 제목   (콜론 없이 공백 구분)
 * - ### REQ-01 - 제목 (대시 구분)
 */
const REQ_HEADER_PATTERN = /^#{2,4}\s*(REQ-\d+)(?![\w-])\s*[:\-\u2013\u2014]?\s*(.*)$/i;

/**
 * 스펙 제목용 H1 헤더 패턴
 */
const H1_PATTERN = /^#\s+(.+)$/;

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
    const { content: body, data } = parseFrontmatter(content);
    const lines = body.split('\n');
    const requirements: ExtractedRequirement[] = [];
    const seenIds = new Set<string>();
    const specTitle = this.extractSpecTitle(data, lines);

    for (let i = 0; i < lines.length; i++) {
      // Only requirement heading lines define a requirement; REQ IDs in prose are ignored.
      const headerMatch = lines[i].match(REQ_HEADER_PATTERN);
      if (!headerMatch) continue;

      const id = headerMatch[1].toUpperCase();
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      requirements.push({
        id,
        specId,
        specTitle,
        title: headerMatch[2].trim() || undefined,
        line: i + 1,
        keyword: this.findKeywordInContext(lines, i),
      });
    }

    return requirements;
  }

  /**
   * 스펙 자체의 제목 (frontmatter `title` 우선, 없으면 첫 H1)
   */
  private extractSpecTitle(data: Record<string, unknown>, lines: string[]): string | undefined {
    if (typeof data.title === 'string' && data.title.trim()) {
      return data.title.trim();
    }
    for (const line of lines) {
      const match = line.match(H1_PATTERN);
      if (match) return match[1].trim();
    }
    return undefined;
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
