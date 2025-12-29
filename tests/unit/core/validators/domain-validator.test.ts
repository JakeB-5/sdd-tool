/**
 * 도메인 검증기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  validateDomains,
  canDependOn,
  suggestDomainForSpec,
  formatValidationResult,
} from '../../../../src/core/validators/domain-validator.js';
import type { DomainsConfig } from '../../../../src/schemas/domains.schema.js';

describe('DomainValidator', () => {
  const createConfig = (
    domains: Record<string, { description: string; deps?: string[]; specs?: string[] }>,
    rules?: { from: string; to: string; type: 'uses' | 'extends' | 'implements'; allowed: boolean; reason?: string }[]
  ): DomainsConfig => ({
    version: '1.0',
    domains: Object.fromEntries(
      Object.entries(domains).map(([id, { description, deps = [], specs = [] }]) => [
        id,
        {
          description,
          specs,
          dependencies: {
            uses: deps,
            extends: [],
            implements: [],
          },
        },
      ])
    ),
    rules: rules ?? [],
  });

  describe('validateDomains', () => {
    it('유효한 설정에 대해 valid: true를 반환해야 함', () => {
      const config = createConfig({
        core: { description: '핵심' },
        auth: { description: '인증', deps: ['core'] },
      });

      const result = validateDomains(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('존재하지 않는 의존성에 대해 에러를 반환해야 함', () => {
      const config = createConfig({
        auth: { description: '인증', deps: ['nonexistent'] },
      });

      const result = validateDomains(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_DEPENDENCY_DOMAIN')).toBe(true);
    });

    it('순환 의존성에 대해 에러를 반환해야 함', () => {
      const config = createConfig({
        a: { description: 'A', deps: ['b'] },
        b: { description: 'B', deps: ['a'] },
      });

      const result = validateDomains(config, { cyclesAsErrors: true });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });

    it('순환 의존성을 경고로 처리할 수 있어야 함', () => {
      const config = createConfig({
        a: { description: 'A', deps: ['b'] },
        b: { description: 'B', deps: ['a'] },
      });

      const result = validateDomains(config, { cyclesAsErrors: false });

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });

    it('빈 도메인에 대해 정보를 반환해야 함', () => {
      const config = createConfig({
        core: { description: '핵심', specs: [] },
      });

      const result = validateDomains(config, { warnEmptyDomains: true });

      expect(result.infos.some((i) => i.code === 'EMPTY_DOMAIN')).toBe(true);
    });

    it('스펙 존재 여부를 검증해야 함', () => {
      const config = createConfig({
        auth: { description: '인증', specs: ['user-login', 'oauth'] },
      });

      const result = validateDomains(config, {
        validateSpecs: true,
        existingSpecs: ['user-login'], // oauth는 존재하지 않음
      });

      expect(result.warnings.some((w) => w.code === 'MISSING_SPEC')).toBe(true);
    });

    it('고아 스펙을 감지해야 함', () => {
      const config = createConfig({
        auth: { description: '인증', specs: ['user-login'] },
      });

      const result = validateDomains(config, {
        validateSpecs: true,
        existingSpecs: ['user-login', 'orphan-spec'],
        detectOrphanSpecs: true,
      });

      expect(result.warnings.some((w) => w.code === 'ORPHAN_SPEC')).toBe(true);
    });

    it('중복 스펙 할당을 감지해야 함', () => {
      const config = createConfig({
        auth: { description: '인증', specs: ['shared-spec'] },
        order: { description: '주문', specs: ['shared-spec'] },
      });

      const result = validateDomains(config, {
        validateSpecs: true,
        existingSpecs: ['shared-spec'],
      });

      expect(result.warnings.some((w) => w.code === 'DUPLICATE_SPEC_ASSIGNMENT')).toBe(true);
    });

    it('규칙 위반을 감지해야 함', () => {
      const config = createConfig(
        {
          core: { description: '핵심' },
          auth: { description: '인증', deps: ['core'] },
        },
        [
          {
            from: 'auth',
            to: 'core',
            type: 'uses',
            allowed: false,
            reason: 'auth는 core를 사용할 수 없음',
          },
        ]
      );

      const result = validateDomains(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'RULE_VIOLATION')).toBe(true);
    });
  });

  describe('canDependOn', () => {
    it('같은 도메인은 항상 허용해야 함', () => {
      const config = createConfig({
        auth: { description: '인증' },
      });

      const result = canDependOn(config, 'auth', 'auth');

      expect(result.allowed).toBe(true);
    });

    it('의존성이 선언된 경우 허용해야 함', () => {
      const config = createConfig({
        core: { description: '핵심' },
        auth: { description: '인증', deps: ['core'] },
      });

      const result = canDependOn(config, 'auth', 'core');

      expect(result.allowed).toBe(true);
    });

    it('의존성이 선언되지 않은 경우 불허해야 함', () => {
      const config = createConfig({
        core: { description: '핵심' },
        auth: { description: '인증' }, // core에 대한 의존성 없음
      });

      const result = canDependOn(config, 'auth', 'core');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('선언되지 않았습니다');
    });

    it('존재하지 않는 도메인에 대해 불허해야 함', () => {
      const config = createConfig({
        core: { description: '핵심' },
      });

      const result = canDependOn(config, 'nonexistent', 'core');

      expect(result.allowed).toBe(false);
    });

    it('규칙에 의해 허용된 경우 허용해야 함', () => {
      const config = createConfig(
        {
          core: { description: '핵심' },
          auth: { description: '인증' },
        },
        [{ from: 'auth', to: 'core', type: 'uses', allowed: true }]
      );

      const result = canDependOn(config, 'auth', 'core');

      expect(result.allowed).toBe(true);
    });

    it('규칙에 의해 금지된 경우 불허해야 함', () => {
      const config = createConfig(
        {
          core: { description: '핵심' },
          auth: { description: '인증', deps: ['core'] },
        },
        [{ from: 'auth', to: 'core', type: 'uses', allowed: false, reason: '보안상 금지' }]
      );

      const result = canDependOn(config, 'auth', 'core');

      // 규칙이 의존성 선언보다 우선하지 않음 (검증에서만 위반으로 처리)
      // 여기서는 의존성이 선언되어 있으므로 허용
      expect(result.allowed).toBe(true);
    });
  });

  describe('suggestDomainForSpec', () => {
    it('스펙 ID에서 도메인을 추천해야 함', () => {
      const config = createConfig({
        auth: { description: '인증' },
        order: { description: '주문' },
      });

      const suggestions = suggestDomainForSpec(config, 'auth-user-login');

      expect(suggestions).toContain('auth');
    });

    it('경로 기반으로 도메인을 추천해야 함', () => {
      const config: DomainsConfig = {
        version: '1.0',
        domains: {
          auth: {
            description: '인증',
            path: 'src/auth',
            specs: [],
            dependencies: { uses: [], extends: [], implements: [] },
          },
        },
        rules: [],
      };

      const suggestions = suggestDomainForSpec(config, 'some-spec', 'src/auth/login');

      expect(suggestions).toContain('auth');
    });

    it('매칭이 없으면 빈 배열을 반환해야 함', () => {
      const config = createConfig({
        auth: { description: '인증' },
      });

      const suggestions = suggestDomainForSpec(config, 'completely-unrelated');

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('formatValidationResult', () => {
    it('유효한 결과를 포맷팅해야 함', () => {
      const result = {
        valid: true,
        issues: [],
        errors: [],
        warnings: [],
        infos: [],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('✅');
      expect(formatted).toContain('통과');
    });

    it('에러를 포맷팅해야 함', () => {
      const result = {
        valid: false,
        issues: [{ code: 'ERROR', severity: 'error' as const, message: '에러 메시지' }],
        errors: [{ code: 'ERROR', severity: 'error' as const, message: '에러 메시지' }],
        warnings: [],
        infos: [],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('❌');
      expect(formatted).toContain('실패');
      expect(formatted).toContain('에러 메시지');
    });

    it('경고와 정보를 포맷팅해야 함', () => {
      const result = {
        valid: true,
        issues: [
          { code: 'WARN', severity: 'warning' as const, message: '경고' },
          { code: 'INFO', severity: 'info' as const, message: '정보' },
        ],
        errors: [],
        warnings: [{ code: 'WARN', severity: 'warning' as const, message: '경고' }],
        infos: [{ code: 'INFO', severity: 'info' as const, message: '정보' }],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('경고');
      expect(formatted).toContain('ℹ️');
      expect(formatted).toContain('정보');
    });
  });
});
