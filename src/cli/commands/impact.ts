/**
 * sdd impact 명령어
 *
 * 스펙 간 영향도를 분석합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import {
  analyzeImpact,
  formatImpactResult,
  buildDependencyGraph,
  generateMermaidGraph,
  generateImpactReport,
  formatImpactReport,
  analyzeChangeImpact,
} from '../../core/impact/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';

/**
 * impact 명령어 등록
 */
export function registerImpactCommand(program: Command): void {
  const impact = program
    .command('impact [feature]')
    .description('스펙 변경의 영향도를 분석합니다')
    .option('-g, --graph', '의존성 그래프 출력 (Mermaid)')
    .option('-r, --reverse', '역방향 영향도 분석')
    .option('--json', 'JSON 형식 출력')
    .action(async (feature: string | undefined, options: {
      graph?: boolean;
      reverse?: boolean;
      json?: boolean;
    }) => {
      try {
        await runImpact(feature, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // report 서브커맨드
  impact
    .command('report')
    .description('전체 프로젝트 의존성 리포트 생성')
    .option('--json', 'JSON 형식 출력')
    .action(async (options: { json?: boolean }) => {
      try {
        await runImpactReport(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // change 서브커맨드
  impact
    .command('change <id>')
    .description('변경 제안의 영향도를 분석합니다')
    .option('--json', 'JSON 형식 출력')
    .action(async (id: string, options: { json?: boolean }) => {
      try {
        await runChangeImpact(id, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 영향도 분석 실행
 */
async function runImpact(
  feature: string | undefined,
  options: { graph?: boolean; reverse?: boolean; json?: boolean }
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');

  // 그래프 모드
  if (options.graph) {
    const graphResult = await buildDependencyGraph(path.join(sddPath, 'specs'));
    if (!graphResult.success) {
      logger.error(graphResult.error.message);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    const mermaid = generateMermaidGraph(graphResult.data, feature);

    if (options.json) {
      console.log(JSON.stringify({
        format: 'mermaid',
        content: mermaid,
        nodes: Array.from(graphResult.data.nodes.values()),
        edges: graphResult.data.edges,
      }, null, 2));
    } else {
      logger.info('의존성 그래프 (Mermaid):');
      logger.newline();
      console.log('```mermaid');
      console.log(mermaid);
      console.log('```');
    }
    return;
  }

  // 특정 기능 영향도 분석
  if (!feature) {
    logger.error('분석할 기능을 지정하세요.');
    logger.info('사용법: sdd impact <feature>');
    logger.info('예시: sdd impact auth');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = await analyzeImpact(sddPath, feature);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(formatImpactResult(result.data));
  }
}

/**
 * 영향도 리포트 생성
 */
async function runImpactReport(options: { json?: boolean }): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const result = await generateImpactReport(sddPath);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(formatImpactReport(result.data));
  }
}

/**
 * 변경 제안 영향 분석
 */
async function runChangeImpact(changeId: string, options: { json?: boolean }): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const result = await analyzeChangeImpact(sddPath, changeId);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    const data = result.data;
    logger.info(`📊 변경 영향 분석: ${data.changeId}`);
    if (data.title) {
      logger.info(`제목: ${data.title}`);
    }
    logger.info(`상태: ${data.status}`);
    logger.newline();

    if (data.affectedSpecs.length > 0) {
      logger.info('⚠️  직접 영향 받는 스펙:');
      for (const spec of data.affectedSpecs) {
        logger.listItem(`${spec.id} - ${spec.reason}`, 1);
      }
      logger.newline();
    }

    if (data.transitiveAffected.length > 0) {
      logger.info('🔄 간접 영향 받는 스펙:');
      for (const spec of data.transitiveAffected) {
        logger.listItem(`${spec.id} (${spec.reason})`, 1);
      }
      logger.newline();
    }

    const riskIcon = data.riskLevel === 'high' ? '🔴' : data.riskLevel === 'medium' ? '🟡' : '🟢';
    logger.info(`총 영향 범위: ${data.totalImpact}개 스펙 ${riskIcon}`);
    logger.newline();

    if (data.recommendations.length > 0) {
      logger.info('💡 권장사항:');
      for (const rec of data.recommendations) {
        logger.listItem(rec, 1);
      }
    }
  }
}
