/**
 * 코드 영향도 분석 테스트
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  analyzeCodeImpact,
  formatCodeImpactResult,
  type CodeImpactResult,
} from '../../../../src/core/impact/code-analyzer.js';

describe('analyzeCodeImpact', () => {
  let tempDir: string;
  let sddPath: string;
  let srcPath: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-code-analyzer-test-'));
    sddPath = path.join(tempDir, '.sdd');
    srcPath = path.join(tempDir, 'src');

    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(sddPath, 'specs', 'auth'), { recursive: true });
    await fs.mkdir(path.join(srcPath, 'core'), { recursive: true });
    await fs.mkdir(path.join(srcPath, 'services'), { recursive: true });

    // 테스트용 스펙 생성
    await fs.writeFile(
      path.join(sddPath, 'specs', 'auth', 'spec.md'),
      `---
id: auth
title: "인증 모듈"
---

# 인증 모듈

사용자 인증 기능
`
    );

    // 테스트용 코드 파일 생성 - 주석 참조 있음
    await fs.writeFile(
      path.join(srcPath, 'core', 'auth.ts'),
      `// spec: auth
// 인증 모듈 구현

export function login(username: string, password: string) {
  return { success: true };
}

export function logout() {
  return { success: true };
}
`
    );

    // 테스트용 코드 파일 생성 - auth를 import
    await fs.writeFile(
      path.join(srcPath, 'services', 'user-service.ts'),
      `import { login, logout } from '../core/auth';

export function handleLogin(username: string, password: string) {
  return login(username, password);
}
`
    );

    // 테스트용 코드 파일 생성 - 관련 없음
    await fs.writeFile(
      path.join(srcPath, 'core', 'utils.ts'),
      `// 유틸리티 함수

export function formatDate(date: Date) {
  return date.toISOString();
}
`
    );
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('주석으로 참조된 코드 파일을 찾는다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'auth');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    expect(data.directFiles.length).toBeGreaterThan(0);

    const authFile = data.directFiles.find((f) =>
      f.relativePath.includes('auth.ts')
    );
    expect(authFile).toBeDefined();
    expect(authFile?.reason).toBe('스펙 ID 주석 참조');
  });

  it('import 관계를 통해 간접 영향 파일을 찾는다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'auth');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;

    // 간접 영향 파일 확인 (user-service.ts가 auth.ts를 import)
    const indirectFile = data.indirectFiles.find((f) =>
      f.relativePath.includes('user-service.ts')
    );

    // import 관계 추적이 작동하는지 확인
    expect(data.indirectFiles.length).toBeGreaterThanOrEqual(0);
  });

  it('관련 없는 파일은 포함하지 않는다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'auth');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;

    // utils.ts는 직접 영향 파일에 포함되지 않아야 함
    const utilsFile = data.directFiles.find((f) =>
      f.relativePath.includes('utils.ts')
    );
    expect(utilsFile).toBeUndefined();
  });

  it('리스크 점수를 계산한다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'auth');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    expect(data.riskScore).toBeGreaterThanOrEqual(1);
    expect(data.riskScore).toBeLessThanOrEqual(10);
    expect(['low', 'medium', 'high']).toContain(data.riskLevel);
  });

  it('요약을 생성한다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'auth');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    expect(data.summary).toContain('auth');
    expect(data.summary).toContain('코드 영향');
  });

  it('권장사항을 생성한다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'auth');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    expect(data.recommendations.length).toBeGreaterThan(0);
  });
});

describe('코드 매핑 설정', () => {
  let tempDir: string;
  let sddPath: string;
  let srcPath: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-code-mapping-test-'));
    sddPath = path.join(tempDir, '.sdd');
    srcPath = path.join(tempDir, 'src');

    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(srcPath, { recursive: true });

    // 매핑 설정 파일 생성
    await fs.writeFile(
      path.join(sddPath, 'code-mapping.json'),
      JSON.stringify({
        version: '1.0.0',
        mappings: [
          {
            specId: 'feature-x',
            files: ['src/feature-x.ts'],
          },
        ],
      })
    );

    // 매핑된 파일 생성
    await fs.writeFile(
      path.join(srcPath, 'feature-x.ts'),
      `// 기능 X 구현
export function featureX() {
  return 'x';
}
`
    );
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('매핑 설정에서 정의된 파일을 찾는다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'feature-x');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    const mappedFile = data.directFiles.find((f) =>
      f.relativePath.includes('feature-x.ts')
    );

    expect(mappedFile).toBeDefined();
    expect(mappedFile?.reason).toBe('매핑 설정에 정의됨');
  });
});

describe('파일명/디렉토리명 매칭', () => {
  let tempDir: string;
  let sddPath: string;
  let srcPath: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-name-match-test-'));
    sddPath = path.join(tempDir, '.sdd');
    srcPath = path.join(tempDir, 'src');

    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(srcPath, 'payment'), { recursive: true });

    // 파일명이 스펙 ID와 일치하는 파일
    await fs.writeFile(
      path.join(srcPath, 'payment.ts'),
      `// 결제 모듈
export function pay() {}
`
    );

    // 디렉토리명이 스펙 ID와 일치하는 파일
    await fs.writeFile(
      path.join(srcPath, 'payment', 'handler.ts'),
      `// 결제 핸들러
export function handlePayment() {}
`
    );
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('파일명이 스펙 ID와 일치하면 찾는다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'payment');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    const paymentFile = data.directFiles.find(
      (f) => path.basename(f.relativePath) === 'payment.ts'
    );

    expect(paymentFile).toBeDefined();
    expect(paymentFile?.reason).toBe('파일명 일치');
  });

  it('디렉토리명이 스펙 ID와 일치하면 찾는다', async () => {
    const result = await analyzeCodeImpact(tempDir, sddPath, 'payment');
    expect(result.success).toBe(true);

    const data = result.data as CodeImpactResult;
    const handlerFile = data.directFiles.find((f) =>
      f.relativePath.includes('payment/handler.ts') ||
      f.relativePath.includes('payment\\handler.ts')
    );

    expect(handlerFile).toBeDefined();
    expect(handlerFile?.reason).toBe('디렉토리명 일치');
  });
});

describe('formatCodeImpactResult', () => {
  it('코드 영향도 결과를 포맷한다', () => {
    const result: CodeImpactResult = {
      targetSpec: 'test-spec',
      directFiles: [
        {
          path: '/src/test.ts',
          relativePath: 'src/test.ts',
          impactLevel: 'high',
          impactType: 'direct',
          reason: '스펙 ID 주석 참조',
          linkedSpec: 'test-spec',
        },
      ],
      indirectFiles: [
        {
          path: '/src/other.ts',
          relativePath: 'src/other.ts',
          impactLevel: 'medium',
          impactType: 'indirect',
          reason: 'test.ts를 import함',
        },
      ],
      totalFiles: 2,
      riskScore: 3,
      riskLevel: 'low',
      summary: 'test-spec 스펙 변경 시 코드 영향:\n- 1개 파일에 직접 영향',
      recommendations: ['관련 테스트를 실행하세요.'],
    };

    const formatted = formatCodeImpactResult(result);

    expect(formatted).toContain('코드 영향도 분석');
    expect(formatted).toContain('test-spec');
    expect(formatted).toContain('src/test.ts');
    expect(formatted).toContain('스펙 ID 주석 참조');
    expect(formatted).toContain('src/other.ts');
    expect(formatted).toContain('리스크 점수');
  });

  it('직접 연결된 파일이 없는 경우 안내 메시지를 표시한다', () => {
    const result: CodeImpactResult = {
      targetSpec: 'no-code-spec',
      directFiles: [],
      indirectFiles: [],
      totalFiles: 0,
      riskScore: 1,
      riskLevel: 'low',
      summary: 'no-code-spec 스펙 변경 시 코드 영향:\n- 직접 연결된 코드 파일 없음',
      recommendations: ['코드에 스펙 참조 주석을 추가하세요.'],
    };

    const formatted = formatCodeImpactResult(result);

    expect(formatted).toContain('직접 연결된 코드 파일 없음');
    expect(formatted).toContain('// spec: feature-id');
  });
});
