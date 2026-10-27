/**
 * cicd 명령어 핵심 로직 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  registerCicdCommand,
  generateGitHubLabeler,
  generateGitHubWorkflow,
  generateGitLabCI,
  generateHookScript,
  executeCiCheck,
} from '../../../../src/cli/commands/cicd.js';

describe('registerCicdCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
  });

  it('cicd 명령어를 등록한다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    expect(cicdCommand).toBeDefined();
    expect(cicdCommand?.description()).toContain('CI/CD');
  });

  it('setup 서브커맨드를 등록한다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    const setupCommand = cicdCommand?.commands.find(cmd => cmd.name() === 'setup');

    expect(setupCommand).toBeDefined();
    expect(setupCommand?.description()).toContain('워크플로우');
  });

  it('hooks 서브커맨드를 등록한다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    const hooksCommand = cicdCommand?.commands.find(cmd => cmd.name() === 'hooks');

    expect(hooksCommand).toBeDefined();
    expect(hooksCommand?.description()).toContain('hooks');
  });

  it('check 서브커맨드를 등록한다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    const checkCommand = cicdCommand?.commands.find(cmd => cmd.name() === 'check');

    expect(checkCommand).toBeDefined();
    expect(checkCommand?.description()).toContain('검증');
  });

  it('setup 명령어에 strict 옵션이 있다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    const setupCommand = cicdCommand?.commands.find(cmd => cmd.name() === 'setup');
    const strictOption = setupCommand?.options.find(opt => opt.long === '--strict');

    expect(strictOption).toBeDefined();
    expect(strictOption?.description).toContain('엄격');
  });

  it('hooks 명령어에 install 옵션이 있다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    const hooksCommand = cicdCommand?.commands.find(cmd => cmd.name() === 'hooks');
    const installOption = hooksCommand?.options.find(opt => opt.long === '--install');

    expect(installOption).toBeDefined();
    expect(installOption?.description).toContain('husky');
  });

  it('check 명령어에 fail-on-warning 옵션이 있다', () => {
    registerCicdCommand(program);

    const cicdCommand = program.commands.find(cmd => cmd.name() === 'cicd');
    const checkCommand = cicdCommand?.commands.find(cmd => cmd.name() === 'check');
    const failOption = checkCommand?.options.find(opt => opt.long === '--fail-on-warning');

    expect(failOption).toBeDefined();
    expect(failOption?.description).toContain('경고');
  });
});

describe('generateGitHubWorkflow', () => {
  it('기본 GitHub Actions 워크플로우를 생성한다', () => {
    const workflow = generateGitHubWorkflow(false);

    expect(workflow).toContain('name: SDD Validation');
    expect(workflow).toContain('uses: actions/checkout@v4');
    expect(workflow).toContain('uses: actions/setup-node@v4');
    expect(workflow).toContain('npm install -g sdd-tool');
    expect(workflow).toContain('sdd validate');
    expect(workflow).toContain('sdd constitution validate');
  });

  it('strict 모드로 워크플로우를 생성한다', () => {
    const workflow = generateGitHubWorkflow(true);

    expect(workflow).toContain('sdd validate --strict');
    expect(workflow).not.toContain('sdd validate\n');
  });

  it('strict가 false면 플래그 없이 생성한다', () => {
    const workflow = generateGitHubWorkflow(false);

    expect(workflow).toContain('run: sdd validate\n');
    expect(workflow).not.toContain('--strict');
  });

  it('PR과 push 트리거를 포함한다', () => {
    const workflow = generateGitHubWorkflow(false);

    expect(workflow).toContain('on:');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches: [main, master, develop]');
  });

  it('.sdd 디렉토리 변경 시만 실행되도록 설정한다', () => {
    const workflow = generateGitHubWorkflow(false);

    expect(workflow).toContain("paths:");
    expect(workflow).toContain("- '.sdd/**'");
  });

  it('impact report 아티팩트를 업로드한다', () => {
    const workflow = generateGitHubWorkflow(false);

    expect(workflow).toContain('sdd impact report --json');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('name: impact-report');
  });
});

describe('생성된 CI 안정성', () => {
  const version = (JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string }).version;

  it('GitHub 워크플로우와 GitLab CI가 실행 중인 도구 버전으로 sdd-tool을 고정 설치한다', () => {
    expect(generateGitHubWorkflow(false)).toContain(`npm install -g sdd-tool@${version}`);
    expect(generateGitLabCI(false)).toContain(`npm install -g sdd-tool@${version}`);
  });

  it('라벨러 워크플로우가 필요한 최소 권한만 명시한다', () => {
    const labeler = generateGitHubLabeler();

    expect(labeler).toMatch(/permissions:\n\s+contents: read\n\s+pull-requests: write\n\s+issues: write/);
  });

  it('검증 워크플로우는 읽기 권한만 요청한다', () => {
    expect(generateGitHubWorkflow(false)).toMatch(/permissions:\n\s+contents: read\n/);
  });

  it('라벨러 변경 감지 스크립트가 일치하는 파일이 없어도 bash -e -o pipefail에서 실패하지 않는다', async () => {
    const labeler = generateGitHubLabeler();
    const block = labeler.match(/run: \|\n([\s\S]*?)\n\n {6}- name: Apply Labels/)?.[1];
    expect(block).toBeDefined();
    const script = block!
      .split('\n')
      .map((line) => line.replace(/^ {10}/, ''))
      .join('\n');

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-labeler-test-'));
    try {
      const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf-8' });
      git('init', '-q', '-b', 'main');
      git('config', 'user.email', 't@example.com');
      git('config', 'user.name', 't');
      git('config', 'commit.gpgsign', 'false');
      await fs.writeFile(path.join(dir, 'a.txt'), 'a');
      git('add', '.');
      git('commit', '-q', '-m', 'base');
      git('update-ref', 'refs/remotes/origin/main', 'HEAD');
      // Change touches no .sdd/specs/ file, so `grep` matches nothing
      await fs.writeFile(path.join(dir, 'a.txt'), 'b');

      const outputFile = path.join(dir, 'gh-output');
      await fs.writeFile(outputFile, '');
      execFileSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
        cwd: dir,
        env: { ...process.env, BASE_REF: 'main', GITHUB_OUTPUT: outputFile },
      });

      const out = await fs.readFile(outputFile, 'utf-8');
      expect(out).toContain('domains=');
      expect(out).toContain('constitution=false');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe('generateGitLabCI', () => {
  it('기본 GitLab CI 구성을 생성한다', () => {
    const ci = generateGitLabCI(false);

    expect(ci).toContain('sdd:validate:');
    expect(ci).toContain('stage: test');
    expect(ci).toContain('image: node:20');
    expect(ci).toContain('npm install -g sdd-tool');
    expect(ci).toContain('sdd validate');
    expect(ci).toContain('sdd constitution validate');
  });

  it('strict 모드로 CI 구성을 생성한다', () => {
    const ci = generateGitLabCI(true);

    expect(ci).toContain('sdd validate --strict');
  });

  it('strict가 false면 플래그 없이 생성한다', () => {
    const ci = generateGitLabCI(false);

    expect(ci).toContain('- sdd validate\n');
    expect(ci).not.toContain('--strict');
  });

  it('MR과 기본 브랜치 트리거를 설정한다', () => {
    const ci = generateGitLabCI(false);

    expect(ci).toContain('rules:');
    expect(ci).toContain('$CI_PIPELINE_SOURCE == "merge_request_event"');
    expect(ci).toContain('$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH');
  });

  it('.sdd 디렉토리 변경 감지를 설정한다', () => {
    const ci = generateGitLabCI(false);

    expect(ci).toContain('changes:');
    expect(ci).toContain('- .sdd/**/*');
  });

  it('아티팩트 저장을 설정한다', () => {
    const ci = generateGitLabCI(false);

    expect(ci).toContain('artifacts:');
    expect(ci).toContain('impact-report.json');
    expect(ci).toContain('expire_in: 1 week');
  });

  it('JSON 리포트를 dotenv 리포트로 지정하지 않고 프로젝트 의존성을 설치하지 않는다', () => {
    const ci = generateGitLabCI(false);

    expect(ci).not.toContain('dotenv');
    expect(ci).not.toContain('npm ci');
  });
});

