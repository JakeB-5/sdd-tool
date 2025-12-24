/**
 * Sync 모듈 - 스펙-코드 동기화 검증
 */
export * from './schemas.js';
export { SpecParser } from './spec-parser.js';
export { CodeScanner } from './code-scanner.js';
export { TestScanner } from './test-scanner.js';
export { SyncMatcher } from './matcher.js';
export { SyncReporter } from './reporter.js';

import { SpecParser } from './spec-parser.js';
import { CodeScanner } from './code-scanner.js';
import { TestScanner } from './test-scanner.js';
import { SyncMatcher } from './matcher.js';
import { SyncReporter } from './reporter.js';
import type { SyncResult, SyncOptions } from './schemas.js';

/**
 * 동기화 검증 실행
 */
export async function executeSync(
  projectRoot: string,
  options: SyncOptions = {}
): Promise<{
  success: boolean;
  data?: {
    result: SyncResult;
    output: string;
  };
  error?: Error;
}> {
  try {
    // 1. 스펙에서 요구사항 추출
    const specParser = new SpecParser(projectRoot);

    let requirements;
    if (options.specId) {
      requirements = await specParser.parseSpec(options.specId);
    } else {
      requirements = await specParser.parseAllSpecs();
    }

    if (requirements.length === 0) {
      return {
        success: true,
        data: {
          result: {
            specs: [],
            requirements: [],
            syncRate: 100,
            implemented: [],
            missing: [],
            orphans: [],
            totalRequirements: 0,
            totalImplemented: 0,
          },
          output: '스펙에 요구사항이 없습니다.',
        },
      };
    }

    // 2. 소스 코드 스캔
    const codeScanner = new CodeScanner(projectRoot, {
      srcDir: options.srcDir,
      include: options.include,
      exclude: options.exclude,
    });
    const codeRefs = await codeScanner.scan();

    // 3. 테스트 파일 스캔
    const testScanner = new TestScanner(projectRoot);
    const testRefs = await testScanner.scan();

    // 4. 매칭
    const matcher = new SyncMatcher();
    const result = matcher.match(requirements, codeRefs, testRefs);

    // 5. 출력 생성
    const reporter = new SyncReporter({ colors: !options.json && !options.markdown });
    let output: string;

    if (options.json) {
      output = reporter.formatJson(result);
    } else if (options.markdown) {
      output = reporter.formatMarkdown(result);
    } else {
      output = reporter.formatTerminal(result);
    }

    // 6. CI 모드 체크
    if (options.ci) {
      const threshold = options.threshold ?? 100;
      if (result.syncRate < threshold) {
        return {
          success: false,
          data: { result, output },
          error: new Error(
            `동기화율 ${result.syncRate}%가 임계값 ${threshold}% 미만입니다.`
          ),
        };
      }
    }

    return {
      success: true,
      data: { result, output },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
