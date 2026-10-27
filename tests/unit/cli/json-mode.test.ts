/**
 * createProgram() preAction 훅의 JSON 모드 전환 테스트
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createProgram, isJsonOutput } from '../../../src/cli/index.js';
import { isJsonMode, setJsonMode } from '../../../src/utils/logger.js';

/**
 * Run a probe command attached to the real program and capture the logger JSON mode
 */
async function probe(argv: string[]): Promise<boolean> {
  const program = createProgram();
  let captured: boolean | undefined;

  const parent = program.command('probe-parent').option('--json');
  parent
    .command('child')
    .option('-f, --format <format>')
    .option('-o, --output <path>')
    .action(() => {
      captured = isJsonMode();
    });
  program
    .command('probe')
    .option('--json')
    .option('-f, --format <format>')
    .option('-o, --output <path>')
    .action(() => {
      captured = isJsonMode();
    });

  await program.parseAsync(['node', 'sdd', ...argv]);
  if (captured === undefined) {
    throw new Error('probe action did not run');
  }
  return captured;
}

describe('createProgram JSON 모드 훅', () => {
  afterEach(() => {
    setJsonMode(false);
  });

  it('--json이면 JSON 모드를 켠다', async () => {
    expect(await probe(['probe', '--json'])).toBe(true);
  });

  it('옵션이 없으면 JSON 모드를 끈다', async () => {
    setJsonMode(true);
    expect(await probe(['probe'])).toBe(false);
  });

  it('부모 명령어의 --json도 인식한다 (optsWithGlobals)', async () => {
    expect(await probe(['probe-parent', '--json', 'child'])).toBe(true);
  });

  it('--format json을 stdout으로 출력하면 JSON 모드를 켠다', async () => {
    expect(await probe(['probe', '--format', 'json'])).toBe(true);
  });

  it('--format json이라도 --output으로 파일에 쓰면 JSON 모드가 아니다', async () => {
    expect(await probe(['probe', '--format', 'json', '-o', 'out.json'])).toBe(false);
  });

  it('isJsonOutput 판정 규칙', () => {
    expect(isJsonOutput({ json: true })).toBe(true);
    expect(isJsonOutput({ format: 'html' })).toBe(false);
    expect(isJsonOutput({ format: 'json', output: 'x.json' })).toBe(false);
  });
});
