/**
 * 스펙 파서 - 스펙 파일을 구조화된 데이터로 변환
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ParsedSpec, ParsedRequirement, ParsedScenario } from './schemas.js';
import { listSpecs, resolveSpec, type SpecLocation } from '../spec/locator.js';
import { normalizeSpecStatus } from '../spec/status.js';
import { toVersionString } from '../spec/schemas.js';
import { readFrontmatter } from '../../utils/frontmatter.js';

/**
 * YAML frontmatter 파싱
 */
function optionalString(value: unknown): string | undefined {
  return value === undefined || value === null ? undefined : String(value);
}

/**
 * RFC 2119 키워드 추출
 */
function extractKeyword(text: string): string | undefined {
  const match = text.match(/\((SHALL NOT|SHALL|MUST NOT|MUST|SHOULD NOT|SHOULD|MAY|REQUIRED|RECOMMENDED|OPTIONAL)\)/i);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * 키워드 기반 우선순위 결정
 */
function getPriority(keyword?: string): 'high' | 'medium' | 'low' | undefined {
  if (!keyword) return undefined;
  const upper = keyword.toUpperCase();
  if (['SHALL', 'MUST', 'REQUIRED', 'SHALL NOT', 'MUST NOT'].includes(upper)) return 'high';
  if (['SHOULD', 'RECOMMENDED', 'SHOULD NOT'].includes(upper)) return 'medium';
  if (['MAY', 'OPTIONAL'].includes(upper)) return 'low';
  return undefined;
}

/**
 * 요구사항 파싱
 */
function parseRequirements(content: string): ParsedRequirement[] {
  const requirements: ParsedRequirement[] = [];
  const lines = content.split('\n');

  let currentReq: Partial<ParsedRequirement> | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const reqMatch = line.match(/^#{2,3}\s+(REQ-\d+):?\s*(.*)$/);

    if (reqMatch) {
      // 이전 요구사항 저장
      if (currentReq && currentReq.id) {
        const description = currentContent.join('\n').trim();
        const keyword = extractKeyword(description);
        requirements.push({
          id: currentReq.id,
          title: currentReq.title || '',
          description: description.replace(/\([A-Z\s]+\)/g, '').trim(),
          keyword,
          priority: getPriority(keyword),
        });
      }

      // 새 요구사항 시작
      currentReq = {
        id: reqMatch[1],
        title: reqMatch[2] || '',
      };
      currentContent = [];
    } else if (currentReq) {
      // 다음 헤더면 종료
      if (line.match(/^#{1,3}\s+/) && !line.match(/^#{2,3}\s+REQ-\d+/)) {
        const description = currentContent.join('\n').trim();
        const keyword = extractKeyword(description);
        requirements.push({
          id: currentReq.id!,
          title: currentReq.title || '',
          description: description.replace(/\([A-Z\s]+\)/g, '').trim(),
          keyword,
          priority: getPriority(keyword),
        });
        currentReq = null;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
  }

  // 마지막 요구사항 저장
  if (currentReq && currentReq.id) {
    const description = currentContent.join('\n').trim();
    const keyword = extractKeyword(description);
    requirements.push({
      id: currentReq.id,
      title: currentReq.title || '',
      description: description.replace(/\([A-Z\s]+\)/g, '').trim(),
      keyword,
      priority: getPriority(keyword),
    });
  }

  return requirements;
}

/**
 * 시나리오 파싱
 */
function parseScenarios(content: string): ParsedScenario[] {
  const scenarios: ParsedScenario[] = [];
  const lines = content.split('\n');

  let currentScenario: Partial<ParsedScenario> | null = null;
  let scenarioIndex = 0;

  for (const line of lines) {
    const scenarioMatch = line.match(/^#{2,3}\s+Scenario\s*(\d*):?\s*(.*)$/i);

    if (scenarioMatch) {
      // 이전 시나리오 저장
      if (currentScenario && currentScenario.id) {
        scenarios.push({
          id: currentScenario.id,
          title: currentScenario.title || '',
          given: currentScenario.given || [],
          when: currentScenario.when || [],
          then: currentScenario.then || [],
          and: currentScenario.and,
        });
      }

      // 새 시나리오 시작
      scenarioIndex++;
      currentScenario = {
        id: `scenario-${scenarioMatch[1] || scenarioIndex}`,
        title: scenarioMatch[2] || `Scenario ${scenarioIndex}`,
        given: [],
        when: [],
        then: [],
        and: [],
      };
    } else if (currentScenario) {
      // GIVEN/WHEN/THEN 파싱
      const gwtMatch = line.match(/[-*]\s*\*\*(GIVEN|WHEN|THEN|AND)\*\*\s*(.+)/i);
      if (gwtMatch) {
        const type = gwtMatch[1].toUpperCase();
        const text = gwtMatch[2].trim();

        if (type === 'GIVEN') currentScenario.given?.push(text);
        else if (type === 'WHEN') currentScenario.when?.push(text);
        else if (type === 'THEN') currentScenario.then?.push(text);
        else if (type === 'AND') currentScenario.and?.push(text);
      }

      // 다음 헤더면 종료
      if (line.match(/^#{1,3}\s+/) && !line.match(/Scenario/i)) {
        scenarios.push({
          id: currentScenario.id!,
          title: currentScenario.title || '',
          given: currentScenario.given || [],
          when: currentScenario.when || [],
          then: currentScenario.then || [],
          and: currentScenario.and,
        });
        currentScenario = null;
      }
    }
  }

  // 마지막 시나리오 저장
  if (currentScenario && currentScenario.id) {
    scenarios.push({
      id: currentScenario.id,
      title: currentScenario.title || '',
      given: currentScenario.given || [],
      when: currentScenario.when || [],
      then: currentScenario.then || [],
      and: currentScenario.and,
    });
  }

  return scenarios;
}

/**
 * 의존성 추출
 */
function parseDependencies(metadata: Record<string, unknown>): string[] {
  const deps = metadata.dependencies;
  if (Array.isArray(deps)) return deps.map(String);
  if (typeof deps === 'string') return deps.split(',').map(s => s.trim());
  return [];
}

/**
 * 제목 추출 (첫 번째 # 헤더)
 */
function parseTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * 설명 추출 (제목 다음 > 블록인용)
 */
function parseDescription(content: string): string {
  const match = content.match(/^>\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * 단일 스펙 파일 파싱
 */
export async function parseSpecFile(filePath: string, specId: string): Promise<ParsedSpec> {
  const content = await fs.readFile(filePath, 'utf-8');
  // YAML frontmatter + body (line endings normalized to LF)
  const { data: metadata, body: rawBody } = readFrontmatter(content);
  const body = rawBody.replace(/^\n/, '');

  return {
    id: optionalString(metadata.id) || specId,
    title: optionalString(metadata.title) || parseTitle(body) || specId,
    status: normalizeSpecStatus(metadata.status) ?? optionalString(metadata.status),
    version: optionalString(toVersionString(metadata.version)),
    created: optionalString(metadata.created),
    author: optionalString(metadata.author),
    description: parseDescription(body),
    requirements: parseRequirements(body),
    scenarios: parseScenarios(body),
    dependencies: parseDependencies(metadata),
    metadata,
    rawContent: body,
  };
}

/**
 * 프로젝트의 모든 스펙 파싱
 */
export async function parseAllSpecs(projectRoot: string): Promise<ParsedSpec[]> {
  const locations = await listSpecs(path.join(projectRoot, '.sdd'));
  const specs: ParsedSpec[] = [];

  for (const location of locations) {
    const spec = await parseLocation(location);
    if (spec) {
      specs.push(spec);
    }
  }

  return specs;
}

/**
 * 특정 스펙 참조(<domain>/<feature>, bare feature, 레거시 id)로 스펙 파싱
 */
export async function parseSpecById(projectRoot: string, specId: string): Promise<ParsedSpec | null> {
  const resolved = await resolveSpec(path.join(projectRoot, '.sdd'), specId);
  if (!resolved.success) {
    return null;
  }
  return parseLocation(resolved.data);
}

/**
 * 위치 기반 파싱 - id는 항상 canonical id (도메인 간 충돌 방지)
 */
async function parseLocation(location: SpecLocation): Promise<ParsedSpec | null> {
  try {
    const spec = await parseSpecFile(location.specPath, location.id);
    return { ...spec, id: location.id };
  } catch {
    // 파싱 실패한 스펙은 건너뜀
    return null;
  }
}
