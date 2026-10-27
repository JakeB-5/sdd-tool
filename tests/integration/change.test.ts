/**
 * sdd change 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd change', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('변경 제안 생성', () => {
    it('새 변경 제안을 생성한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" change -t "테스트 변경"`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('변경 제안');

      // changes 디렉토리에 파일 생성 확인
      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      expect(changes.length).toBeGreaterThan(0);
    });

    it('-s를 반복하거나 쉼표로 구분해 여러 스펙을 지정하면 delta.md에 모두 반영된다', async () => {
      await execAsync(
        `node "${cliPath}" change -t "다중 스펙" -s auth/login -s auth/signup,cart/item`,
        { cwd: tempDir }
      );

      const changeDir = path.join(tempDir, '.sdd', 'changes', 'CHG-001');
      const delta = await fs.readFile(path.join(changeDir, 'delta.md'), 'utf-8');
      const proposal = await fs.readFile(path.join(changeDir, 'proposal.md'), 'utf-8');
      expect(delta).not.toContain('{{SPEC_PATH}}');
      for (const spec of ['auth/login', 'auth/signup', 'cart/item']) {
        expect(delta).toContain(`### ${spec}\n`);
        expect(proposal).toContain(`\`${spec}\``);
      }
    });

    it('change apply가 created 날짜 형식을 유지한다', async () => {
      await execAsync(`node "${cliPath}" change -t "날짜 보존"`, { cwd: tempDir });
      const proposalPath = path.join(tempDir, '.sdd', 'changes', 'CHG-001', 'proposal.md');
      const before = await fs.readFile(proposalPath, 'utf-8');
      const created = before.match(/^created: (\d{4}-\d{2}-\d{2})$/m)?.[1];
      expect(created).toBeDefined();

      await execAsync(`node "${cliPath}" change apply CHG-001`, { cwd: tempDir });

      const after = await fs.readFile(proposalPath, 'utf-8');
      expect(after).toContain(`created: ${created}\n`);
      expect(after).not.toContain('T00:00:00');
      expect(after).toContain('status: applied');
    });

    it('제목 없이 실행하면 기본 제목을 사용한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" change`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('변경 제안');
    });
  });

  describe('변경 목록 조회', () => {
    it('-l 옵션으로 변경 목록을 출력한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "첫 번째 변경"`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" change -l`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/변경|목록/);
    });

    it('변경이 없으면 안내 메시지를 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" change -l`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/없습니다|0/);
    });
  });

  describe('특정 변경 조회', () => {
    it('변경 ID로 상세 정보를 조회한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "조회 테스트"`,
        { cwd: tempDir }
      );

      // ID 추출
      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toBeDefined();
    });
  });

  describe('변경 검증', () => {
    it('validate 서브커맨드로 변경을 검증한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "검증 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      // delta.md에 내용 추가 (검증을 통과하기 위해)
      const deltaPath = path.join(changesPath, changeId, 'delta.md');
      const deltaContent = `---
proposal: ${changeId}
created: ${new Date().toISOString().split('T')[0]}
---

# Delta: 검증 테스트

## ADDED

- 새로운 기능 추가
`;
      await fs.writeFile(deltaPath, deltaContent);

      const { stdout } = await execAsync(
        `node "${cliPath}" change validate ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/검증|valid/i);
    });
  });

  describe('변경 적용', () => {
    it('apply 서브커맨드로 변경을 적용한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "적용 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change apply ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/적용|apply/i);
    });

    it('apply는 상태만 바꾼다고 안내하고 템플릿 문자열을 그대로 출력하지 않는다', async () => {
      await execAsync(`node "${cliPath}" change -t "적용 안내"`, { cwd: tempDir });
      const changeId = (await fs.readdir(path.join(tempDir, '.sdd', 'changes')))[0];

      const { stdout } = await execAsync(`node "${cliPath}" change apply ${changeId}`, { cwd: tempDir });

      expect(stdout).not.toContain('${id}');
      expect(stdout).toContain(`sdd change archive ${changeId}`);
      expect(stdout).toContain('적용됨(applied)으로 표시');
      expect(stdout).toContain('스펙 파일은 자동으로 수정되지 않습니다');

      const proposal = await fs.readFile(
        path.join(tempDir, '.sdd', 'changes', changeId, 'proposal.md'),
        'utf-8'
      );
      expect(proposal).toMatch(/status: applied/);
    });

    it('아카이브 후 새 변경은 아카이브된 ID를 재사용하지 않는다', async () => {
      await execAsync(`node "${cliPath}" change -t "첫 변경"`, { cwd: tempDir });
      await execAsync(`node "${cliPath}" change archive CHG-001`, { cwd: tempDir });
      await execAsync(`node "${cliPath}" change -t "두번째 변경"`, { cwd: tempDir });

      const changes = await fs.readdir(path.join(tempDir, '.sdd', 'changes'));
      expect(changes).toEqual(['CHG-002']);
    });
  });

  describe('변경 아카이브', () => {
    it('archive 서브커맨드로 변경을 아카이브한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "아카이브 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change archive ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/아카이브|archive/i);

      // archive 디렉토리에 이동 확인
      const archivePath = path.join(tempDir, '.sdd', 'archive');
      const archives = await fs.readdir(archivePath);
      expect(archives.length).toBeGreaterThan(0);
    });
  });

  describe('변경 diff', () => {
    it('diff 서브커맨드로 변경 내용을 표시한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "diff 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change diff ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('proposal.md 파싱에 실패하면 0이 아닌 코드로 종료한다', async () => {
      const changeDir = path.join(tempDir, '.sdd', 'changes', 'CHG-001');
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'proposal.md'), '---\nid: not-a-change-id\n---\n# 깨진 제안\n');

      try {
        await execAsync(`node "${cliPath}" change CHG-001`, { cwd: tempDir });
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { code?: number; stdout?: string; stderr?: string };
        expect(execError.code).toBe(2);
        expect((execError.stdout || '') + (execError.stderr || '')).toContain('파싱 실패');
      }
    });

    it('존재하지 않는 변경 ID에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" change CHG-999`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/찾을 수 없|not found|에러|error/i);
      }
    });

    it.each([
      ['change', '..'],
      ['change apply', '..'],
      ['change archive', '..'],
      ['change archive', '../specs'],
      ['change diff', '../..'],
      ['change validate', '..'],
    ])('%s %s: 경로 조작 변경 ID를 거부한다', async (command, badId) => {
      const sddPath = path.join(tempDir, '.sdd');
      const before = (await fs.readdir(sddPath)).sort();

      try {
        await execAsync(`node "${cliPath}" ${command} "${badId}"`, { cwd: tempDir });
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { code?: number; stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(execError.code).not.toBe(0);
        expect(output).toContain('유효하지 않은 변경 ID');
      }

      // .sdd must be left intact (no archive copy, no deletion)
      expect((await fs.readdir(sddPath)).sort()).toEqual(before);
    });
  });
});
