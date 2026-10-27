/**
 * CRLF / YAML frontmatter를 읽는 모든 소비자(list, status, search, report, export, diff) 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getFeatureList } from '../../../../src/cli/commands/list.js';
import { getProjectStatus } from '../../../../src/cli/commands/status.js';
import { searchSpecs } from '../../../../src/core/search/searcher.js';
import { generateReport } from '../../../../src/core/report/reporter.js';
import { parseSpecFile } from '../../../../src/core/export/spec-parser.js';
import { compareSpecs } from '../../../../src/core/diff/structural-diff.js';
import { parseSpec } from '../../../../src/core/spec/parser.js';

const CRLF_SPEC = [
  '---',
  'id: login',
  'title: "Auth: Login"',
  'status: implemented',
  'created: 2025-12-21',
  'tags: [auth, security]',
  'depends: [session, db]',
  'version: 1.0',
  '---',
  '',
  '# Auth: Login',
  '',
  '> 로그인 기능',
  '',
  '## 요구사항',
  '',
  '### REQ-01: 로그인',
  '',
  '- 시스템은 로그인을 지원해야 한다(SHALL).',
  '',
  '## 시나리오',
  '',
  '### Scenario 1: 성공',
  '',
  '- **GIVEN** 사용자',
  '- **WHEN** 로그인',
  '- **THEN** 성공',
  '',
].join('\r\n');

describe('CRLF spec consumers', () => {
  let projectDir: string;
  let sddPath: string;
  let specPath: string;

  beforeEach(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-crlf-'));
    sddPath = path.join(projectDir, '.sdd');
    const specDir = path.join(sddPath, 'specs', 'auth', 'login');
    await fs.mkdir(specDir, { recursive: true });
    specPath = path.join(specDir, 'spec.md');
    await fs.writeFile(specPath, CRLF_SPEC);
  });

  afterEach(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  it('parseSpec: CRLF 스펙을 파싱한다', () => {
    const result = parseSpec(CRLF_SPEC);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.title).toBe('Auth: Login');
      expect(result.data.metadata.tags).toEqual(['auth', 'security']);
      expect(result.data.requirements).toHaveLength(1);
      expect(result.data.scenarios).toHaveLength(1);
    }
  });

  it('list: 제목과 표준 상태를 읽는다', async () => {
    const features = await getFeatureList(projectDir);
    expect(features).toEqual([{ id: 'auth/login', title: 'Auth: Login', status: 'implemented' }]);
  });

  it('status: 제목과 표준 상태를 읽는다', async () => {
    const status = await getProjectStatus(projectDir);
    expect(status.features).toHaveLength(1);
    expect(status.features[0].title).toBe('Auth: Login');
    expect(status.features[0].status).toBe('implemented');
  });

  it('search: 인라인 배열 tags/depends를 YAML대로 읽는다', async () => {
    const result = await searchSpecs(sddPath, { query: '로그인' });
    expect(result.success).toBe(true);
    if (result.success) {
      const item = result.data.items.find((i) => i.id === 'auth/login');
      expect(item?.title).toBe('Auth: Login');
      expect(item?.status).toBe('implemented');
      expect(item?.tags).toEqual(['auth', 'security']);
      expect(item?.depends).toEqual(['session', 'db']);
      expect(item?.created).toBe('2025-12-21');
    }
  });

  it('search: 레거시 상태 필터도 표준 상태로 매칭한다', async () => {
    const result = await searchSpecs(sddPath, { status: 'completed' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items.map((i) => i.id)).toEqual(['auth/login']);
    }
  });

  it('report: 제목/상태를 읽는다', async () => {
    const result = await generateReport(sddPath, { format: 'json', includeQuality: false });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(result.data.content) as {
        specs: Array<{ id: string; title?: string; status?: string }>;
      };
      expect(data.specs[0]).toMatchObject({ id: 'auth/login', title: 'Auth: Login', status: 'implemented' });
    }
  });

  it('export: 메타데이터와 요구사항/시나리오를 읽는다', async () => {
    const spec = await parseSpecFile(specPath, 'auth/login');
    expect(spec.title).toBe('Auth: Login');
    expect(spec.status).toBe('implemented');
    expect(spec.version).toBe('1.0');
    expect(spec.created).toBe('2025-12-21');
    expect(spec.requirements.map((r) => r.id)).toEqual(['REQ-01']);
    expect(spec.scenarios).toHaveLength(1);
    expect(spec.rawContent.includes('\r')).toBe(false);
  });

  it('diff: CRLF와 LF 버전은 구조적으로 동일하다', () => {
    const diff = compareSpecs(CRLF_SPEC, CRLF_SPEC.replace(/\r\n/g, '\n'), 'auth/login');
    expect(diff.requirements).toEqual([]);
    expect(diff.scenarios).toEqual([]);
    expect(diff.metadata).toBeUndefined();
  });
});
