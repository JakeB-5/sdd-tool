/**
 * JSON 내보내기
 */
import type { ExportAppendix, ParsedSpec } from './schemas.js';

interface JsonExportOptions {
  pretty?: boolean;
  includeRawContent?: boolean;
  /** Appendix documents (constitution, change proposals) to include */
  appendices?: ExportAppendix[];
}

/**
 * 스펙을 JSON 형식으로 변환
 *
 * Output shape is always `{ "specs": [...] }` (regardless of how many specs are
 * exported), plus `constitution` / `changes` when those appendices are included.
 */
export function generateJson(specs: ParsedSpec[], options: JsonExportOptions = {}): string {
  const { pretty = true, includeRawContent = false, appendices = [] } = options;

  const exportData = specs.map(spec => {
    const result: Record<string, unknown> = {
      id: spec.id,
      title: spec.title,
      status: spec.status,
      version: spec.version,
      created: spec.created,
      author: spec.author,
      description: spec.description,
      requirements: spec.requirements.map(req => ({
        id: req.id,
        title: req.title,
        description: req.description,
        keyword: req.keyword,
        priority: req.priority,
      })),
      scenarios: spec.scenarios.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        given: scenario.given,
        when: scenario.when,
        then: scenario.then,
        and: scenario.and?.length ? scenario.and : undefined,
      })),
      dependencies: spec.dependencies,
      metadata: spec.metadata,
    };

    if (includeRawContent) {
      result.rawContent = spec.rawContent;
    }

    return result;
  });

  const output: Record<string, unknown> = { specs: exportData };

  const constitution = appendices.find((a) => a.kind === 'constitution');
  if (constitution) {
    output.constitution = { title: constitution.title, content: constitution.content };
  }
  const changes = appendices.filter((a) => a.kind === 'change');
  if (changes.length > 0) {
    output.changes = changes.map((c) => ({ id: c.id, title: c.title, content: c.content }));
  }

  return pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
}

/**
 * 스펙 요약 JSON 생성
 */
export function generateSummaryJson(specs: ParsedSpec[]): string {
  const summary = {
    totalSpecs: specs.length,
    totalRequirements: specs.reduce((sum, s) => sum + s.requirements.length, 0),
    totalScenarios: specs.reduce((sum, s) => sum + s.scenarios.length, 0),
    specs: specs.map(spec => ({
      id: spec.id,
      title: spec.title,
      status: spec.status,
      requirementCount: spec.requirements.length,
      scenarioCount: spec.scenarios.length,
      dependencies: spec.dependencies,
    })),
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(summary, null, 2);
}
