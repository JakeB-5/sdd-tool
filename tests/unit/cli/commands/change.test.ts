/**
 * change 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getChangeInfo,
  createChange,
  normalizeSpecOption,
  applyChange,
  getDeltaInfo,
  validateChange,
} from '../../../../src/cli/commands/change.js';

describe('createChange', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('새 변경 제안을 생성한다', async () => {
    const result = await createChange(sddPath, { title: '테스트 변경' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toMatch(/^CHG-\d+$/);
      expect(result.data.proposalPath).toContain('proposal.md');
      expect(result.data.deltaPath).toContain('delta.md');
    }
  });

  it('proposal.md 파일을 생성한다', async () => {
    const result = await createChange(sddPath, { title: '테스트 변경' });

    expect(result.success).toBe(true);
    if (result.success) {
      const proposalExists = await fs
        .stat(result.data.proposalPath)
        .then(() => true)
        .catch(() => false);
      expect(proposalExists).toBe(true);
    }
  });

  it('delta.md 파일을 생성한다', async () => {
    const result = await createChange(sddPath, { title: '테스트 변경' });

    expect(result.success).toBe(true);
    if (result.success) {
      const deltaExists = await fs
        .stat(result.data.deltaPath)
        .then(() => true)
        .catch(() => false);
      expect(deltaExists).toBe(true);
    }
  });
});

describe('getChangeInfo', () => {
  let tempDir: string;
  let changePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-info-test-'));
    changePath = path.join(tempDir, 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('proposal.md가 없으면 실패한다', async () => {
    const result = await getChangeInfo(changePath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('proposal.md');
    }
  });

  it('유효한 proposal.md 정보를 반환한다', async () => {
    const proposalContent = `---
id: CHG-001
status: draft
created: 2024-01-01
---

# 변경 제안: 테스트 변경

## 배경

테스트용 배경

## 영향 범위

### 영향받는 스펙

- specs/auth.md
`;
    await fs.writeFile(path.join(changePath, 'proposal.md'), proposalContent);

    const result = await getChangeInfo(changePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('CHG-001');
      expect(result.data.title).toBe('테스트 변경');
      expect(result.data.status).toBe('draft');
    }
  });
});

describe('normalizeSpecOption', () => {
  it('단일 값, 반복 값, 쉼표 구분 값을 중복 없이 목록으로 만든다', () => {
    expect(normalizeSpecOption(undefined)).toEqual([]);
    expect(normalizeSpecOption('auth/login')).toEqual(['auth/login']);
    expect(normalizeSpecOption(['a/x', 'b/y'])).toEqual(['a/x', 'b/y']);
    expect(normalizeSpecOption(['a/x, b/y', 'a/x', ' ', 'c/z'])).toEqual(['a/x', 'b/y', 'c/z']);
  });
});

describe('createChange - 스펙 지정', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-spec-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 1개를 지정하면 delta.md에 플레이스홀더 없이 해당 스펙이 들어간다', async () => {
    const result = await createChange(sddPath, { title: '변경', spec: 'auth/login' });

    expect(result.success).toBe(true);
    if (result.success) {
      const delta = await fs.readFile(result.data.deltaPath, 'utf-8');
      expect(delta).not.toContain('{{SPEC_PATH}}');
      expect(delta).toContain('### auth/login');
      const proposal = await fs.readFile(result.data.proposalPath, 'utf-8');
      expect(proposal).toContain('`auth/login`');
    }
  });

  it('스펙을 여러 개 지정하면 proposal과 delta에 모두 반영된다', async () => {
    const result = await createChange(sddPath, { title: '변경', spec: ['auth/login', 'cart/item,cart/coupon'] });

    expect(result.success).toBe(true);
    if (result.success) {
      const delta = await fs.readFile(result.data.deltaPath, 'utf-8');
      const proposal = await fs.readFile(result.data.proposalPath, 'utf-8');
      for (const spec of ['auth/login', 'cart/item', 'cart/coupon']) {
        expect(delta).toContain(`### ${spec}\n`);
        expect(proposal).toContain(`- \`${spec}\``);
      }
      expect(delta).not.toContain('{{SPEC_PATH}}');
    }
  });

  it('스펙을 지정하지 않으면 플레이스홀더를 유지한다', async () => {
    const result = await createChange(sddPath, { title: '변경' });

    expect(result.success).toBe(true);
    if (result.success) {
      const delta = await fs.readFile(result.data.deltaPath, 'utf-8');
      expect(delta).toContain('### {{SPEC_PATH}}');
    }
  });
});

describe('applyChange', () => {
  let tempDir: string;
  let changePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-apply-test-'));
    changePath = path.join(tempDir, 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('proposal.md가 없으면 실패한다', async () => {
    const result = await applyChange(changePath);

    expect(result.success).toBe(false);
  });

  it('proposal.md 상태를 applied로 변경한다', async () => {
    const proposalContent = `---
id: CHG-001
status: draft
created: 2024-01-01
---

# 변경 제안: 테스트 변경

## 배경

테스트용 배경
`;
    await fs.writeFile(path.join(changePath, 'proposal.md'), proposalContent);

    const result = await applyChange(changePath);

    expect(result.success).toBe(true);

    const updatedContent = await fs.readFile(
      path.join(changePath, 'proposal.md'),
      'utf-8'
    );
    expect(updatedContent).toContain('status: applied');
  });

  it('created 날짜 형식을 ISO 타임스탬프로 바꾸지 않는다', async () => {
    await fs.writeFile(
      path.join(changePath, 'proposal.md'),
      '---\nid: CHG-001\nstatus: draft\ncreated: 2026-10-27\n---\n\n# 변경 제안: 테스트\n'
    );

    const result = await applyChange(changePath);

    expect(result.success).toBe(true);
    const updated = await fs.readFile(path.join(changePath, 'proposal.md'), 'utf-8');
    expect(updated).toContain('created: 2026-10-27\n');
    expect(updated).not.toContain('T00:00:00');
    expect(updated).toContain('status: applied');
  });

  it('frontmatter가 없는 proposal.md는 원인을 포함한 오류를 반환한다', async () => {
    await fs.writeFile(path.join(changePath, 'proposal.md'), '# 변경 제안: frontmatter 없음\n');

    const result = await applyChange(changePath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('proposal.md를 업데이트할 수 없습니다');
      expect(result.error.message).toContain('frontmatter');
    }
  });

  it('proposal.md를 저장할 수 없으면 실패를 반환한다', async () => {
    const proposalPath = path.join(changePath, 'proposal.md');
    await fs.writeFile(proposalPath, '---\nid: CHG-001\nstatus: draft\ncreated: 2024-01-01\n---\n# t\n');
    await fs.chmod(proposalPath, 0o444);

    try {
      const result = await applyChange(changePath);
      expect(result.success).toBe(false);
    } finally {
      await fs.chmod(proposalPath, 0o644);
    }
  });
});

describe('createChange - ID 발급', () => {
  let sddPath: string;

  beforeEach(async () => {
    sddPath = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-id-'));
  });

  afterEach(async () => {
    await fs.rm(sddPath, { recursive: true, force: true });
  });

  it('아카이브된 변경 ID 다음 번호를 사용한다', async () => {
    await fs.mkdir(path.join(sddPath, 'archive', '2025-01', '2025-01-10-CHG-005'), { recursive: true });

    const result = await createChange(sddPath, { title: '새 변경' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('CHG-006');
    }
  });

  it('변경 디렉토리를 만들 수 없으면 실패를 반환한다', async () => {
    await fs.mkdir(path.join(sddPath, 'changes'));
    await fs.chmod(path.join(sddPath, 'changes'), 0o555);

    try {
      const result = await createChange(sddPath, {});
      expect(result.success).toBe(false);
    } finally {
      await fs.chmod(path.join(sddPath, 'changes'), 0o755);
    }
  });
});

describe('getDeltaInfo', () => {
  let tempDir: string;
  let changePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-delta-test-'));
    changePath = path.join(tempDir, 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('delta.md가 없으면 실패한다', async () => {
    const result = await getDeltaInfo(changePath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('delta.md');
    }
  });

  it('유효한 delta.md 정보를 반환한다', async () => {
    const deltaContent = `---
proposal: CHG-001
created: 2024-01-01
---

# Delta: 테스트 변경

## ADDED

새 스펙 내용

## MODIFIED

### specs/auth.md

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

## REMOVED

삭제되는 내용
`;
    await fs.writeFile(path.join(changePath, 'delta.md'), deltaContent);

    const result = await getDeltaInfo(changePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.added.length).toBeGreaterThan(0);
      expect(result.data.modified.length).toBeGreaterThan(0);
      expect(result.data.removed.length).toBeGreaterThan(0);
    }
  });
});

describe('validateChange', () => {
  let tempDir: string;
  let changePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-change-test-'));
    changePath = path.join(tempDir, 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('proposal.md가 없으면 proposalValid=false', async () => {
    const result = await validateChange(changePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.proposalValid).toBe(false);
      expect(result.data.proposalError).toContain('proposal.md가 없습니다');
    }
  });

  it('유효한 proposal.md가 있으면 proposalValid=true', async () => {
    const proposalContent = `---
id: CHG-001
status: draft
created: 2024-01-01
---

# 변경 제안: 테스트 변경

## 배경

테스트용 배경
`;
    await fs.writeFile(path.join(changePath, 'proposal.md'), proposalContent);

    const result = await validateChange(changePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.proposalValid).toBe(true);
      expect(result.data.proposalTitle).toBe('테스트 변경');
    }
  });

  it('delta.md가 없으면 hasDelta=false', async () => {
    const proposalContent = `---
id: CHG-001
status: draft
created: 2024-01-01
---

# 변경 제안: 테스트 변경
`;
    await fs.writeFile(path.join(changePath, 'proposal.md'), proposalContent);

    const result = await validateChange(changePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasDelta).toBe(false);
    }
  });
});
