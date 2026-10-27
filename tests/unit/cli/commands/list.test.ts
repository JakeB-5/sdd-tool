/**
 * list 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getListStatusIcon,
  getFeatureList,
  getChangeList,
  getSpecFileTree,
  getTemplateList,
  getProjectSummary,
} from '../../../../src/cli/commands/list.js';

describe('getListStatusIcon', () => {
  it('draft 상태 아이콘을 반환한다', () => {
    expect(getListStatusIcon('draft')).toBe('📝');
  });

  it('레거시 specified 상태는 review 아이콘을 반환한다', () => {
    expect(getListStatusIcon('specified')).toBe(getListStatusIcon('review'));
    expect(getListStatusIcon('review')).toBe('👀');
  });

  it('approved/implemented/deprecated 상태 아이콘을 반환한다', () => {
    expect(getListStatusIcon('approved')).toBe('👍');
    expect(getListStatusIcon('implemented')).toBe('✅');
    expect(getListStatusIcon('deprecated')).toBe('⚠️');
  });

  it('planned 상태 아이콘을 반환한다', () => {
    expect(getListStatusIcon('planned')).toBe('📋');
  });

  it('tasked 상태 아이콘을 반환한다', () => {
    expect(getListStatusIcon('tasked')).toBe('✏️');
  });

  it('implementing 상태 아이콘을 반환한다', () => {
    expect(getListStatusIcon('implementing')).toBe('🔨');
  });

  it('레거시 completed 상태는 implemented 아이콘을 반환한다', () => {
    expect(getListStatusIcon('completed')).toBe('✅');
  });

  it('알 수 없는 상태에 기본 아이콘을 반환한다', () => {
    expect(getListStatusIcon('unknown')).toBe('❓');
  });
});

describe('getFeatureList', () => {
  let tempDir: string;
  let sddPath: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-feature-'));
    sddPath = path.join(tempDir, '.sdd');
    specsDir = path.join(sddPath, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('빈 스펙 디렉토리에서 빈 배열을 반환한다', async () => {
    const features = await getFeatureList(tempDir);
    expect(features).toEqual([]);
  });

  it('기능 목록을 반환한다', async () => {
    const featureDir = path.join(specsDir, 'auth');
    await fs.mkdir(featureDir);
    await fs.writeFile(
      path.join(featureDir, 'spec.md'),
      `---
title: "인증"
status: draft
---

# 인증
`
    );

    const features = await getFeatureList(tempDir);

    expect(features.length).toBe(1);
    expect(features[0].id).toBe('auth');
    expect(features[0].title).toBe('인증');
    expect(features[0].status).toBe('draft');
  });

  it('상태별로 필터링한다', async () => {
    // draft 상태
    const draftDir = path.join(specsDir, 'draft-feature');
    await fs.mkdir(draftDir);
    await fs.writeFile(
      path.join(draftDir, 'spec.md'),
      `---\ntitle: "Draft"\nstatus: draft\n---\n# Draft`
    );

    // completed 상태
    const completedDir = path.join(specsDir, 'completed-feature');
    await fs.mkdir(completedDir);
    await fs.writeFile(
      path.join(completedDir, 'spec.md'),
      `---\ntitle: "Completed"\nstatus: completed\n---\n# Completed`
    );

    const draftFeatures = await getFeatureList(tempDir, { status: 'draft' });
    expect(draftFeatures.length).toBe(1);
    expect(draftFeatures[0].status).toBe('draft');

    // Legacy `completed` is normalized to `implemented`; both filters match
    const completedFeatures = await getFeatureList(tempDir, { status: 'completed' });
    expect(completedFeatures.length).toBe(1);
    expect(completedFeatures[0].status).toBe('implemented');
    const implementedFeatures = await getFeatureList(tempDir, { status: 'implemented' });
    expect(implementedFeatures.length).toBe(1);
  });

  it('존재하지 않는 프로젝트에서 빈 배열을 반환한다', async () => {
    const features = await getFeatureList('/nonexistent/path');
    expect(features).toEqual([]);
  });
});

describe('getChangeList', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-change-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('빈 프로젝트에서 빈 결과를 반환한다', async () => {
    const result = await getChangeList(tempDir);
    expect(result.pending).toEqual([]);
    expect(result.archived).toEqual([]);
  });

  it('존재하지 않는 프로젝트에서 빈 결과를 반환한다', async () => {
    const result = await getChangeList('/nonexistent/path');
    expect(result.pending).toEqual([]);
    expect(result.archived).toEqual([]);
  });
});

describe('getSpecFileTree', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-specs-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 파일 트리를 반환한다', async () => {
    await fs.writeFile(path.join(specsDir, 'index.md'), '# Index');
    const subDir = path.join(specsDir, 'auth');
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, 'spec.md'), '# Auth Spec');

    const tree = await getSpecFileTree(specsDir);

    expect(tree.length).toBe(2);
    const authDir = tree.find(t => t.name === 'auth');
    expect(authDir?.isDirectory).toBe(true);
    expect(authDir?.children?.length).toBe(1);
  });

  it('존재하지 않는 경로에서 빈 배열을 반환한다', async () => {
    const tree = await getSpecFileTree('/nonexistent/path');
    expect(tree).toEqual([]);
  });
});

describe('getTemplateList', () => {
  let tempDir: string;
  let sddPath: string;
  let templatesDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-templates-'));
    sddPath = path.join(tempDir, '.sdd');
    templatesDir = path.join(sddPath, 'templates');
    await fs.mkdir(templatesDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('템플릿 목록을 반환한다', async () => {
    await fs.writeFile(path.join(templatesDir, 'spec.md'), '# Spec Template');
    await fs.writeFile(path.join(templatesDir, 'plan.md'), '# Plan Template');
    await fs.writeFile(path.join(templatesDir, 'other.txt'), 'Other file');

    const templates = await getTemplateList(tempDir);

    expect(templates.length).toBe(2);
    expect(templates).toContain('spec.md');
    expect(templates).toContain('plan.md');
  });

  it('존재하지 않는 프로젝트에서 빈 배열을 반환한다', async () => {
    const templates = await getTemplateList('/nonexistent/path');
    expect(templates).toEqual([]);
  });
});

describe('getProjectSummary', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-summary-'));
    sddPath = path.join(tempDir, '.sdd');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('초기화되지 않은 프로젝트에서 null을 반환한다', async () => {
    const summary = await getProjectSummary(tempDir);
    expect(summary).toBeNull();
  });

  it('프로젝트 요약을 반환한다', async () => {
    await fs.mkdir(sddPath, { recursive: true });

    const summary = await getProjectSummary(tempDir);

    expect(summary).not.toBeNull();
    expect(summary?.featureCount).toBe(0);
    expect(summary?.pendingChangeCount).toBe(0);
    expect(summary?.archivedChangeCount).toBe(0);
  });

  it('기능 수를 포함한 요약을 반환한다', async () => {
    const specsDir = path.join(sddPath, 'specs');
    // 도메인 기반 구조: specs/common/feature1/spec.md
    await fs.mkdir(path.join(specsDir, 'common', 'feature1'), { recursive: true });
    await fs.mkdir(path.join(specsDir, 'common', 'feature2'), { recursive: true });
    await fs.writeFile(
      path.join(specsDir, 'common', 'feature1', 'spec.md'),
      `---\ntitle: "Feature 1"\nstatus: draft\n---\n# Feature 1`
    );
    await fs.writeFile(
      path.join(specsDir, 'common', 'feature2', 'spec.md'),
      `---\ntitle: "Feature 2"\nstatus: draft\n---\n# Feature 2`
    );

    const summary = await getProjectSummary(tempDir);

    expect(summary?.featureCount).toBe(2);
  });
});
