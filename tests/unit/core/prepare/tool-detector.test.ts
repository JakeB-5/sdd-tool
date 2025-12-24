/**
 * 도구 감지기 테스트
 */
import { describe, it, expect } from 'vitest';
import { ToolDetector } from '../../../../src/core/prepare/tool-detector.js';
import { DetectionSource } from '../../../../src/core/prepare/schemas.js';

describe('ToolDetector', () => {
  describe('detectFromSources', () => {
    it('테스트 키워드에서 test-runner 에이전트와 test 스킬을 감지한다', () => {
      const detector = new ToolDetector();
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: '단위 테스트 작성', keyword: 'test' },
      ];

      const result = detector.detectFromSources(sources);

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe('test-runner');
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('test');
    });

    it('API 키워드에서 api-scaffold 에이전트와 gen-api 스킬을 감지한다', () => {
      const detector = new ToolDetector();
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: 'REST API 구현', keyword: 'api' },
      ];

      const result = detector.detectFromSources(sources);

      expect(result.agents.find(a => a.name === 'api-scaffold')).toBeDefined();
      expect(result.skills.find(s => s.name === 'gen-api')).toBeDefined();
    });

    it('여러 키워드에서 중복 없이 도구를 감지한다', () => {
      const detector = new ToolDetector();
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: '테스트 작성', keyword: 'test' },
        { file: 'tasks.md', line: 2, text: '단위 테스트', keyword: 'test' },
        { file: 'plan.md', line: 5, text: 'Jest 설정', keyword: 'test' },
      ];

      const result = detector.detectFromSources(sources);

      // 같은 도구는 하나만 있어야 함
      const testRunners = result.agents.filter(a => a.name === 'test-runner');
      expect(testRunners).toHaveLength(1);
      // 하지만 sources는 모두 포함
      expect(testRunners[0].sources).toHaveLength(3);
    });

    it('에이전트가 없는 도구도 스킬은 감지한다', () => {
      const detector = new ToolDetector();
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: '데이터베이스 마이그레이션', keyword: 'database' },
      ];

      const result = detector.detectFromSources(sources);

      // db-migrate 스킬은 있지만 에이전트는 없음
      expect(result.skills.find(s => s.name === 'db-migrate')).toBeDefined();
      expect(result.agents.find(a => a.name === 'db-migrator')).toBeUndefined();
    });

    it('알 수 없는 키워드는 무시한다', () => {
      const detector = new ToolDetector();
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: '알 수 없는 작업', keyword: 'unknown' },
      ];

      const result = detector.detectFromSources(sources);

      expect(result.agents).toHaveLength(0);
      expect(result.skills).toHaveLength(0);
    });
  });

  describe('summarize', () => {
    it('감지 결과를 마크다운으로 요약한다', () => {
      const detector = new ToolDetector();
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: '테스트 작성', keyword: 'test' },
        { file: 'tasks.md', line: 2, text: 'API 구현', keyword: 'api' },
      ];

      const result = detector.detectFromSources(sources);
      const summary = ToolDetector.summarize(result);

      expect(summary).toContain('## 감지된 도구');
      expect(summary).toContain('서브에이전트');
      expect(summary).toContain('스킬');
      expect(summary).toContain('test-runner');
      expect(summary).toContain('gen-api');
    });

    it('빈 결과도 처리한다', () => {
      const result = {
        agents: [],
        skills: [],
        totalSources: 0,
      };

      const summary = ToolDetector.summarize(result);

      expect(summary).toContain('## 감지된 도구');
      // 에이전트와 스킬 섹션이 없어야 함
      expect(summary).not.toContain('| test-runner');
    });
  });

  describe('custom mappings', () => {
    it('커스텀 매핑을 사용할 수 있다', () => {
      const customMappings = [
        {
          keywords: ['custom', '커스텀'],
          agent: 'custom-agent',
          skill: 'custom-skill',
          agentDescription: '커스텀 에이전트',
          skillDescription: '커스텀 스킬',
        },
      ];

      const detector = new ToolDetector(customMappings);
      const sources: DetectionSource[] = [
        { file: 'tasks.md', line: 1, text: '커스텀 작업', keyword: 'custom' },
      ];

      const result = detector.detectFromSources(sources);

      expect(result.agents[0].name).toBe('custom-agent');
      expect(result.skills[0].name).toBe('custom-skill');
    });
  });
});
