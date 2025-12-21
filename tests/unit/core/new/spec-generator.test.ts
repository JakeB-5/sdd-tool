/**
 * 명세 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generateSpec,
  parseSpecMetadata,
  updateSpecStatus,
} from '../../../../src/core/new/spec-generator.js';

describe('generateSpec', () => {
  it('기본 명세 파일을 생성한다', () => {
    const content = generateSpec({
      id: 'auth-login',
      title: '로그인 기능',
      description: '사용자 로그인 기능을 제공합니다.',
    });

    expect(content).toContain('id: auth-login');
    expect(content).toContain('title: "로그인 기능"');
    expect(content).toContain('status: draft');
    expect(content).toContain('# 로그인 기능');
    expect(content).toContain('사용자 로그인 기능을 제공합니다.');
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

    const updated = updateSpecStatus(content, 'specified');

    expect(updated).toContain('status: specified');
    expect(updated).toContain('updated:');
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
