/**
 * Delta 파서 및 생성기
 */
import { z } from 'zod';
import { DeltaItem, localDateString } from './schemas.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { parseFrontmatter } from '../../utils/frontmatter.js';

/**
 * 파싱된 델타
 */
export interface ParsedDelta {
  metadata: {
    proposal: string;
    created: string;
  };
  title: string;
  added: DeltaItem[];
  modified: DeltaItem[];
  removed: DeltaItem[];
  rawContent: string;
}

/**
 * 델타 메타데이터 전처리 스키마
 */
const PreprocessedDeltaMetadataSchema = z.object({
  proposal: z.string(),
  created: z.preprocess(
    (val) => {
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD')
  ),
});

/**
 * Split markdown at headings of exactly `level` (deeper headings stay inside the
 * section; headings inside fenced code blocks are ignored). Returns sections keyed
 * by the heading's first word in upper case (first occurrence wins), in order.
 */
function splitSections(text: string, level: number): Map<string, string> {
  const result = new Map<string, string>();
  for (const section of splitMarkdownSections(text, level)) {
    if (section.heading === null) continue;
    const key = section.heading.split(/\s+/)[0].toUpperCase();
    if (!result.has(key)) {
      result.set(key, section.content);
    }
  }
  return result;
}

export interface MarkdownSection {
  /** Heading text, or null for content before the first heading */
  heading: string | null;
  content: string;
}

/**
 * Split markdown at headings of exactly `level`, ignoring headings inside fenced code blocks.
 */
export function splitMarkdownSections(text: string, level: number): MarkdownSection[] {
  const headingPattern = new RegExp(`^#{${level}}(?!#)\\s*(.*)$`);
  const sections: Array<{ heading: string | null; lines: string[] }> = [
    { heading: null, lines: [] },
  ];
  let fenceChar: string | null = null;

  for (const line of text.split('\n')) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const char = fenceMatch[1][0];
      if (fenceChar === null) {
        fenceChar = char;
      } else if (fenceChar === char) {
        fenceChar = null;
      }
    }

    const headingMatch = fenceChar === null && !fenceMatch ? line.match(headingPattern) : null;
    if (headingMatch) {
      sections.push({ heading: headingMatch[1].trim(), lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }

  return sections.map((s) => ({ heading: s.heading, content: s.lines.join('\n') }));
}

/**
 * Extract the first fenced block that follows a `#### Before` / `**Before:**` label.
 */
function extractFencedBlock(text: string, label: 'Before' | 'After'): string | undefined {
  const pattern = new RegExp(
    `(?:#{3,4}[ \\t]*${label}|\\*\\*${label}:?\\*\\*:?)[ \\t]*\\n+(\`{3,}|~{3,})[^\\n]*\\n([\\s\\S]*?)\\n\\1`,
    'i'
  );
  return text.match(pattern)?.[2]?.trim();
}

/**
 * Parse the MODIFIED section into one item per `### <target>` sub-heading.
 * Content without any target heading becomes a single untargeted item.
 */
function parseModifiedSection(sectionContent: string): DeltaItem[] {
  const trimmed = sectionContent.trim();
  // Empty section or the bare template placeholder
  if (!trimmed || trimmed === '기존 내용') {
    return [];
  }

  const targets = splitMarkdownSections(sectionContent, 3).filter(
    (s): s is { heading: string; content: string } => s.heading !== null
  );

  if (targets.length === 0) {
    return [
      {
        type: 'MODIFIED',
        content: trimmed,
        before: extractFencedBlock(trimmed, 'Before'),
        after: extractFencedBlock(trimmed, 'After'),
      },
    ];
  }

  return targets
    // Skip unfilled template targets
    .filter((s) => !s.heading.includes('{{SPEC_PATH}}'))
    .map((s) => {
      const content = s.content.trim();
      return {
        type: 'MODIFIED' as const,
        target: s.heading,
        content,
        before: extractFencedBlock(content, 'Before'),
        after: extractFencedBlock(content, 'After'),
      };
    });
}

/**
 * Delta 본문(frontmatter 제외)의 `## ADDED/MODIFIED/REMOVED` 섹션 파싱
 *
 * ADDED/REMOVED keep their whole section (including `###` sub-headings) as one item;
 * MODIFIED yields one item per `### <target>`.
 */
export function parseDeltaBody(body: string): {
  added: DeltaItem[];
  modified: DeltaItem[];
  removed: DeltaItem[];
} {
  // HTML comments are template placeholders, never delta content
  const sections = splitSections(body.replace(/<!--[\s\S]*?-->/g, ''), 2);

  const addedContent = sections.get('ADDED')?.trim() ?? '';
  const removedContent = sections.get('REMOVED')?.trim() ?? '';

  return {
    added: addedContent ? [{ type: 'ADDED', content: addedContent }] : [],
    modified: parseModifiedSection(sections.get('MODIFIED') ?? ''),
    removed: removedContent ? [{ type: 'REMOVED', content: removedContent }] : [],
  };
}

/**
 * Delta 파싱
 */
export function parseDelta(content: string): Result<ParsedDelta, ChangeError> {
  try {
    const { data: frontmatter, content: body } = parseFrontmatter(content);

    // 메타데이터 검증
    const metadataResult = PreprocessedDeltaMetadataSchema.safeParse(frontmatter);
    if (!metadataResult.success) {
      return failure(
        new ChangeError(`Delta 메타데이터 오류: ${metadataResult.error.message}`)
      );
    }

    // 제목 추출
    const titleMatch = body.match(/^#\s+(?:Delta:\s*)?(.+)$/m);
    const title = titleMatch?.[1]?.trim() || '';

    return success({
      metadata: metadataResult.data,
      title,
      ...parseDeltaBody(body),
      rawContent: body,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `Delta 파싱 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Delta 생성 옵션
 */
export interface GenerateDeltaOptions {
  proposalId: string;
  title: string;
  /** Affected spec paths; one MODIFIED template block is emitted per spec */
  affectedSpecs?: string[];
  added?: string[];
  modified?: Array<{ target: string; before: string; after: string }>;
  removed?: string[];
}

/**
 * Delta 템플릿 생성
 */
export function generateDelta(options: GenerateDeltaOptions): string {
  const today = localDateString();

  let content = `---
proposal: ${options.proposalId}
created: ${today}
---

# Delta: ${options.title}

## ADDED

`;

  if (options.added && options.added.length > 0) {
    content += options.added.join('\n\n');
  } else {
    content += '(추가되는 스펙 내용)';
  }

  content += '\n\n## MODIFIED\n\n';

  if (options.modified && options.modified.length > 0) {
    options.modified.forEach((mod) => {
      content += `### ${mod.target}\n\n`;
      content += `#### Before\n\n\`\`\`markdown\n${mod.before}\n\`\`\`\n\n`;
      content += `#### After\n\n\`\`\`markdown\n${mod.after}\n\`\`\`\n\n`;
    });
  } else {
    const targets = options.affectedSpecs?.length ? options.affectedSpecs : ['{{SPEC_PATH}}'];
    for (const target of targets) {
      content += `### ${target}

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

`;
    }
  }

  content += '## REMOVED\n\n';

  if (options.removed && options.removed.length > 0) {
    content += options.removed.join('\n\n');
  } else {
    content += '(삭제되는 스펙 참조)';
  }

  return content;
}

/**
 * Delta 유효성 검증
 */
export interface DeltaValidationResult {
  valid: boolean;
  hasAdded: boolean;
  hasModified: boolean;
  hasRemoved: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDelta(content: string): DeltaValidationResult {
  const result: DeltaValidationResult = {
    valid: true,
    hasAdded: false,
    hasModified: false,
    hasRemoved: false,
    errors: [],
    warnings: [],
  };

  const parseResult = parseDelta(content);
  if (!parseResult.success) {
    result.valid = false;
    result.errors.push(parseResult.error.message);
    return result;
  }

  const delta = parseResult.data;

  // 변경 내용 확인
  result.hasAdded = delta.added.length > 0 && delta.added[0].content !== '(추가되는 스펙 내용)';
  result.hasModified = delta.modified.length > 0 && delta.modified[0].content !== '';
  result.hasRemoved = delta.removed.length > 0 && delta.removed[0].content !== '(삭제되는 스펙 참조)';

  // 최소 하나의 변경이 있어야 함
  if (!result.hasAdded && !result.hasModified && !result.hasRemoved) {
    result.valid = false;
    result.errors.push('델타에 변경 내용이 없습니다. ADDED, MODIFIED, REMOVED 중 하나 이상이 필요합니다.');
  }

  // MODIFIED 대상마다 Before/After가 있는지 확인
  if (result.hasModified) {
    for (const mod of delta.modified) {
      if (!mod.before || !mod.after) {
        const where = mod.target ? ` (${mod.target})` : '';
        result.warnings.push(`MODIFIED 섹션${where}에 Before/After 블록이 없습니다.`);
      }
    }
  }

  return result;
}
