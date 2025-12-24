/**
 * 준비 보고서 생성기
 * prepare.md 파일 생성
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrepareReport, ToolCheckResult } from './schemas.js';
import { GeneratedAgent } from './agent-generator.js';
import { GeneratedSkill } from './skill-generator.js';

/**
 * 보고서 생성 입력
 */
export interface PrepareReportInput {
  feature: string;
  totalTasks: number;
  agentChecks: ToolCheckResult[];
  skillChecks: ToolCheckResult[];
  generatedAgents: GeneratedAgent[];
  generatedSkills: GeneratedSkill[];
}

/**
 * 준비 보고서 생성기 클래스
 */
export class PrepareReportGenerator {
  private sddDir: string;

  constructor(projectRoot: string) {
    this.sddDir = path.join(projectRoot, '.sdd');
  }

  /**
   * 보고서 생성
   */
  generate(input: PrepareReportInput): PrepareReport {
    const agentMissing = input.agentChecks.filter(c => c.status === 'missing').length;
    const agentExisting = input.agentChecks.filter(c => c.status === 'exists').length;
    const skillMissing = input.skillChecks.filter(c => c.status === 'missing').length;
    const skillExisting = input.skillChecks.filter(c => c.status === 'exists').length;

    return {
      feature: input.feature,
      totalTasks: input.totalTasks,
      agents: {
        required: input.agentChecks.length,
        existing: agentExisting,
        missing: agentMissing,
        checks: input.agentChecks,
      },
      skills: {
        required: input.skillChecks.length,
        existing: skillExisting,
        missing: skillMissing,
        checks: input.skillChecks,
      },
      proposals: [
        ...input.generatedAgents.map(a => ({
          type: 'agent' as const,
          name: a.name,
          filePath: a.filePath,
          content: a.content,
        })),
        ...input.generatedSkills.map(s => ({
          type: 'skill' as const,
          name: s.name,
          filePath: s.filePath,
          content: s.content,
        })),
      ],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 마크다운 보고서 생성
   */
  toMarkdown(report: PrepareReport): string {
    const lines: string[] = [];

    // 헤더
    lines.push(`# Prepare: ${report.feature}`);
    lines.push('');
    lines.push(`> 생성일: ${report.createdAt.split('T')[0]}`);
    lines.push('');

    // 분석 요약
    lines.push('## 분석 요약');
    lines.push('');
    lines.push(`- 총 작업 수: ${report.totalTasks}개`);
    lines.push(`- 필요 서브에이전트: ${report.agents.required}개 (존재: ${report.agents.existing}, 누락: ${report.agents.missing})`);
    lines.push(`- 필요 스킬: ${report.skills.required}개 (존재: ${report.skills.existing}, 누락: ${report.skills.missing})`);
    lines.push('');

    // 서브에이전트 점검
    if (report.agents.checks.length > 0) {
      lines.push('## 서브에이전트 점검');
      lines.push('');
      lines.push('> 위치: `.claude/agents/`');
      lines.push('');
      lines.push('| 에이전트 | 설명 | 상태 | 조치 |');
      lines.push('|----------|------|------|------|');
      for (const check of report.agents.checks) {
        const status = check.status === 'exists' ? '✅ 존재' : '❌ 없음';
        lines.push(`| ${check.tool.name} | ${check.tool.description} | ${status} | ${check.action} |`);
      }
      lines.push('');
    }

    // 스킬 점검
    if (report.skills.checks.length > 0) {
      lines.push('## 스킬 점검');
      lines.push('');
      lines.push('> 위치: `.claude/skills/<name>/SKILL.md`');
      lines.push('');
      lines.push('| 스킬 | 설명 | 상태 | 조치 |');
      lines.push('|------|------|------|------|');
      for (const check of report.skills.checks) {
        const status = check.status === 'exists' ? '✅ 존재' : '❌ 없음';
        lines.push(`| ${check.tool.name} | ${check.tool.description} | ${status} | ${check.action} |`);
      }
      lines.push('');
    }

    // 추가/수정 제안
    const proposals = report.proposals.filter(p => p.content);
    if (proposals.length > 0) {
      lines.push('## 추가/수정 제안');
      lines.push('');

      for (const proposal of proposals) {
        const typeLabel = proposal.type === 'agent' ? '서브에이전트' : '스킬';
        lines.push(`### 새 ${typeLabel}: ${proposal.name}`);
        lines.push('');
        lines.push(`**파일:** \`${proposal.filePath}\``);
        lines.push('');
        lines.push('```markdown');
        lines.push(proposal.content);
        lines.push('```');
        lines.push('');
      }
    }

    // 승인 대기
    const pendingApprovals = report.proposals.filter(p => p.content);
    if (pendingApprovals.length > 0) {
      lines.push('## 승인 대기');
      lines.push('');
      for (const proposal of pendingApprovals) {
        const typeLabel = proposal.type === 'agent' ? '서브에이전트' : '스킬';
        lines.push(`- [ ] ${proposal.name} ${typeLabel} 추가 → \`${proposal.filePath}\``);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 보고서 파일 저장
   */
  async writeReport(feature: string, report: PrepareReport): Promise<string> {
    const featureDir = path.join(this.sddDir, 'specs', feature);

    if (!fs.existsSync(featureDir)) {
      fs.mkdirSync(featureDir, { recursive: true });
    }

    const filePath = path.join(featureDir, 'prepare.md');
    const content = this.toMarkdown(report);

    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }
}