describe('generateGitHubWorkflow 의존성', () => {
  it('lockfile 없이 동작하도록 npm ci / npm 캐시를 사용하지 않는다', () => {
    const workflow = generateGitHubWorkflow(false);

    expect(workflow).not.toContain('npm ci');
    expect(workflow).not.toContain("cache: 'npm'");
  });
});

describe('executeCiCheck', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-cicd-check-'));
    for (const dir of ['specs', 'changes', 'archive', 'templates']) {
      await fs.mkdir(path.join(tempDir, '.sdd', dir), { recursive: true });
    }
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 내용을 실제로 검증하여 잘못된 스펙이 있으면 에러로 보고한다', async () => {
    const specDir = path.join(tempDir, '.sdd', 'specs', 'broken');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), '# 깨진 스펙\n\n내용 없음\n');

    const result = await executeCiCheck(tempDir, {});

    expect(result.specsFailed).toBe(1);
    expect(result.hasErrors).toBe(true);
  });

  it('스펙이 없으면 에러 없이 통과한다', async () => {
    const result = await executeCiCheck(tempDir, {});

    expect(result.hasErrors).toBe(false);
    expect(result.specsFailed).toBe(0);
  });
});

describe('generateHookScript', () => {
  describe('pre-commit 훅', () => {
    it('pre-commit 스크립트를 생성한다', () => {
      const script = generateHookScript('pre-commit');

      expect(script).toContain('#!/bin/sh');
      expect(script).toContain('husky.sh');
      expect(script).toContain('npx sdd validate');
    });

    it('검증 실패 시 종료 코드를 체크한다', () => {
      const script = generateHookScript('pre-commit');

      expect(script).toContain('if [ $? -ne 0 ]');
      expect(script).toContain('exit 1');
    });

    it('검증 메시지를 포함한다', () => {
      const script = generateHookScript('pre-commit');

      expect(script).toContain('Validating SDD specs');
      expect(script).toContain('validation failed');
      expect(script).toContain('validation passed');
    });
  });

  describe('pre-push 훅', () => {
    it('pre-push 스크립트를 생성한다', () => {
      const script = generateHookScript('pre-push');

      expect(script).toContain('#!/bin/sh');
      expect(script).toContain('husky.sh');
      expect(script).toContain('npx sdd validate --strict');
    });

    it('strict 모드로 검증한다', () => {
      const script = generateHookScript('pre-push');

      expect(script).toContain('sdd validate --strict');
    });

    it('Constitution 검증을 포함한다', () => {
      const script = generateHookScript('pre-push');

      expect(script).toContain('npx sdd constitution validate');
      expect(script).toContain('Validating constitution');
    });

    it('검증 실패 시 종료 코드를 체크한다', () => {
      const script = generateHookScript('pre-push');

      expect(script).toContain('if [ $? -ne 0 ]');
      expect(script).toContain('exit 1');
    });

    it('모든 검증 통과 메시지를 포함한다', () => {
      const script = generateHookScript('pre-push');

      expect(script).toContain('All validations passed');
    });
  });

  describe('commit-msg 훅', () => {
    it('commit-msg 스크립트를 생성한다', () => {
      const script = generateHookScript('commit-msg');

      expect(script).toContain('#!/bin/sh');
      expect(script).toContain('husky.sh');
      expect(script).toContain('COMMIT_MSG=$(cat "$1")');
    });

    it('커밋 메시지 형식을 확인한다', () => {
      const script = generateHookScript('commit-msg');

      expect(script).toContain('feat|fix|docs|chore');
      expect(script).toContain('Commit message format is valid');
    });

    it('스펙 참조가 없어도 경고만 한다', () => {
      const script = generateHookScript('commit-msg');

      expect(script).toContain("doesn't reference a spec");
      expect(script).toContain('Consider using');
      // exit 1이 없어야 함 (경고만)
      expect(script).not.toContain('exit 1');
    });
  });

  describe('알 수 없는 훅 타입', () => {
    it('기본 스크립트를 반환한다', () => {
      // @ts-expect-error - 테스트를 위해 잘못된 타입 전달
      const script = generateHookScript('unknown');

      expect(script).toContain('#!/bin/sh');
      expect(script).toContain('exit 0');
    });
  });
});
