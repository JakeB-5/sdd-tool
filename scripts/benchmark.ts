#!/usr/bin/env npx tsx
/**
 * SDD 벤치마크 스크립트
 *
 * 사용법: npx tsx scripts/benchmark.ts
 */
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

const SPEC_COUNT = 1000;
const ITERATIONS = 5;

interface BenchmarkResult {
  command: string;
  iterations: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  withCache?: number;
  withoutCache?: number;
}

/**
 * 테스트용 스펙 파일 생성
 */
async function generateSpecs(dir: string, count: number): Promise<void> {
  const specsDir = path.join(dir, '.sdd', 'specs');
  await fs.mkdir(specsDir, { recursive: true });

  console.log(`📝 ${count}개 스펙 파일 생성 중...`);

  for (let i = 0; i < count; i++) {
    const specDir = path.join(specsDir, `spec-${i.toString().padStart(4, '0')}`);
    await fs.mkdir(specDir, { recursive: true });

    const specContent = `# Spec: feature-${i}
version: 1.0.0

## 요구사항

### REQ-${i}-001: 기능 ${i} 요구사항 A
사용자는 기능 ${i}의 A 동작을 수행할 수 있어야 한다.

#### 시나리오
- GIVEN 사용자가 로그인한 상태일 때
- WHEN 기능 ${i}를 실행하면
- THEN 결과 A가 반환된다

### REQ-${i}-002: 기능 ${i} 요구사항 B
시스템은 기능 ${i}의 B 동작을 지원해야 한다.

## 도메인 참조
- @domain/core
- @domain/utils
`;

    await fs.writeFile(path.join(specDir, 'spec.md'), specContent, 'utf-8');

    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/${count} 완료`);
    }
  }
}

/**
 * 명령어 벤치마크 실행
 */
function benchmark(cmd: string, cwd: string, iterations: number): BenchmarkResult {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      execSync(cmd, { cwd, stdio: 'pipe' });
    } catch {
      // 검증 실패는 무시 (시간 측정 목적)
    }
    const end = performance.now();
    times.push(end - start);
  }

  return {
    command: cmd,
    iterations,
    avgMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
  };
}

/**
 * 메인 벤치마크 실행
 */
async function main(): Promise<void> {
  console.log('🚀 SDD 벤치마크 시작\n');
  console.log(`OS: ${os.platform()} ${os.release()}`);
  console.log(`Node: ${process.version}`);
  console.log(`CPU: ${os.cpus()[0].model}`);
  console.log(`Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB\n`);

  // 임시 디렉토리 생성
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-benchmark-'));
  console.log(`📁 임시 디렉토리: ${tempDir}\n`);

  try {
    // SDD 초기화
    const binPath = path.resolve(process.cwd(), 'bin/sdd.js');
    execSync(`node "${binPath}" init`, { cwd: tempDir, stdio: 'pipe' });

    // 스펙 생성
    await generateSpecs(tempDir, SPEC_COUNT);

    console.log(`\n⏱️  벤치마크 실행 (${ITERATIONS}회 반복)\n`);

    const results: BenchmarkResult[] = [];

    // validate 벤치마크
    console.log('1. sdd validate');
    const validateResult = benchmark(`node "${binPath}" validate`, tempDir, ITERATIONS);
    results.push(validateResult);
    console.log(`   평균: ${validateResult.avgMs.toFixed(0)}ms (min: ${validateResult.minMs.toFixed(0)}ms, max: ${validateResult.maxMs.toFixed(0)}ms)`);

    // list 벤치마크
    console.log('2. sdd list');
    const listResult = benchmark(`node "${binPath}" list`, tempDir, ITERATIONS);
    results.push(listResult);
    console.log(`   평균: ${listResult.avgMs.toFixed(0)}ms`);

    // 결과 요약
    console.log('\n📊 벤치마크 결과 요약');
    console.log('='.repeat(50));
    console.log(`스펙 수: ${SPEC_COUNT}`);
    console.log(`반복 횟수: ${ITERATIONS}`);
    console.log('-'.repeat(50));

    for (const r of results) {
      console.log(`${r.command.split(' ').pop()}: ${r.avgMs.toFixed(0)}ms (±${((r.maxMs - r.minMs) / 2).toFixed(0)}ms)`);
    }

    // JSON 결과 저장
    const resultPath = path.join(process.cwd(), 'benchmark-result.json');
    await fs.writeFile(
      resultPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        system: { os: os.platform(), node: process.version },
        config: { specCount: SPEC_COUNT, iterations: ITERATIONS },
        results,
      }, null, 2)
    );
    console.log(`\n💾 결과 저장: ${resultPath}`);

  } finally {
    // 정리
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('\n✅ 벤치마크 완료');
  }
}

main().catch(console.error);
