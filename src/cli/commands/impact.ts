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
  parseDeltaFromProposal,
  resolveDeltaSourcePath,
  runSimulation,
  formatSimulationResult,
  analyzeCodeImpact,
  formatCodeImpactResult,
  type ImpactAnalysisResult,
  type ImpactReport,
  type ChangeImpactAnalysis,
  type SimulationResult,
  type CodeImpactResult,
} from '../../core/impact/index.js';
import { findSddRoot } from '../../utils/fs.js';
import { listSpecsUnder, resolveSpecIn } from '../../core/spec/locator.js';
import { isSafePathSegment } from '../../utils/path.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 영향도 분석 옵션
 */
export interface ImpactOptions {
  graph?: boolean;
  code?: boolean;
  json?: boolean;
}

/**
 * 리포트 옵션
 */
export interface ReportOptions {
  json?: boolean;
}

/**
 * 시뮬레이션 옵션
 */
export interface SimulateOptions {
  json?: boolean;
}

/**
 * 제안서 경로 해석 (테스트 가능)
 * Returns null when a relative path is not a single safe segment under changes/.
 */
export function resolveProposalPath(proposalPath: string, sddPath: string): string | null {
  if (path.isAbsolute(proposalPath)) {
    return proposalPath;
  }

  if (!isSafePathSegment(proposalPath)) {
    return null;
  }

  // 상대 경로인 경우 changes/ 디렉토리에서 찾기
  const changesPath = path.join(sddPath, 'changes', proposalPath);
  if (proposalPath.endsWith('.md')) {
    return changesPath;
  }
  return path.join(changesPath, 'proposal.md');
}

/**
 * 영향도 분석 실행 (테스트 가능)
 */
export async function executeImpactAnalysis(
  sddPath: string,
  feature: string
): Promise<Result<ImpactAnalysisResult, Error>> {
  const result = await analyzeImpact(sddPath, feature);
  if (!result.success) {
    return failure(result.error);
  }
  return success(result.data);
}

/**
 * 의존성 그래프 생성 (테스트 가능)
 */
export async function executeGraphAnalysis(
  specsPath: string,
  feature?: string,
  asJson = false
): Promise<Result<{
  mermaid: string;
  nodes?: unknown[];
  edges?: unknown[];
  dangling: Array<{ from: string; to: string }>;
}, Error>> {
  // 강조할 스펙 참조를 canonical id로 해석
  let highlight: string | undefined;
  if (feature) {
    const resolved = resolveSpecIn(await listSpecsUnder(specsPath), feature);
    if (!resolved.success) {
      return failure(resolved.error);
    }
    highlight = resolved.data.id;
  }

  const graphResult = await buildDependencyGraph(specsPath);
  if (!graphResult.success) {
    return failure(graphResult.error);
  }

  const mermaid = generateMermaidGraph(graphResult.data, highlight);
  const dangling = graphResult.data.dangling ?? [];

  if (asJson) {
    return success({
      mermaid,
      nodes: Array.from(graphResult.data.nodes.values()),
      edges: graphResult.data.edges,
      dangling,
    });
  }

  return success({ mermaid, dangling });
}

/**
 * 코드 영향도 분석 실행 (테스트 가능)
 */
export async function executeCodeImpactAnalysis(
  projectRoot: string,
  sddPath: string,
  feature: string
): Promise<Result<CodeImpactResult, Error>> {
  const result = await analyzeCodeImpact(projectRoot, sddPath, feature);
  if (!result.success) {
    return failure(result.error);
  }
  return success(result.data);
}

/**
 * 영향도 리포트 생성 실행 (테스트 가능)
 */
export async function executeImpactReport(
  sddPath: string
): Promise<Result<ImpactReport, Error>> {
  const result = await generateImpactReport(sddPath);
  if (!result.success) {
    return failure(result.error);
  }
  return success(result.data);
}

/**
 * 변경 영향 분석 실행 (테스트 가능)
 */
