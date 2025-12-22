/**
 * change 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getChangeListItems,
  getChangeInfo,
  createChange,
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
