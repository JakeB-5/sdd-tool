/**
 * 명세 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generateSpec,
  parseSpecMetadata,
  updateSpecStatus,
} from '../../../../src/core/new/spec-generator.js';
import { parseSpec } from '../../../../src/core/spec/parser.js';

describe('generateSpec', () => {
  it('기본 명세 파일을 생성한다', () => {
    const content = generateSpec({
      id: 'auth-login',
      title: '로그인 기능',
      description: '사용자 로그인 기능을 제공합니다.',
    });

    expect(content).toContain('id: auth-login');
    expect(content).toContain('title: 로그인 기능');
    expect(content).toContain('status: draft');
    expect(content).toContain('# 로그인 기능');
    expect(content).toContain('사용자 로그인 기능을 제공합니다.');
    // Placeholder scenario names the requirement it covers
    expect(content).toContain('### Scenario 1: [시나리오명] (REQ-01)');
  });

  it('따옴표와 콜론이 포함된 제목을 YAML로 안전하게 기록한다', () => {
    const title = 'Auth: "Login" #1';
    const content = generateSpec({ id: 'login', title, description: '설명' });

    const metadata = parseSpecMetadata(content);
    expect(metadata?.title).toBe(title);
    const parsed = parseSpec(content);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.metadata.title).toBe(title);
    }
  });

  it('depends 목록과 constitution_version을 포함한 명세가 메타데이터 검증을 통과한다', () => {
    const content = generateSpec({
      id: 'payment',
      title: '결제',
      description: '설명',
      depends: ['auth', 'database'],
      constitutionVersion: '1.0.0',
    });

    const parsed = parseSpec(content);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.metadata.depends).toEqual(['auth', 'database']);
      expect(parsed.data.metadata.constitution_version).toBe('1.0.0');
    }
  });

  it('레거시 상태 옵션은 표준 상태로 기록한다', () => {
    const content = generateSpec({ id: 'x', title: 'X', description: 'd', status: 'completed' as never });
    expect(content).toContain('status: implemented');
  });

  it('요구사항을 포함할 수 있다', () => {
    const content = generateSpec({
      id: 'auth-login',
      title: '로그인 기능',
      description: '설명',
      requirements: [
        '이메일로 로그인해야 한다(SHALL)',
        '비밀번호를 암호화해야 한다(MUST)',
      ],
    });

    expect(content).toContain('REQ-01');
    expect(content).toContain('REQ-02');
    expect(content).toContain('이메일로 로그인해야 한다(SHALL)');
  });

  it('시나리오를 포함할 수 있다', () => {
    const content = generateSpec({
      id: 'auth-login',
      title: '로그인 기능',
      description: '설명',
      scenarios: [
        {
          name: '성공적인 로그인',
          given: '유효한 사용자 정보가 있을 때',
          when: '로그인 버튼을 클릭하면',
          then: '메인 페이지로 이동한다',
        },
      ],
    });

    expect(content).toContain('Scenario 1: 성공적인 로그인');
    expect(content).toContain('**GIVEN** 유효한 사용자 정보가 있을 때');
    expect(content).toContain('**WHEN** 로그인 버튼을 클릭하면');
    expect(content).toContain('**THEN** 메인 페이지로 이동한다');
  });

  it('의존성을 포함할 수 있다', () => {
    const content = generateSpec({
      id: 'payment',
      title: '결제 기능',
      description: '설명',
      depends: ['auth', 'database'],
    });

    expect(content).toContain('depends:');
    expect(content).toContain('- auth');
    expect(content).toContain('- database');
  });
});

describe('parseSpecMetadata', () => {
  it('유효한 frontmatter를 파싱한다', () => {
    const content = `---
id: auth-login
title: "로그인 기능"
status: draft
created: 2025-12-21
depends: null
---

# 로그인 기능
`;

    const metadata = parseSpecMetadata(content);

    expect(metadata).not.toBeNull();
    expect(metadata?.id).toBe('auth-login');
    expect(metadata?.title).toBe('로그인 기능');
    expect(metadata?.status).toBe('draft');
    expect(metadata?.created).toBe('2025-12-21');
    expect(metadata?.depends).toBeNull();
  });

  it('의존성 배열을 파싱한다', () => {
    const content = `---
id: payment
title: "결제 기능"
status: draft
created: 2025-12-21
depends:
  - auth
  - database
---

# 결제 기능
`;

    const metadata = parseSpecMetadata(content);

    expect(metadata?.depends).toEqual(['auth', 'database']);
  });

  it('frontmatter가 없으면 null을 반환한다', () => {
    const content = '# 제목만 있는 파일';
    expect(parseSpecMetadata(content)).toBeNull();
  });

  it('CRLF 줄바꿈과 인라인 배열을 파싱한다', () => {
    const content = '---\r\nid: auth\r\ntitle: "인증"\r\nstatus: implemented\r\ndepends: [db, cache]\r\n---\r\n\r\n# 인증\r\n';

    const metadata = parseSpecMetadata(content);

    expect(metadata?.title).toBe('인증');
    expect(metadata?.status).toBe('implemented');
    expect(metadata?.depends).toEqual(['db', 'cache']);
  });

  it('레거시 상태를 표준 상태로 정규화한다', () => {
    expect(parseSpecMetadata('---\nstatus: specified\n---\n')?.status).toBe('review');
    expect(parseSpecMetadata('---\nstatus: completed\n---\n')?.status).toBe('implemented');
  });

  it('알 수 없는 상태는 그대로 유지한다', () => {
    expect(parseSpecMetadata('---\nstatus: weird\n---\n')?.status).toBe('weird');
  });
});

describe('updateSpecStatus', () => {
  it('상태를 업데이트한다', () => {
    const content = `---
id: auth
status: draft
created: 2025-12-21
---

# 인증
`;

    const updated = updateSpecStatus(content, 'review');

    expect(updated).toContain('status: review');
    expect(updated).toContain('updated:');
    expect(updated).toContain('# 인증');
  });

  it('레거시 상태 입력도 표준 상태로 기록한다', () => {
    const content = `---
id: auth
status: draft
---

# 인증
`;

    expect(updateSpecStatus(content, 'specified')).toContain('status: review');
    expect(updateSpecStatus(content, 'completed')).toContain('status: implemented');
  });

  it('갱신된 명세가 스펙 파서 메타데이터 검증을 통과한다', () => {
    const content = `---
id: auth
status: draft
created: 2025-12-21
---

# 인증
`;

    for (const status of ['review', 'approved', 'planned', 'tasked', 'implementing', 'implemented', 'deprecated'] as const) {
      const parsed = parseSpec(updateSpecStatus(content, status));
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.metadata.status).toBe(status);
      }
    }
  });

  it('기존 updated 필드를 업데이트한다', () => {
    const content = `---
id: auth
status: draft
updated: 2025-01-01
created: 2025-12-21
---

# 인증
`;

    const updated = updateSpecStatus(content, 'planned');

    expect(updated).toContain('status: planned');
    expect(updated).not.toContain('2025-01-01');
  });
});
