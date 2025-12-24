/**
 * prepare 명령어
 *
 * 구현 전 필요한 서브에이전트와 스킬을 점검합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import {
  DocumentAnalyzer,
  ToolDetector,
  AgentScanner,
  SkillScanner,
  AgentGenerator,
  SkillGenerator,
  PrepareReportGenerator,
  ToolCheckResult,
  PrepareReport,
} from '../../core/prepare/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';
import { GeneratedAgent } from '../../core/prepare/agent-generator.js';
import { GeneratedSkill } from '../../core/prepare/skill-generator.js';

/**
 * prepare 실행 옵션
 */
export interface PrepareOptions {
  dryRun?: boolean;
  autoApprove?: boolean;
  json?: boolean;
}

/**
 * prepare 실행 결과
 */
export interface PrepareCommandResult {
  report: PrepareReport;
  reportPath?: string;
  created: {
    agents: string[];
    skills: string[];
  };
}

/**
 * prepare 핵심 로직 (테스트 가능)
 */
export async function executePrepare(
  feature: string,
  options: PrepareOptions,
  projectRoot: string
): Promise<Result<PrepareCommandResult, Error>> {
  try {
    // 1. 문서 분석
    const docAnalyzer = new DocumentAnalyzer(projectRoot);
    const analyses = await docAnalyzer.analyzeFeature(feature);

    if (analyses.length === 0) {
      return failure(new Error(`기능 '${feature}'의 문서를 찾을 수 없습니다.`));
    }

    // 2. 도구 감지
    const toolDetector = new ToolDetector();
    const detected = toolDetector.detect(analyses);

    // 3. 에이전트 스캔
    const agentScanner = new AgentScanner(projectRoot);
    const existingAgents = await agentScanner.scanAll();
    const existingAgentNames = new Set(existingAgents.map(a => a.name));

    // 4. 스킬 스캔
    const skillScanner = new SkillScanner(projectRoot);
    const existingSkills = await skillScanner.scanAll();
    const existingSkillNames = new Set(existingSkills.map(s => s.name));

    // 5. 에이전트 점검
    const agentChecks: ToolCheckResult[] = detected.agents.map(agent => ({
      tool: agent,
      status: existingAgentNames.has(agent.name) ? 'exists' : 'missing',
      filePath: agentScanner.getAgentFilePath(agent.name),
      action: existingAgentNames.has(agent.name) ? '-' : '추가 필요',
    }));

    // 6. 스킬 점검
    const skillChecks: ToolCheckResult[] = detected.skills.map(skill => ({
      tool: skill,
      status: existingSkillNames.has(skill.name) ? 'exists' : 'missing',
      filePath: skillScanner.getSkillFilePath(skill.name),
      action: existingSkillNames.has(skill.name) ? '-' : '추가 필요',
    }));

    // 7. 누락된 도구에 대한 초안 생성
    const agentGenerator = new AgentGenerator(projectRoot);
    const skillGenerator = new SkillGenerator(projectRoot);

    const generatedAgents: GeneratedAgent[] = [];
    const generatedSkills: GeneratedSkill[] = [];

    for (const check of agentChecks) {
      if (check.status === 'missing') {
        generatedAgents.push(agentGenerator.generate(check.tool));
      }
    }

    for (const check of skillChecks) {
      if (check.status === 'missing') {
        generatedSkills.push(skillGenerator.generate(check.tool));
      }
    }

    // 8. 보고서 생성
    const reportGenerator = new PrepareReportGenerator(projectRoot);
    const totalTasks = DocumentAnalyzer.getTotalTaskCount(analyses);

    const report = reportGenerator.generate({
      feature,
      totalTasks,
      agentChecks,
      skillChecks,
      generatedAgents,
      generatedSkills,
    });

    const result: PrepareCommandResult = {
      report,
      created: {
        agents: [],
        skills: [],
      },
    };

    // 9. dry-run이 아니면 보고서 저장
    if (!options.dryRun) {
      result.reportPath = await reportGenerator.writeReport(feature, report);

      // auto-approve면 파일 생성
      if (options.autoApprove) {
        for (const agent of generatedAgents) {
          await agentGenerator.writeAgent(agent);
          result.created.agents.push(agent.filePath);
        }

        for (const skill of generatedSkills) {
          await skillGenerator.writeSkill(skill);
          result.created.skills.push(skill.filePath);
        }
      }
    }

    return success(result);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * prepare 명령어 등록
 */
export function registerPrepareCommand(program: Command): void {
  program
    .command('prepare <feature>')
    .description('구현 전 필요한 서브에이전트와 스킬을 점검합니다')
    .option('--dry-run', '변경 없이 분석 결과만 출력')
    .option('--auto-approve', '누락된 도구를 자동으로 생성')
    .option('--json', 'JSON 형식 출력')
    .action(async (feature: string, options: PrepareOptions) => {
      try {
        await runPrepare(feature, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * prepare CLI 실행 (출력 및 종료 처리)
 */
async function runPrepare(feature: string, options: PrepareOptions): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.info(`기능 '${feature}' 준비 점검 중...`);
  logger.newline();

  const result = await executePrepare(feature, options, projectRoot);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const { report, reportPath, created } = result.data;

  // JSON 출력
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // 요약 출력
  logger.success('분석 완료');
  logger.newline();

  console.log(`총 작업 수: ${report.totalTasks}개`);
  console.log(`서브에이전트: ${report.agents.required}개 필요 (존재: ${report.agents.existing}, 누락: ${report.agents.missing})`);
  console.log(`스킬: ${report.skills.required}개 필요 (존재: ${report.skills.existing}, 누락: ${report.skills.missing})`);
  logger.newline();

  // 누락된 항목 출력
  const missingAgents = report.agents.checks.filter(c => c.status === 'missing');
  const missingSkills = report.skills.checks.filter(c => c.status === 'missing');

  if (missingAgents.length > 0) {
    logger.warn('누락된 서브에이전트:');
    for (const check of missingAgents) {
      console.log(`  - ${check.tool.name}: ${check.tool.description}`);
    }
    logger.newline();
  }

  if (missingSkills.length > 0) {
    logger.warn('누락된 스킬:');
    for (const check of missingSkills) {
      console.log(`  - ${check.tool.name}: ${check.tool.description}`);
    }
    logger.newline();
  }

  // 생성된 파일 출력
  if (created.agents.length > 0 || created.skills.length > 0) {
    logger.success('생성된 파일:');
    for (const file of [...created.agents, ...created.skills]) {
      console.log(`  - ${path.relative(projectRoot, file)}`);
    }
    logger.newline();
  }

  // 보고서 경로 출력
  if (reportPath) {
    logger.info(`보고서: ${path.relative(projectRoot, reportPath)}`);
  }

  // 다음 단계 안내
  if (missingAgents.length > 0 || missingSkills.length > 0) {
    if (!options.autoApprove && !options.dryRun) {
      logger.newline();
      logger.info('누락된 도구를 자동 생성하려면: sdd prepare ' + feature + ' --auto-approve');
    }
  }
}
