/**
 * 스펙 마크다운 파서
 */
import matter from 'gray-matter';
import {
  ParsedSpec,
  SpecMetadataSchema,
  Requirement,
  Scenario,
  extractRfc2119Keywords,
  type SpecMetadata,
} from './schemas.js';
import { Result, success, failure } from '../../types/index.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';

/**
 * 마크다운 스펙 파일 파싱
 */
export function parseSpec(content: string): Result<ParsedSpec, ValidationError> {
  try {
    // 1. Frontmatter 파싱
    const { data: rawMeta, content: body } = matter(content);

    // 2. 메타데이터 검증
    const metaResult = SpecMetadataSchema.safeParse(rawMeta);
    if (!metaResult.success) {
      const errors = metaResult.error.errors.map((e) => e.message).join(', ');
      return failure(new ValidationError(ErrorCode.SPEC_INVALID_FORMAT, `메타데이터 오류: ${errors}`));
    }
    const metadata: SpecMetadata = metaResult.data;

    // 3. 제목 추출
    const titleMatch = body.match(/^#\s+(.+)$/m);
    if (!titleMatch) {
      return failure(new ValidationError(ErrorCode.SPEC_MISSING_REQUIRED, '제목(# Title)이 필요합니다'));
    }
    const title = titleMatch[1].trim();

    // 4. 설명 추출 (제목 다음 줄의 blockquote)
    const descMatch = body.match(/^#\s+.+\n+>\s*(.+)$/m);
    const description = descMatch?.[1]?.trim();

    // 5. 요구사항 추출
    const requirements = parseRequirements(body);

    // 6. 시나리오 추출
    const scenarios = parseScenarios(body);

    return success({
      title,
      description,
      metadata,
      requirements,
      scenarios,
      rawContent: content,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(new ValidationError(ErrorCode.SPEC_PARSE_ERROR, message));
  }
}

/**
 * 요구사항 파싱
 */
function parseRequirements(content: string): Requirement[] {
  const requirements: Requirement[] = [];

  // ## Requirement: 섹션 찾기
  const reqSectionRegex = /##\s+Requirement:\s*(.+?)(?=\n##|\n---|\n$)/gs;
  let match: RegExpExecArray | null;
  let reqId = 1;

  while ((match = reqSectionRegex.exec(content)) !== null) {
    const sectionContent = match[0];
    const lines = sectionContent.split('\n');

    // 섹션 내에서 RFC 2119 키워드가 포함된 문장 찾기
    for (const line of lines) {
      const keywords = extractRfc2119Keywords(line);
      if (keywords.length > 0) {
        // 가장 강한 키워드 사용 (SHALL/MUST > SHOULD > MAY)
        const level = keywords.includes('SHALL') || keywords.includes('MUST')
          ? (keywords.includes('SHALL') ? 'SHALL' : 'MUST')
          : keywords.includes('SHOULD')
          ? 'SHOULD'
          : 'MAY';

        requirements.push({
          id: `REQ-${String(reqId++).padStart(3, '0')}`,
          level,
          description: line.trim(),
          raw: line,
        });
      }
    }
  }

  return requirements;
}

/**
 * 시나리오 파싱 (GIVEN-WHEN-THEN)
 */
function parseScenarios(content: string): Scenario[] {
  const scenarios: Scenario[] = [];

  // ### Scenario: 섹션 찾기
  const scenarioRegex = /###\s+Scenario:\s*(.+?)(?=\n###|\n##|\n---|\n$)/gs;
  let match: RegExpExecArray | null;

  while ((match = scenarioRegex.exec(content)) !== null) {
    const sectionContent = match[0];
    const nameMatch = sectionContent.match(/###\s+Scenario:\s*(.+)/);
    const name = nameMatch?.[1]?.trim() ?? 'Unnamed';

    const given: string[] = [];
    const then: string[] = [];
    let when = '';

    const lines = sectionContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // GIVEN 파싱
      const givenMatch = trimmed.match(/[-*]\s*\*?\*?GIVEN\*?\*?\s+(.+)/i);
      if (givenMatch) {
        given.push(givenMatch[1].trim());
        continue;
      }

      // WHEN 파싱
      const whenMatch = trimmed.match(/[-*]\s*\*?\*?WHEN\*?\*?\s+(.+)/i);
      if (whenMatch) {
        when = whenMatch[1].trim();
        continue;
      }

      // THEN 파싱
      const thenMatch = trimmed.match(/[-*]\s*\*?\*?THEN\*?\*?\s+(.+)/i);
      if (thenMatch) {
        then.push(thenMatch[1].trim());
      }
    }

    if (given.length > 0 && when && then.length > 0) {
      scenarios.push({ name, given, when, then });
    }
  }

  return scenarios;
}

/**
 * 스펙 파일 검증만 수행 (파싱 + 검증)
 */
export function validateSpecFormat(content: string): Result<true, ValidationError> {
  const result = parseSpec(content);
  if (!result.success) {
    return result as Result<true, ValidationError>;
  }

  const spec = result.data;

  // 요구사항 필수 검증
  if (spec.requirements.length === 0) {
    return failure(
      new ValidationError(
        ErrorCode.RFC2119_VIOLATION,
        'RFC 2119 키워드(SHALL, MUST, SHOULD, MAY)가 포함된 요구사항이 없습니다'
      )
    );
  }

  // 시나리오 필수 검증
  if (spec.scenarios.length === 0) {
    return failure(
      new ValidationError(
        ErrorCode.GWT_INVALID_FORMAT,
        'GIVEN-WHEN-THEN 형식의 시나리오가 없습니다'
      )
    );
  }

  return success(true);
}
