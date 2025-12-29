/**
 * domains.yml 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  DomainsConfigSchema,
  DomainIdSchema,
  DomainDefinitionSchema,
  DomainDependenciesSchema,
  DomainRuleSchema,
  toDomainInfoList,
  isValidDomainId,
  uniqueDomainIds,
  createEmptyDomainsConfig,
  createDefaultDomainsConfig,
} from '../../../src/schemas/domains.schema.js';

describe('DomainsSchema', () => {
  describe('DomainIdSchema', () => {
    it('유효한 도메인 ID를 허용해야 함', () => {
      expect(() => DomainIdSchema.parse('core')).not.toThrow();
      expect(() => DomainIdSchema.parse('auth')).not.toThrow();
      expect(() => DomainIdSchema.parse('my-domain')).not.toThrow();
      expect(() => DomainIdSchema.parse('domain123')).not.toThrow();
    });

    it('대문자로 시작하는 ID를 거부해야 함', () => {
      expect(() => DomainIdSchema.parse('Core')).toThrow();
      expect(() => DomainIdSchema.parse('AUTH')).toThrow();
    });

    it('숫자로 시작하는 ID를 거부해야 함', () => {
      expect(() => DomainIdSchema.parse('123domain')).toThrow();
    });

    it('특수문자가 포함된 ID를 거부해야 함', () => {
      expect(() => DomainIdSchema.parse('my_domain')).toThrow();
      expect(() => DomainIdSchema.parse('my.domain')).toThrow();
    });
  });

  describe('DomainDefinitionSchema', () => {
    it('필수 필드만 있는 도메인을 허용해야 함', () => {
      const result = DomainDefinitionSchema.parse({
        description: '테스트 도메인',
      });

      expect(result.description).toBe('테스트 도메인');
      expect(result.specs).toEqual([]);
    });

    it('모든 필드가 있는 도메인을 허용해야 함', () => {
      const result = DomainDefinitionSchema.parse({
        description: '인증/인가',
        path: 'src/auth',
        specs: ['user-login', 'oauth-google'],
        dependencies: {
          uses: ['core'],
          extends: [],
          implements: [],
        },
        owner: '@security-team',
        tags: ['security', 'auth'],
      });

      expect(result.description).toBe('인증/인가');
      expect(result.path).toBe('src/auth');
      expect(result.specs).toEqual(['user-login', 'oauth-google']);
      expect(result.dependencies?.uses).toEqual(['core']);
    });

    it('빈 설명은 거부해야 함', () => {
      expect(() =>
        DomainDefinitionSchema.parse({
          description: '',
        })
      ).toThrow();
    });
  });

  describe('DomainDependenciesSchema', () => {
    it('빈 의존성을 허용해야 함', () => {
      const result = DomainDependenciesSchema.parse({});
      expect(result.uses).toEqual([]);
      expect(result.extends).toEqual([]);
      expect(result.implements).toEqual([]);
    });

    it('의존성 배열을 파싱해야 함', () => {
      const result = DomainDependenciesSchema.parse({
        uses: ['core', 'auth'],
        extends: ['base'],
      });

      expect(result.uses).toEqual(['core', 'auth']);
      expect(result.extends).toEqual(['base']);
      expect(result.implements).toEqual([]);
    });
  });

  describe('DomainRuleSchema', () => {
    it('유효한 규칙을 파싱해야 함', () => {
      const result = DomainRuleSchema.parse({
        from: 'order',
        to: 'auth',
        type: 'uses',
        allowed: true,
        reason: '주문 시 인증 필요',
      });

      expect(result.from).toBe('order');
      expect(result.to).toBe('auth');
      expect(result.type).toBe('uses');
      expect(result.allowed).toBe(true);
    });

    it('필수 필드가 없으면 거부해야 함', () => {
      expect(() =>
        DomainRuleSchema.parse({
          from: 'order',
          to: 'auth',
        })
      ).toThrow();
    });
  });

  describe('DomainsConfigSchema', () => {
    it('유효한 설정을 파싱해야 함', () => {
      const result = DomainsConfigSchema.parse({
        version: '1.0',
        domains: {
          core: {
            description: '핵심 기능',
          },
          auth: {
            description: '인증',
            dependencies: {
              uses: ['core'],
            },
          },
        },
      });

      expect(result.version).toBe('1.0');
      expect(Object.keys(result.domains)).toEqual(['core', 'auth']);
    });

    it('규칙을 포함한 설정을 파싱해야 함', () => {
      const result = DomainsConfigSchema.parse({
        version: '1.0',
        domains: {
          core: { description: '핵심' },
        },
        rules: [
          {
            from: 'order',
            to: 'core',
            type: 'uses',
            allowed: true,
          },
        ],
      });

      expect(result.rules).toHaveLength(1);
    });
  });

  describe('toDomainInfoList', () => {
    it('설정을 DomainInfo 목록으로 변환해야 함', () => {
      const config = DomainsConfigSchema.parse({
        version: '1.0',
        domains: {
          core: {
            description: '핵심',
            path: 'src/core',
          },
          auth: {
            description: '인증',
            dependencies: { uses: ['core'] },
          },
        },
      });

      const infos = toDomainInfoList(config);

      expect(infos).toHaveLength(2);
      expect(infos[0].id).toBe('core');
      expect(infos[1].id).toBe('auth');
      expect(infos[1].dependsOn).toContain('core');
    });
  });

  describe('isValidDomainId', () => {
    it('유효한 ID에 대해 true를 반환해야 함', () => {
      expect(isValidDomainId('core')).toBe(true);
      expect(isValidDomainId('my-domain')).toBe(true);
    });

    it('유효하지 않은 ID에 대해 false를 반환해야 함', () => {
      expect(isValidDomainId('Core')).toBe(false);
      expect(isValidDomainId('123')).toBe(false);
    });
  });

  describe('uniqueDomainIds', () => {
    it('중복을 제거해야 함', () => {
      const result = uniqueDomainIds(['core', 'auth', 'core', 'auth']);
      expect(result).toEqual(['core', 'auth']);
    });
  });

  describe('createEmptyDomainsConfig', () => {
    it('빈 설정을 생성해야 함', () => {
      const config = createEmptyDomainsConfig();
      expect(config.version).toBe('1.0');
      expect(Object.keys(config.domains)).toHaveLength(0);
    });
  });

  describe('createDefaultDomainsConfig', () => {
    it('기본 core 도메인이 포함된 설정을 생성해야 함', () => {
      const config = createDefaultDomainsConfig();
      expect(config.domains['core']).toBeDefined();
      expect(config.domains['core'].description).toBe('핵심 공통 기능');
    });
  });
});
