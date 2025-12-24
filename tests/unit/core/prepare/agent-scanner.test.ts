/**
 * 에이전트 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { AgentScanner } from '../../../../src/core/prepare/agent-scanner.js';

describe('AgentScanner', () => {
  let tempDir: string;
  let agentsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-agent-scanner-'));
    agentsDir = path.join(tempDir, '.claude', 'agents');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('exists', () => {
    it('에이전트 디렉토리가 없으면 false를 반환한다', () => {
      const scanner = new AgentScanner(tempDir);
      expect(scanner.exists()).toBe(false);
    });

    it('에이전트 디렉토리가 있으면 true를 반환한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      const scanner = new AgentScanner(tempDir);
      expect(scanner.exists()).toBe(true);
    });
  });

  describe('scanAll', () => {
    it('디렉토리가 없으면 빈 배열을 반환한다', async () => {
      const scanner = new AgentScanner(tempDir);
      const agents = await scanner.scanAll();
      expect(agents).toEqual([]);
    });

    it('에이전트 파일을 스캔한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'test-runner.md'),
        `---
name: test-runner
description: 테스트 실행 에이전트
tools: Read, Bash
model: sonnet
---

# Test Runner

테스트를 실행합니다.
`
      );

      const scanner = new AgentScanner(tempDir);
      const agents = await scanner.scanAll();

      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe('test-runner');
      expect(agents[0].metadata.description).toBe('테스트 실행 에이전트');
      expect(agents[0].metadata.tools).toEqual(['Read', 'Bash']);
      expect(agents[0].metadata.model).toBe('sonnet');
    });

    it('여러 에이전트를 스캔한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });

      await fs.writeFile(
        path.join(agentsDir, 'agent1.md'),
        `---
name: agent1
description: 에이전트 1
---

# Agent 1
`
      );

      await fs.writeFile(
        path.join(agentsDir, 'agent2.md'),
        `---
name: agent2
description: 에이전트 2
---

# Agent 2
`
      );

      const scanner = new AgentScanner(tempDir);
      const agents = await scanner.scanAll();

      expect(agents).toHaveLength(2);
    });

    it('md 파일이 아닌 파일은 무시한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(path.join(agentsDir, 'README.txt'), 'readme');
      await fs.writeFile(
        path.join(agentsDir, 'valid.md'),
        `---
name: valid
description: 유효한 에이전트
---

# Valid
`
      );

      const scanner = new AgentScanner(tempDir);
      const agents = await scanner.scanAll();

      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe('valid');
    });
  });

  describe('hasAgent', () => {
    it('에이전트가 존재하면 true를 반환한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'my-agent.md'),
        `---
name: my-agent
description: 에이전트
---

# My Agent
`
      );

      const scanner = new AgentScanner(tempDir);
      expect(scanner.hasAgent('my-agent')).toBe(true);
    });

    it('에이전트가 없으면 false를 반환한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      const scanner = new AgentScanner(tempDir);
      expect(scanner.hasAgent('non-existent')).toBe(false);
    });
  });

  describe('getAgent', () => {
    it('특정 에이전트를 가져온다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'target.md'),
        `---
name: target
description: 타겟 에이전트
---

# Target
`
      );

      const scanner = new AgentScanner(tempDir);
      const agent = await scanner.getAgent('target');

      expect(agent).not.toBeNull();
      expect(agent!.name).toBe('target');
    });

    it('존재하지 않는 에이전트는 null을 반환한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      const scanner = new AgentScanner(tempDir);
      const agent = await scanner.getAgent('non-existent');

      expect(agent).toBeNull();
    });
  });

  describe('metadata parsing', () => {
    it('name이 없으면 파일명에서 추출한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'inferred-name.md'),
        `---
description: 이름 없는 에이전트
---

# Agent
`
      );

      const scanner = new AgentScanner(tempDir);
      const agents = await scanner.scanAll();

      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe('inferred-name');
    });

    it('tools가 문자열이면 배열로 변환한다', async () => {
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'string-tools.md'),
        `---
name: string-tools
description: 문자열 도구
tools: Read, Write, Bash
---

# Agent
`
      );

      const scanner = new AgentScanner(tempDir);
      const agents = await scanner.scanAll();

      expect(agents[0].metadata.tools).toEqual(['Read', 'Write', 'Bash']);
    });
  });
});
