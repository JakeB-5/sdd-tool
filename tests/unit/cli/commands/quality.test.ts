/**
 * quality 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeQuality } from '../../../../src/cli/commands/quality.js';

describe('executeQuality', () => {
  let tempDir: string;
  let sddPath: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-quality-cmd-'));
    sddPath = path.join(tempDir, '.sdd');
    specsDir = path.join(sddPath, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('프로젝트 전체 품질을 분석한다', async () => {
    // 스펙 생성
    const specDir = path.join(specsDir, 'auth');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: auth
title: "인증"
status: draft
created: 2025-01-01
depends: null
---

# 인증

시스템은 인증 기능을 제공해야 한다(SHALL).

## Scenario: 로그인

- **GIVEN** 사용자가 있을 때
- **WHEN** 로그인하면
- **THEN** 세션이 생성된다
`
    );

    const result = await executeQuality(undefined, { all: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('project');
      expect(result.data.formatted).toBeDefined();
      expect(result.data.passed).toBe(true);
    }
  });

  it('개별 스펙 품질을 분석한다', async () => {
    const specDir = path.join(specsDir, 'user');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: user
title: "사용자"
status: draft
created: 2025-01-01
depends: null
---

# 사용자

시스템은 사용자 관리 기능을 제공해야 한다(SHALL).

## Scenario: 사용자 생성

- **GIVEN** 관리자가 있을 때
- **WHEN** 사용자를 생성하면
- **THEN** 사용자가 등록된다
`
    );

    const result = await executeQuality('user', {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('spec');
    }
  });

  it('JSON 형식으로 출력한다', async () => {
    const specDir = path.join(specsDir, 'api');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: api
title: "API"
status: draft
created: 2025-01-01
depends: null
---

# API

시스템은 API를 제공해야 한다(SHALL).

## Scenario: API 호출

- **GIVEN** 클라이언트가 있을 때
- **WHEN** API를 호출하면
- **THEN** 응답이 반환된다
`
    );

    const result = await executeQuality('api', { json: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      // JSON 형식 확인
      const parsed = JSON.parse(result.data.formatted);
      expect(parsed).toHaveProperty('specId');
    }
  });

  it('최소 점수 미달 시 passed=false', async () => {
    const specDir = path.join(specsDir, 'minimal');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
status: draft
---

# 최소 스펙

기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await executeQuality('minimal', { minScore: '100' }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(false);
    }
  });

  it('존재하지 않는 스펙은 에러를 반환한다', async () => {
    const result = await executeQuality('nonexistent', {}, tempDir);

    expect(result.success).toBe(false);
  });
});
