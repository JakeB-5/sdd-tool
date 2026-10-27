/**
 * impact 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  resolveProposalPath,
  executeGraphAnalysis,
  formatChangeImpactOutput,
  type ChangeImpactAnalysis,
} from '../../../../src/cli/commands/impact.js';

describe('resolveProposalPath', () => {
  it('절대 경로는 그대로 반환한다', () => {
    const result = resolveProposalPath('/absolute/path/proposal.md', '/sdd');
    expect(result).toBe('/absolute/path/proposal.md');
  });

  it('.md 파일은 changes 디렉토리에 추가한다', () => {
    const result = resolveProposalPath('my-change.md', '/project/.sdd');
    expect(result).toBe(path.join('/project/.sdd', 'changes', 'my-change.md'));
  });

  it('디렉토리명은 proposal.md를 추가한다', () => {
    const result = resolveProposalPath('my-change', '/project/.sdd');
    expect(result).toBe(path.join('/project/.sdd', 'changes', 'my-change', 'proposal.md'));
  });

  it.each(['..', '../../etc/passwd', 'a/../../b.md', 'a\\b'])(
    '경로 조작 상대 경로(%s)는 null을 반환한다',
    (bad) => {
      expect(resolveProposalPath(bad, '/project/.sdd')).toBeNull();
    }
  );
});

describe('formatChangeImpactOutput', () => {
  it('기본 변경 영향 분석 결과를 포맷한다', () => {
    const data: ChangeImpactAnalysis = {
      changeId: 'change-001',
      title: '테스트 변경',
      status: 'pending',
      affectedSpecs: [],
      transitiveAffected: [],
      totalImpact: 0,
      riskLevel: 'low',
      recommendations: [],
    };

    const output = formatChangeImpactOutput(data);

    expect(output).toContain('change-001');
    expect(output).toContain('테스트 변경');
    expect(output).toContain('pending');
    expect(output).toContain('🟢'); // low risk
  });

  it('직접 영향 스펙을 포함한다', () => {
    const data: ChangeImpactAnalysis = {
      changeId: 'change-002',
      status: 'pending',
      affectedSpecs: [
        { id: 'auth', reason: '직접 수정' },
        { id: 'user', reason: '의존성 변경' },
      ],
      transitiveAffected: [],
      totalImpact: 2,
      riskLevel: 'medium',
      recommendations: [],
    };

    const output = formatChangeImpactOutput(data);

    expect(output).toContain('직접 영향 받는 스펙');
    expect(output).toContain('auth');
    expect(output).toContain('user');
    expect(output).toContain('🟡'); // medium risk
  });

  it('간접 영향 스펙을 포함한다', () => {
    const data: ChangeImpactAnalysis = {
      changeId: 'change-003',
      status: 'pending',
      affectedSpecs: [],
      transitiveAffected: [
        { id: 'payment', reason: '전이 의존성' },
      ],
      totalImpact: 1,
      riskLevel: 'high',
      recommendations: ['주의 필요'],
    };

    const output = formatChangeImpactOutput(data);

    expect(output).toContain('간접 영향 받는 스펙');
    expect(output).toContain('payment');
    expect(output).toContain('🔴'); // high risk
    expect(output).toContain('권장사항');
    expect(output).toContain('주의 필요');
  });

  it('권장사항을 포함한다', () => {
    const data: ChangeImpactAnalysis = {
      changeId: 'change-004',
      status: 'pending',
      affectedSpecs: [],
      transitiveAffected: [],
      totalImpact: 0,
      riskLevel: 'low',
      recommendations: ['테스트 추가', '문서 업데이트'],
    };

    const output = formatChangeImpactOutput(data);

    expect(output).toContain('권장사항');
    expect(output).toContain('테스트 추가');
    expect(output).toContain('문서 업데이트');
  });
});

describe('executeGraphAnalysis (도메인 레이아웃)', () => {
  let tempDir: string;
  let specsPath: string;

  async function writeSpec(id: string, depends: string): Promise<void> {
    await fs.mkdir(path.join(specsPath, id), { recursive: true });
    await fs.writeFile(
      path.join(specsPath, id, 'spec.md'),
      `---\nstatus: draft\ndepends: ${depends}\n---\n\n# ${id}\n`
    );
  }

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-impact-graph-cli-'));
    specsPath = path.join(tempDir, 'specs');
    await writeSpec('auth/login', 'missing-spec');
    await writeSpec('common/signup', 'login');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('bare 참조를 canonical id로 해석해 강조한다', async () => {
    const result = await executeGraphAnalysis(specsPath, 'login');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mermaid).toContain('style auth_login fill:#ff9');
    }
  });

  it('해석되지 않는 강조 대상은 에러를 반환한다', async () => {
    const result = await executeGraphAnalysis(specsPath, 'nope');
    expect(result.success).toBe(false);
  });

  it('JSON 결과에 dangling 의존성을 포함한다', async () => {
    const result = await executeGraphAnalysis(specsPath, undefined, true);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dangling).toEqual([{ from: 'auth/login', to: 'missing-spec' }]);
      expect(result.data.edges).toEqual([
        expect.objectContaining({ from: 'common/signup', to: 'auth/login' }),
      ]);
    }
  });
});
