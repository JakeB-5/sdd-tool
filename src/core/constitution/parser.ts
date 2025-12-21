/**
 * Constitution 파서
 */
import matter from 'gray-matter';
import {
  ParsedConstitution,
  ConstitutionMetadataSchema,
  Principle,
  type ConstitutionMetadata,
} from './schemas.js';
import { Result, success, failure } from '../../types/index.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';
import { extractRfc2119Keywords } from '../spec/schemas.js';

/**
 * Constitution 마크다운 파싱
 */
export function parseConstitution(content: string): Result<ParsedConstitution, ValidationError> {
  try {
    // 1. Frontmatter 파싱
    const { data: rawMeta, content: body } = matter(content);

    // 2. 메타데이터 검증
    const metaResult = ConstitutionMetadataSchema.safeParse({
      version: rawMeta.version ?? '1.0.0',
      created: rawMeta.created ? formatDate(rawMeta.created) : formatDate(new Date()),
      updated: rawMeta.updated ? formatDate(rawMeta.updated) : undefined,
    });

    if (!metaResult.success) {
      const errors = metaResult.error.errors.map((e) => e.message).join(', ');
      return failure(new ValidationError(ErrorCode.CONSTITUTION_PARSE_ERROR, `메타데이터 오류: ${errors}`));
    }
    const metadata: ConstitutionMetadata = metaResult.data;

    // 3. 프로젝트명 추출
    const projectMatch = body.match(/^#\s+Constitution:\s*(.+)$/m);
    if (!projectMatch) {
      return failure(new ValidationError(
        ErrorCode.CONSTITUTION_PARSE_ERROR,
        '프로젝트명을 찾을 수 없습니다 (# Constitution: 프로젝트명)'
      ));
    }
    const projectName = projectMatch[1].trim();

    // 4. 설명 추출
    const descMatch = body.match(/^#\s+Constitution:.+\n+>\s*(.+)$/m);
    const description = descMatch?.[1]?.trim();

    // 5. 원칙 추출
    const principles = parsePrinciples(body);

    // 6. 금지 사항 추출
    const forbidden = parseForbidden(body);

    // 7. 기술 스택 추출
    const techStack = parseTechStack(body);

    // 8. 품질 기준 추출
    const qualityStandards = parseQualityStandards(body);

    return success({
      projectName,
      metadata,
      description,
      principles,
      forbidden,
      techStack,
      qualityStandards,
      rawContent: content,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(new ValidationError(ErrorCode.CONSTITUTION_PARSE_ERROR, message));
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * 원칙 파싱
 */
function parsePrinciples(content: string): Principle[] {
  const principles: Principle[] = [];

  // ## 핵심 원칙 또는 ## 원칙 섹션 찾기
  const principlesSectionMatch = content.match(/##\s+(?:핵심\s*)?원칙([\s\S]*?)(?=\n##\s+[^#]|\n---|\n$)/i);
  if (!principlesSectionMatch) return principles;

  const section = principlesSectionMatch[1];

  // ### N. 원칙명 형태의 섹션을 분리
  const sectionParts = section.split(/(?=###\s+\d+\.)/);

  for (const part of sectionParts) {
    const headerMatch = part.match(/###\s+(\d+)\.\s*(.+)/);
    if (!headerMatch) continue;

    const id = headerMatch[1];
    const title = headerMatch[2].trim();

    // 규칙 추출 (- 로 시작하는 라인)
    const rules: string[] = [];
    const ruleRegex = /-\s+(.+)/g;
    let ruleMatch: RegExpExecArray | null;

    while ((ruleMatch = ruleRegex.exec(part)) !== null) {
      rules.push(ruleMatch[1].trim());
    }

    // 레벨 결정
    let level: 'core' | 'technical' | 'forbidden' = 'core';
    if (title.toLowerCase().includes('기술') || title.toLowerCase().includes('technical')) {
      level = 'technical';
    }

    principles.push({
      id: `P${id}`,
      title,
      description: title,
      level,
      rules,
    });
  }

  return principles;
}

/**
 * 금지 사항 파싱
 */
function parseForbidden(content: string): string[] {
  const forbidden: string[] = [];

  // ## 금지 사항 또는 ## 금지 섹션 찾기
  const forbiddenSectionMatch = content.match(/##\s+금지\s*(?:사항)?([\s\S]*?)(?=\n##|\n---|\n$)/i);
  if (!forbiddenSectionMatch) return forbidden;

  const section = forbiddenSectionMatch[1];

  // - 로 시작하는 라인 추출
  const ruleRegex = /-\s+(.+?)(?:\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(section)) !== null) {
    const rule = match[1].trim();
    // SHALL NOT 또는 MUST NOT이 포함된 규칙만
    if (/SHALL\s+NOT|MUST\s+NOT/i.test(rule)) {
      forbidden.push(rule);
    }
  }

  return forbidden;
}

/**
 * 기술 스택 파싱
 */
function parseTechStack(content: string): string[] {
  const techStack: string[] = [];

  // ## 기술 스택 섹션 찾기
  const techSectionMatch = content.match(/##\s+기술\s*스택([\s\S]*?)(?=\n##|\n---|\n$)/i);
  if (!techSectionMatch) return techStack;

  const section = techSectionMatch[1];

  // - Category: Value 형태 추출
  const techRegex = /-\s+(.+?)(?:\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = techRegex.exec(section)) !== null) {
    techStack.push(match[1].trim());
  }

  return techStack;
}

/**
 * 품질 기준 파싱
 */
function parseQualityStandards(content: string): string[] {
  const standards: string[] = [];

  // ## 품질 기준 섹션 찾기
  const qualitySectionMatch = content.match(/##\s+품질\s*기준([\s\S]*?)(?=\n##|\n---|\n$)/i);
  if (!qualitySectionMatch) return standards;

  const section = qualitySectionMatch[1];

  // - 로 시작하는 라인 추출
  const ruleRegex = /-\s+(.+?)(?:\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(section)) !== null) {
    standards.push(match[1].trim());
  }

  return standards;
}

/**
 * Constitution 검증
 */
export function validateConstitution(constitution: ParsedConstitution): Result<true, ValidationError> {
  // 최소 요구사항 검증
  if (!constitution.projectName) {
    return failure(new ValidationError(
      ErrorCode.CONSTITUTION_PARSE_ERROR,
      '프로젝트명이 없습니다'
    ));
  }

  // 원칙이 하나 이상 있어야 함
  if (constitution.principles.length === 0 && constitution.forbidden.length === 0) {
    return failure(new ValidationError(
      ErrorCode.CONSTITUTION_PARSE_ERROR,
      '원칙이나 금지 사항이 최소 하나 이상 필요합니다'
    ));
  }

  return success(true);
}
