/**
 * domain-generator 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import {
  generateDomainsFromSuggestions,
  generateDomainsFromSpecs,
  formatDomainGenerationResult,
  type DomainGenerationResult,
} from '../../../../src/core/reverse/domain-generator.js';
import type { SuggestedDomain } from '../../../../src/core/reverse/scan-formatter.js';
import type { FinalizedSpec } from '../../../../src/core/reverse/finalizer.js';
import type { ExtractedSpec } from '../../../../src/core/reverse/spec-generator.js';

describe('domain-generator', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-domain-gen-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('generateDomainsFromSuggestions', () => {
    it('제안된 도메인에서 도메인을 생성한다', async () => {
      const suggestions: SuggestedDomain[] = [
        {
          name: 'auth',
          description: '인증 도메인',
          path: 'src/auth',
          confidence: 0.85,
          files: ['src/auth/login.ts', 'src/auth/logout.ts'],
        },
        {
          name: 'core',
          description: '핵심 도메인',
          path: 'src/core',
          confidence: 0.90,
          files: ['src/core/utils.ts'],
        },
      ];

      const result = await generateDomainsFromSuggestions(tempDir, suggestions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created.length).toBe(2);
        expect(result.data.created.map(d => d.id)).toContain('auth');
        expect(result.data.created.map(d => d.id)).toContain('core');
      }
    });

    it('낮은 신뢰도 도메인을 건너뛴다', async () => {
      const suggestions: SuggestedDomain[] = [
        {
          name: 'auth',
          description: '인증 도메인',
          path: 'src/auth',
          confidence: 0.85,
          files: ['src/auth/login.ts'],
        },
        {
          name: 'unknown',
          description: '알 수 없는 도메인',
          path: 'src/unknown',
          confidence: 0.3, // 낮은 신뢰도
          files: [],
        },
      ];

      const result = await generateDomainsFromSuggestions(tempDir, suggestions, {
        minConfidence: 0.5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created.length).toBe(1);
        expect(result.data.created[0].id).toBe('auth');
      }
    });

    it('비어있는 도메인을 건너뛴다', async () => {
      const suggestions: SuggestedDomain[] = [
        {
          name: 'empty',
          description: '빈 도메인',
          path: 'src/empty',
          confidence: 0.8,
          files: [], // 파일 없음
        },
      ];

      const result = await generateDomainsFromSuggestions(tempDir, suggestions, {
        includeEmpty: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created.length).toBe(0);
        expect(result.data.skipped.length).toBe(1);
        expect(result.data.skipped[0].reason).toContain('스펙이 없는');
      }
    });

    it('includeEmpty 옵션으로 빈 도메인도 생성한다', async () => {
      const suggestions: SuggestedDomain[] = [
        {
          name: 'empty',
          description: '빈 도메인',
          path: 'src/empty',
          confidence: 0.8,
          files: [],
        },
      ];

      const result = await generateDomainsFromSuggestions(tempDir, suggestions, {
        includeEmpty: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created.length).toBe(1);
      }
    });
  });

  describe('generateDomainsFromSpecs', () => {
    const createMockFinalizedSpec = (
      id: string,
      domain: string
    ): FinalizedSpec => ({
      id,
      domain,
      specPath: `.sdd/specs/${domain}/${id.split('/')[1]}.md`,
      original: {
        id,
        name: id.split('/')[1],
        domain,
        description: 'Test spec',
        sourceSymbols: [],
        confidence: { score: 0.8, grade: 'B', factors: {} as any, suggestions: [] },
        scenarios: [],
        contracts: [],
        relatedSpecs: [],
        metadata: {
          version: '1.0.0',
          extractedAt: new Date(),
          sourceFiles: [],
        },
      } as ExtractedSpec,
      finalizedAt: new Date(),
    });

    it('확정된 스펙에서 도메인을 생성한다', async () => {
      const specs: FinalizedSpec[] = [
        createMockFinalizedSpec('auth/login', 'auth'),
        createMockFinalizedSpec('auth/logout', 'auth'),
        createMockFinalizedSpec('core/utils', 'core'),
      ];

      const result = await generateDomainsFromSpecs(tempDir, specs);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created.length).toBe(2);
        expect(result.data.created.find(d => d.id === 'auth')?.specCount).toBe(2);
        expect(result.data.created.find(d => d.id === 'core')?.specCount).toBe(1);
      }
    });
  });

  describe('formatDomainGenerationResult', () => {
    it('결과를 포맷팅한다', () => {
      const result: DomainGenerationResult = {
        created: [
          {
            id: 'auth',
            description: '인증 도메인',
            path: 'src/auth',
            specCount: 3,
            dependencies: ['core'],
          },
        ],
        updated: ['core'],
        skipped: [{ domain: 'empty', reason: '비어있음' }],
        errors: [],
      };

      const formatted = formatDomainGenerationResult(result);

      expect(formatted).toContain('도메인 생성 결과');
      expect(formatted).toContain('auth');
      expect(formatted).toContain('1개 도메인 생성');
      expect(formatted).toContain('1개 도메인 업데이트');
    });
  });
});
