/**
 * cicd 명령어 핵심 로직 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import {
  registerCicdCommand,
  generateGitHubWorkflow,
  generateGitLabCI,
  generateHookScript,
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