export async function executeChangeImpact(
  sddPath: string,
  changeId: string
): Promise<Result<ChangeImpactAnalysis, Error>> {
  const result = await analyzeChangeImpact(sddPath, changeId);
  if (!result.success) {
    return failure(result.error);
  }
  return success(result.data);
}

/**
 * 변경 영향 결과 포맷 (테스트 가능)
 */
export function formatChangeImpactOutput(data: ChangeImpactAnalysis): string {
  const lines: string[] = [];

  lines.push(`📊 변경 영향 분석: ${data.changeId}`);
  if (data.title) {
    lines.push(`제목: ${data.title}`);
  }
  lines.push(`상태: ${data.status}`);
  lines.push('');

  if (data.affectedSpecs.length > 0) {
    lines.push('⚠️  직접 영향 받는 스펙:');
    for (const spec of data.affectedSpecs) {
      lines.push(`  - ${spec.id} - ${spec.reason}`);
    }
    lines.push('');
  }

  if (data.transitiveAffected.length > 0) {
    lines.push('🔄 간접 영향 받는 스펙:');
    for (const spec of data.transitiveAffected) {
      lines.push(`  - ${spec.id} (${spec.reason})`);
    }
    lines.push('');
  }

  const riskIcon = data.riskLevel === 'high' ? '🔴' : data.riskLevel === 'medium' ? '🟡' : '🟢';
  lines.push(`총 영향 범위: ${data.totalImpact}개 스펙 ${riskIcon}`);
  lines.push('');

  if (data.recommendations.length > 0) {
    lines.push('💡 권장사항:');
    for (const rec of data.recommendations) {
      lines.push(`  - ${rec}`);
    }
  }

  return lines.join('\n');
}

/**
 * What-if 시뮬레이션 실행 (테스트 가능)
 */
export async function executeSimulation(
  specsPath: string,
  feature: string,
  proposalPath: string
): Promise<Result<{ deltas: unknown[]; result: SimulationResult }, Error>> {
  // delta.md next to proposal.md holds the delta; proposal.md is the legacy source
  const deltaResult = await parseDeltaFromProposal(await resolveDeltaSourcePath(proposalPath));
  if (!deltaResult.success) {
    return failure(deltaResult.error);
  }

  const deltas = deltaResult.data;
  if (deltas.length === 0) {
    return failure(new Error('변경 제안에서 델타를 찾을 수 없습니다.'));
  }

  const simResult = await runSimulation(specsPath, feature, deltas);
  if (!simResult.success) {
    return failure(simResult.error);
  }

  // Report the deltas actually applied (resolved, unresolvable heading targets dropped)
  return success({ deltas: simResult.data.deltas ?? deltas, result: simResult.data });
}

/**
 * impact 명령어 등록
 */
