/**
 * Delta 파서 및 생성기
 */
import matter from 'gray-matter';
import { z } from 'zod';
import { DeltaType, DeltaMetadataSchema } from './schemas.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';

/**
 * 델타 항목
 */
export interface DeltaItem {
  type: DeltaType;
  content: string;
  target?: string;
  before?: string;
  after?: string;
}

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
 * Delta 파싱
 */
export function parseDelta(content: string): Result<ParsedDelta, ChangeError> {
  try {
    const { data: frontmatter, content: body } = matter(content);

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

    // ADDED 섹션 추출
    const addedMatch = body.match(/##\s*ADDED\s*([\s\S]*?)(?=\n##|$)/i);
    const added: DeltaItem[] = [];
    if (addedMatch && addedMatch[1].trim()) {
      added.push({
        type: 'ADDED',
        content: addedMatch[1].trim(),
      });
    }

    // MODIFIED 섹션 추출
    const modifiedMatch = body.match(/##\s*MODIFIED\s*([\s\S]*?)(?=\n##\s+(?:REMOVED|ADDED)|$)/i);
    const modified: DeltaItem[] = [];
    if (modifiedMatch) {
      const contentTrimmed = modifiedMatch[1].trim();

      // 빈 섹션이나 템플릿만 있는 경우 스킵
      if (contentTrimmed.length > 0 &&
          !contentTrimmed.includes('{{SPEC_PATH}}') &&
          contentTrimmed !== '기존 내용') {
        // Before/After 블록 추출 - 더 유연한 패턴
        const beforeMatch = contentTrimmed.match(/####?\s*Before\s*\n+```(?:markdown)?\n([\s\S]*?)\n```/i);
        const afterMatch = contentTrimmed.match(/####?\s*After\s*\n+```(?:markdown)?\n([\s\S]*?)\n```/i);

        modified.push({
          type: 'MODIFIED',
          content: contentTrimmed,
          before: beforeMatch?.[1]?.trim(),
          after: afterMatch?.[1]?.trim(),
        });
      }
    }

    // REMOVED 섹션 추출
    const removedMatch = body.match(/##\s*REMOVED\s*([\s\S]*?)(?=\n##|$)/i);
    const removed: DeltaItem[] = [];
    if (removedMatch && removedMatch[1].trim()) {
      removed.push({
        type: 'REMOVED',
        content: removedMatch[1].trim(),
      });
    }

    return success({
      metadata: metadataResult.data,
      title,
      added,
      modified,
      removed,
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
  added?: string[];
  modified?: Array<{ target: string; before: string; after: string }>;
  removed?: string[];
}

/**
 * Delta 템플릿 생성
 */
export function generateDelta(options: GenerateDeltaOptions): string {
  const today = new Date().toISOString().split('T')[0];

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
    content += `### {{SPEC_PATH}}

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

  // MODIFIED에 Before/After가 있는지 확인
  if (result.hasModified) {
    const mod = delta.modified[0];
    if (!mod.before || !mod.after) {
      result.warnings.push('MODIFIED 섹션에 Before/After 블록이 없습니다.');
    }
  }

  return result;
}
