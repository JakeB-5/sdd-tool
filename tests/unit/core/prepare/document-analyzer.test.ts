/**
 * 문서 분석기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DocumentAnalyzer } from '../../../../src/core/prepare/document-analyzer.js';

describe('DocumentAnalyzer', () => {
  let tempDir: string;
  let sddDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-doc-analyzer-'));
    sddDir = path.join(tempDir, '.sdd');
    specsDir = path.join(sddDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('analyzeFeature', () => {
    it('존재하지 않는 기능에 대해 에러를 던진다', async () => {
      const analyzer = new DocumentAnalyzer(tempDir);

      await expect(analyzer.analyzeFeature('non-existent')).rejects.toThrow(
        /기능 디렉토리를 찾을 수 없습니다/
      );
    });

    it('tasks.md를 분석한다', async () => {
      const featureDir = path.join(specsDir, 'my-feature');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'tasks.md'),
        `# Tasks

- [ ] 테스트 작성: UserService 단위 테스트
- [ ] 구현: REST API 엔드포인트
- [ ] 문서 작성
`
      );

      const analyzer = new DocumentAnalyzer(tempDir);
      const results = await analyzer.analyzeFeature('my-feature');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('tasks');
      expect(results[0].taskCount).toBe(3);
      expect(results[0].lines.length).toBeGreaterThan(0);
    });

    it('여러 문서를 분석한다', async () => {
      const featureDir = path.join(specsDir, 'full-feature');
      await fs.mkdir(featureDir);

      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `---
id: full-feature
status: draft
---

# Full Feature

시스템은 API를 제공해야 한다(SHALL).
테스트가 필요하다.
`
      );

      await fs.writeFile(
        path.join(featureDir, 'plan.md'),
        `# Plan

## 기술 스택

- React
- TypeScript
- Jest
`
      );

      await fs.writeFile(
        path.join(featureDir, 'tasks.md'),
        `# Tasks

- [ ] 컴포넌트 생성
- [ ] 테스트 작성
`
      );

      const analyzer = new DocumentAnalyzer(tempDir);
      const results = await analyzer.analyzeFeature('full-feature');

      expect(results).toHaveLength(3);
      expect(results.map(r => r.type)).toEqual(['tasks', 'plan', 'spec']);
    });

    it('키워드를 올바르게 추출한다', async () => {
      const featureDir = path.join(specsDir, 'keyword-test');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'tasks.md'),
        `# Tasks

- [ ] API 엔드포인트 구현
- [ ] 단위 테스트 작성
- [ ] 컴포넌트 생성
- [ ] 데이터베이스 마이그레이션
- [ ] 문서 업데이트
- [ ] 코드 리뷰
`
      );

      const analyzer = new DocumentAnalyzer(tempDir);
      const results = await analyzer.analyzeFeature('keyword-test');

      const allKeywords = results.flatMap(r => r.lines.flatMap(l => l.keywords));
      expect(allKeywords).toContain('api');
      expect(allKeywords).toContain('test');
      expect(allKeywords).toContain('component');
      expect(allKeywords).toContain('database');
      expect(allKeywords).toContain('doc');
      expect(allKeywords).toContain('review');
    });
  });

  describe('toDetectionSources', () => {
    it('분석 결과를 DetectionSource 배열로 변환한다', async () => {
      const featureDir = path.join(specsDir, 'source-test');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'tasks.md'),
        `# Tasks

- [ ] 테스트 작성
`
      );

      const analyzer = new DocumentAnalyzer(tempDir);
      const results = await analyzer.analyzeFeature('source-test');
      const sources = DocumentAnalyzer.toDetectionSources(results);

      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveProperty('file');
      expect(sources[0]).toHaveProperty('line');
      expect(sources[0]).toHaveProperty('text');
      expect(sources[0]).toHaveProperty('keyword');
    });
  });

  describe('getTotalTaskCount', () => {
    it('전체 태스크 수를 계산한다', async () => {
      const featureDir = path.join(specsDir, 'count-test');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'tasks.md'),
        `# Tasks

- [ ] 작업 1
- [x] 작업 2
- [ ] 작업 3
`
      );

      const analyzer = new DocumentAnalyzer(tempDir);
      const results = await analyzer.analyzeFeature('count-test');
      const count = DocumentAnalyzer.getTotalTaskCount(results);

      expect(count).toBe(3);
    });
  });
});