export function registerImpactCommand(program: Command): void {
  const impact = program
    .command('impact [feature]')
    .description('스펙 변경의 영향도를 분석합니다')
    .option('-g, --graph', '의존성 그래프 출력 (Mermaid)')
    .option('-c, --code', '코드 영향도 분석')
    .option('--json', 'JSON 형식 출력')
    .action(async (feature: string | undefined, options: ImpactOptions) => {
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
    .action(async (_options: ReportOptions, cmd: Command) => {
      try {
        // The parent `impact` also declares --json and commander hands it the flag,
        // so subcommands read the merged local + parent options.
        await runImpactReport(cmd.optsWithGlobals<ReportOptions>());
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
    .action(async (id: string, _options: ReportOptions, cmd: Command) => {
      try {
        await runChangeImpact(id, cmd.optsWithGlobals<ReportOptions>());
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // simulate 서브커맨드
  impact
    .command('simulate <feature> <proposal>')
    .description('변경 제안을 시뮬레이션하여 영향도를 예측합니다')
    .option('--json', 'JSON 형식 출력')
    .action(async (feature: string, proposal: string, _options: SimulateOptions, cmd: Command) => {
      try {
        await runSimulate(feature, proposal, cmd.optsWithGlobals<SimulateOptions>());
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 영향도 분석 실행 (CLI 래퍼)
 */
async function runImpact(
  feature: string | undefined,
  options: ImpactOptions
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const specsPath = path.join(sddPath, 'specs');

  // 그래프 모드
  if (options.graph) {
    const graphResult = await executeGraphAnalysis(specsPath, feature, options.json);
    if (!graphResult.success) {
      logger.error(graphResult.error.message);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    if (options.json) {
      console.log(JSON.stringify({
        format: 'mermaid',
        content: graphResult.data.mermaid,
        nodes: graphResult.data.nodes,
        edges: graphResult.data.edges,
        dangling: graphResult.data.dangling,
      }, null, 2));
    } else {
      logger.info('의존성 그래프 (Mermaid):');
      logger.newline();
      console.log('```mermaid');
      console.log(graphResult.data.mermaid);
      console.log('```');
      if (graphResult.data.dangling.length > 0) {
        logger.newline();
        logger.warn('해석되지 않는 의존성 (존재하지 않는 스펙):');
        for (const d of graphResult.data.dangling) {
          logger.listItem(`${d.from} → ${d.to}`, 1);
        }
      }
    }
    return;
  }

  // 코드 영향도 분석 모드
  if (options.code) {
    if (!feature) {
      logger.error('분석할 기능을 지정하세요.');
      logger.info('사용법: sdd impact <feature> --code');
      logger.info('예시: sdd impact auth --code');
      process.exit(ExitCode.GENERAL_ERROR);
    }

    if (!options.json) {
      logger.info(`💻 코드 영향도 분석: ${feature}`);
      logger.newline();
    }

    const codeResult = await executeCodeImpactAnalysis(projectRoot, sddPath, feature);
    if (!codeResult.success) {
      logger.error(codeResult.error.message);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    if (options.json) {
      console.log(JSON.stringify(codeResult.data, null, 2));
    } else {
      console.log(formatCodeImpactResult(codeResult.data));
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

  const result = await executeImpactAnalysis(sddPath, feature);
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
 * 영향도 리포트 생성 (CLI 래퍼)
 */
async function runImpactReport(options: ReportOptions): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const result = await executeImpactReport(sddPath);

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
 * 변경 제안 영향 분석 (CLI 래퍼)
 */
async function runChangeImpact(changeId: string, options: ReportOptions): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const result = await executeChangeImpact(sddPath, changeId);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(formatChangeImpactOutput(result.data));
  }
}

/**
 * What-if 시뮬레이션 실행 (CLI 래퍼)
 */
async function runSimulate(
  feature: string,
  proposalPath: string,
  options: SimulateOptions
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const specsPath = path.join(sddPath, 'specs');
  const fullProposalPath = resolveProposalPath(proposalPath, sddPath);
  if (!fullProposalPath) {
    logger.error(
      `유효하지 않은 제안서 경로입니다: ${proposalPath} (changes/ 아래의 이름 또는 절대 경로만 허용됩니다)`
    );
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = await executeSimulation(specsPath, feature, fullProposalPath);
  if (!result.success) {
    logger.error(result.error.message);
    if (result.error.message.includes('델타를 찾을 수 없습니다')) {
      logger.error('delta.md의 ADDED, MODIFIED, REMOVED 섹션을 확인하세요.');
    }
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const { deltas, result: simResult } = result.data;

  // JSON mode: stdout carries only the JSON document
  if (options.json) {
    console.log(JSON.stringify({ ...simResult, deltas }, null, 2));
    return;
  }

  logger.info(`📊 What-if 시뮬레이션`);
  logger.info(`대상 스펙: ${feature}`);
  logger.info(`변경 제안: ${fullProposalPath}`);
  logger.newline();
  logger.info(`감지된 변경: ${deltas.length}건`);
  for (const delta of deltas as Array<{ type: string; specId: string }>) {
    const icon = delta.type === 'ADDED' ? '➕' : delta.type === 'REMOVED' ? '➖' : '✏️';
    logger.listItem(`${icon} ${delta.type}: ${delta.specId}`, 1);
  }
  logger.newline();
  console.log(formatSimulationResult(simResult, feature));
}
