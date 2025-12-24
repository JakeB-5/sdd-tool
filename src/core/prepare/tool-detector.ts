/**
 * 도구 감지기
 * 키워드를 분석하여 필요한 서브에이전트와 스킬을 식별
 */
import {
  DetectedTool,
  DetectionSource,
  KeywordMapping,
  DEFAULT_KEYWORD_MAPPINGS,
} from './schemas.js';
import { DocumentAnalysis, DocumentAnalyzer } from './document-analyzer.js';

/**
 * 도구 감지 결과
 */
export interface ToolDetectionResult {
  agents: DetectedTool[];
  skills: DetectedTool[];
  totalSources: number;
}

/**
 * 도구 감지기 클래스
 */
export class ToolDetector {
  private mappings: KeywordMapping[];

  constructor(customMappings?: KeywordMapping[]) {
    this.mappings = customMappings ?? DEFAULT_KEYWORD_MAPPINGS;
  }

  /**
   * 문서 분석 결과에서 필요한 도구 감지
   */
  detect(analyses: DocumentAnalysis[]): ToolDetectionResult {
    const sources = DocumentAnalyzer.toDetectionSources(analyses);
    return this.detectFromSources(sources);
  }

  /**
   * DetectionSource 배열에서 도구 감지
   */
  detectFromSources(sources: DetectionSource[]): ToolDetectionResult {
    const agentMap = new Map<string, DetectedTool>();
    const skillMap = new Map<string, DetectedTool>();

    for (const source of sources) {
      const mapping = this.findMapping(source.keyword);
      if (!mapping) continue;

      // 에이전트 추가
      if (mapping.agent) {
        const existing = agentMap.get(mapping.agent);
        if (existing) {
          existing.sources.push(source);
        } else {
          agentMap.set(mapping.agent, {
            type: 'agent',
            name: mapping.agent,
            description: mapping.agentDescription ?? `${mapping.agent} 에이전트`,
            sources: [source],
          });
        }
      }

      // 스킬 추가
      const existing = skillMap.get(mapping.skill);
      if (existing) {
        existing.sources.push(source);
      } else {
        skillMap.set(mapping.skill, {
          type: 'skill',
          name: mapping.skill,
          description: mapping.skillDescription ?? `${mapping.skill} 스킬`,
          sources: [source],
        });
      }
    }

    return {
      agents: Array.from(agentMap.values()),
      skills: Array.from(skillMap.values()),
      totalSources: sources.length,
    };
  }

  /**
   * 키워드에 해당하는 매핑 찾기
   */
  private findMapping(keyword: string): KeywordMapping | undefined {
    const lowerKeyword = keyword.toLowerCase();

    for (const mapping of this.mappings) {
      for (const kw of mapping.keywords) {
        if (lowerKeyword.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lowerKeyword)) {
          return mapping;
        }
      }
    }

    return undefined;
  }

  /**
   * 감지된 도구 요약
   */
  static summarize(result: ToolDetectionResult): string {
    const lines: string[] = [];

    lines.push(`## 감지된 도구`);
    lines.push('');

    if (result.agents.length > 0) {
      lines.push(`### 서브에이전트 (${result.agents.length}개)`);
      lines.push('');
      lines.push('| 이름 | 설명 | 감지 횟수 |');
      lines.push('|------|------|-----------|');
      for (const agent of result.agents) {
        lines.push(`| ${agent.name} | ${agent.description} | ${agent.sources.length} |`);
      }
      lines.push('');
    }

    if (result.skills.length > 0) {
      lines.push(`### 스킬 (${result.skills.length}개)`);
      lines.push('');
      lines.push('| 이름 | 설명 | 감지 횟수 |');
      lines.push('|------|------|-----------|');
      for (const skill of result.skills) {
        lines.push(`| ${skill.name} | ${skill.description} | ${skill.sources.length} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
