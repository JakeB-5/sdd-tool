/**
 * 도메인 파서 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  parseDomainYaml,
  stringifyDomainConfig,
  addDomain,
  removeDomain,
  addSpecToDomain,
  removeSpecFromDomain,
  addDomainDependency,
  removeDomainDependency,
  getDomainIds,
  findDomainById,
  formatDomainErrors,
} from '../../../../src/core/domain/parser.js';
import { createEmptyDomainsConfig } from '../../../../src/schemas/domains.schema.js';

describe('DomainParser', () => {
  describe('parseDomainYaml', () => {
    it('유효한 YAML을 파싱해야 함', () => {
      const yaml = `
version: "1.0"
domains:
  core:
    description: "핵심 기능"
    path: "src/core"
  auth:
    description: "인증"
    dependencies:
      uses: [core]
`;

      const result = parseDomainYaml(yaml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.version).toBe('1.0');
        expect(result.data.domains).toHaveLength(2);
      }
    });

    it('빈 내용에 대해 빈 설정을 반환해야 함', () => {
      const result = parseDomainYaml('');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.config.domains)).toHaveLength(0);
      }
    });

    it('잘못된 YAML에 대해 에러를 반환해야 함', () => {
      const yaml = `
domains:
  core:
    - invalid: yaml: structure
`;

      const result = parseDomainYaml(yaml);

      expect(result.success).toBe(false);
    });

    it('스키마 검증 실패 시 에러를 반환해야 함', () => {
      const yaml = `
version: "1.0"
domains:
  core:
    description: ""
`;

      const result = parseDomainYaml(yaml);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error[0].code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('stringifyDomainConfig', () => {
    it('설정을 YAML 문자열로 변환해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          core: {
            description: '핵심',
            path: 'src/core',
            specs: ['spec1'],
            dependencies: { uses: ['base'], extends: [], implements: [] },
          },
        },
        rules: [],
      };

      const yaml = stringifyDomainConfig(config);

      expect(yaml).toContain('version: "1.0"');
      expect(yaml).toContain('core:');
      expect(yaml).toContain('description: 핵심');
    });

    it('빈 의존성은 출력하지 않아야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          core: {
            description: '핵심',
            specs: [],
            dependencies: { uses: [], extends: [], implements: [] },
          },
        },
        rules: [],
      };

      const yaml = stringifyDomainConfig(config);

      // 빈 배열들은 출력되지 않음
      expect(yaml).not.toContain('uses: []');
    });
  });

  describe('addDomain', () => {
    it('새 도메인을 추가해야 함', () => {
      const config = createEmptyDomainsConfig();

      const result = addDomain(config, 'auth', {
        description: '인증 도메인',
        path: 'src/auth',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth']).toBeDefined();
        expect(result.data.domains['auth'].description).toBe('인증 도메인');
      }
    });

    it('이미 존재하는 도메인 추가 시 실패해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          auth: { description: '기존', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = addDomain(config, 'auth', { description: '새것' });

      expect(result.success).toBe(false);
    });
  });

  describe('removeDomain', () => {
    it('도메인을 삭제해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          core: { description: '핵심', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
          auth: { description: '인증', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = removeDomain(config, 'auth');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth']).toBeUndefined();
        expect(result.data.domains['core']).toBeDefined();
      }
    });

    it('존재하지 않는 도메인 삭제 시 실패해야 함', () => {
      const config = createEmptyDomainsConfig();

      const result = removeDomain(config, 'nonexistent');

      expect(result.success).toBe(false);
    });
  });

  describe('addSpecToDomain', () => {
    it('스펙을 도메인에 추가해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          auth: { description: '인증', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = addSpecToDomain(config, 'auth', 'user-login');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth'].specs).toContain('user-login');
      }
    });

    it('이미 존재하는 스펙은 중복 추가하지 않아야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          auth: { description: '인증', specs: ['user-login'], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = addSpecToDomain(config, 'auth', 'user-login');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth'].specs?.filter((s) => s === 'user-login')).toHaveLength(1);
      }
    });
  });

  describe('removeSpecFromDomain', () => {
    it('스펙을 도메인에서 제거해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          auth: { description: '인증', specs: ['user-login', 'oauth'], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = removeSpecFromDomain(config, 'auth', 'user-login');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth'].specs).not.toContain('user-login');
        expect(result.data.domains['auth'].specs).toContain('oauth');
      }
    });
  });

  describe('addDomainDependency', () => {
    it('의존성을 추가해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          core: { description: '핵심', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
          auth: { description: '인증', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = addDomainDependency(config, 'auth', 'core', 'uses');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth'].dependencies?.uses).toContain('core');
      }
    });
  });

  describe('removeDomainDependency', () => {
    it('의존성을 제거해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          core: { description: '핵심', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
          auth: { description: '인증', specs: [], dependencies: { uses: ['core'], extends: [], implements: [] } },
        },
        rules: [],
      };

      const result = removeDomainDependency(config, 'auth', 'core', 'uses');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains['auth'].dependencies?.uses).not.toContain('core');
      }
    });
  });

  describe('getDomainIds', () => {
    it('모든 도메인 ID를 반환해야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          core: { description: '핵심', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
          auth: { description: '인증', specs: [], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const ids = getDomainIds(config);

      expect(ids).toContain('core');
      expect(ids).toContain('auth');
    });
  });

  describe('findDomainById', () => {
    it('도메인을 ID로 찾아야 함', () => {
      const config = {
        version: '1.0',
        domains: {
          auth: { description: '인증', specs: ['login'], dependencies: { uses: [], extends: [], implements: [] } },
        },
        rules: [],
      };

      const domain = findDomainById(config, 'auth');

      expect(domain).toBeDefined();
      expect(domain?.id).toBe('auth');
      expect(domain?.specs).toContain('login');
    });

    it('존재하지 않는 도메인은 undefined를 반환해야 함', () => {
      const config = createEmptyDomainsConfig();

      const domain = findDomainById(config, 'nonexistent');

      expect(domain).toBeUndefined();
    });
  });

  describe('formatDomainErrors', () => {
    it('에러를 포맷팅해야 함', () => {
      const errors = [
        { code: 'ERROR1', message: '에러 메시지 1', path: ['domains', 'auth'] },
        { code: 'ERROR2', message: '에러 메시지 2', line: 10 },
      ];

      const formatted = formatDomainErrors(errors);

      expect(formatted).toContain('[ERROR1]');
      expect(formatted).toContain('에러 메시지 1');
      expect(formatted).toContain('domains.auth');
      expect(formatted).toContain('라인: 10');
    });
  });
});
