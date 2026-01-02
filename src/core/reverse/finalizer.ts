/**
 * 스펙 확정 모듈
 *
 * 승인된 스펙을 정식 SDD 스펙으로 변환합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, ensureDir } from '../../utils/fs.js';
import type { ExtractedSpec } from './spec-generator.js';
import { getApprovedSpecs } from './review.js';
import { updateExtractionStatus } from './meta.js';

/**
 * 확정된 스펙
 */
export interface FinalizedSpec {
  /** 스펙 ID */
  id: string;
  /** 도메인 */
  domain: string;
  /** 스펙 파일 경로 */
  specPath: string;
  /** 원본 스펙 */
  original: ExtractedSpec;
  /** 확정 시간 */
  finalizedAt: Date;
}

/**
 * 확정 결과
 */
export interface FinalizeResult {
  /** 확정된 스펙 */
  finalized: FinalizedSpec[];
  /** 건너뛴 스펙 */
  skipped: string[];
  /** 오류 */
  errors: Array<{ specId: string; error: string }>;
}

/**
 * 스펙을 SDD 형식으로 변환
 */
function convertToSddSpec(spec: ExtractedSpec): string {
  const lines: string[] = [];

  // 헤더
  lines.push(`# ${spec.name}`);
  lines.push('');
  lines.push(`> 도메인: \`${spec.domain}\``);
  lines.push(`> 버전: ${spec.metadata.version}`);
  lines.push(`> 상태: ACTIVE`);
  lines.push('');

  // 개요
  lines.push('## 개요');
  lines.push('');
  lines.push(spec.description);
  lines.push('');

  // 시나리오
  lines.push('## 시나리오');
  lines.push('');
  for (const scenario of spec.scenarios) {
    lines.push(`### ${scenario.name}`);
    lines.push('');
    lines.push('```gherkin');
    lines.push(`Given ${scenario.given}`);
    lines.push(`When ${scenario.when}`);
    lines.push(`Then ${scenario.then}`);
    lines.push('```');
    lines.push('');
  }

  // 계약
  if (spec.contracts.length > 0) {
    lines.push('## 계약');
    lines.push('');

    const inputContracts = spec.contracts.filter(c => c.type === 'input');
    const outputContracts = spec.contracts.filter(c => c.type === 'output');

    if (inputContracts.length > 0) {
      lines.push('### 입력');
      lines.push('');
      for (const contract of inputContracts) {
        lines.push(`- ${contract.description}`);
        if (contract.signature) {
          lines.push(`  \`\`\`typescript`);
          lines.push(`  ${contract.signature}`);
          lines.push(`  \`\`\``);
        }
      }
      lines.push('');
    }

    if (outputContracts.length > 0) {
      lines.push('### 출력');
      lines.push('');
      for (const contract of outputContracts) {
        lines.push(`- ${contract.description}`);
        if (contract.signature) {
          lines.push(`  \`\`\`typescript`);
          lines.push(`  ${contract.signature}`);
          lines.push(`  \`\`\``);
        }
      }
      lines.push('');
    }
  }

  // 관련 스펙
  if (spec.relatedSpecs.length > 0) {
    lines.push('## 관련 스펙');
    lines.push('');
    for (const related of spec.relatedSpecs) {
      lines.push(`- [[${related}]]`);
    }
    lines.push('');
  }

  // 메타데이터
  lines.push('---');
  lines.push('');
  lines.push('## 메타데이터');
  lines.push('');
  lines.push('```yaml');
  lines.push(`id: ${spec.id}`);
  lines.push(`domain: ${spec.domain}`);
  lines.push(`version: ${spec.metadata.version}`);
  lines.push(`source: reverse-extraction`);
  lines.push(`extracted_at: ${spec.metadata.extractedAt.toISOString()}`);
  lines.push(`finalized_at: ${new Date().toISOString()}`);
  lines.push(`confidence: ${spec.confidence.score}`);
  lines.push(`source_files:`);
  for (const file of spec.metadata.sourceFiles) {
    lines.push(`  - ${file}`);
  }
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

/**
 * 단일 스펙 확정
 *
 * /sdd.new와 동일한 도메인 기반 형식으로 생성:
 * - 경로: .sdd/specs/<domain>/<feature-id>/spec.md
 */
export async function finalizeSpec(
  sddRoot: string,
  spec: ExtractedSpec
): Promise<Result<FinalizedSpec, Error>> {
  try {
    // feature-id 추출 (domain/name 형식에서 name만 사용)
    const featureId = spec.id.includes('/') ? spec.id.split('/').pop()! : spec.id;

    // 도메인 결정 (없으면 common 사용)
    const domain = spec.domain || 'common';

    // 스펙 디렉토리 생성: .sdd/specs/<domain>/<feature-id>/
    const featurePath = path.join(sddRoot, '.sdd', 'specs', domain, featureId);
    await ensureDir(featurePath);

    // 스펙 파일: spec.md
    const specPath = path.join(featurePath, 'spec.md');

    // SDD 형식으로 변환
    const content = convertToSddSpec(spec);

    // 저장
    await fs.writeFile(specPath, content, 'utf-8');

    return success({
      id: `${domain}/${featureId}`,
      domain: domain,
      specPath: path.relative(sddRoot, specPath),
      original: spec,
      finalizedAt: new Date(),
    });
  } catch (error) {
    return failure(new Error(`스펙 확정 실패: ${error}`));
  }
}

/**
 * 모든 승인된 스펙 확정
 */
export async function finalizeAllApproved(
  sddRoot: string
): Promise<Result<FinalizeResult, Error>> {
  const sddPath = path.join(sddRoot, '.sdd');
  const approvedResult = await getApprovedSpecs(sddPath);

  if (!approvedResult.success) {
    return failure(approvedResult.error);
  }

  const approved = approvedResult.data;
  const result: FinalizeResult = {
    finalized: [],
    skipped: [],
    errors: [],
  };

  for (const spec of approved) {
    const finalizeResult = await finalizeSpec(sddRoot, spec);

    if (finalizeResult.success) {
      result.finalized.push(finalizeResult.data);

      // 원본 초안 삭제
      await deleteDraft(sddPath, spec.id);
    } else {
      result.errors.push({
        specId: spec.id,
        error: finalizeResult.error.message,
      });
    }
  }

  // 메타데이터 업데이트
  await updateExtractionStatus(sddPath, {
    finalizedCount: result.finalized.length,
  });

  return success(result);
}

/**
 * 특정 도메인의 스펙 확정
 */
export async function finalizeDomain(
  sddRoot: string,
  domain: string
): Promise<Result<FinalizeResult, Error>> {
  const sddPath = path.join(sddRoot, '.sdd');
  const approvedResult = await getApprovedSpecs(sddPath);

  if (!approvedResult.success) {
    return failure(approvedResult.error);
  }

  const domainSpecs = approvedResult.data.filter(s => s.domain === domain);

  if (domainSpecs.length === 0) {
    return success({
      finalized: [],
      skipped: [],
      errors: [],
    });
  }

  const result: FinalizeResult = {
    finalized: [],
    skipped: [],
    errors: [],
  };

  for (const spec of domainSpecs) {
    const finalizeResult = await finalizeSpec(sddRoot, spec);

    if (finalizeResult.success) {
      result.finalized.push(finalizeResult.data);
      await deleteDraft(sddPath, spec.id);
    } else {
      result.errors.push({
        specId: spec.id,
        error: finalizeResult.error.message,
      });
    }
  }

  return success(result);
}

/**
 * 단일 스펙 확정 (ID로)
 */
export async function finalizeById(
  sddRoot: string,
  specId: string
): Promise<Result<FinalizedSpec, Error>> {
  const sddPath = path.join(sddRoot, '.sdd');
  const approvedResult = await getApprovedSpecs(sddPath);

  if (!approvedResult.success) {
    return failure(approvedResult.error);
  }

  const spec = approvedResult.data.find(s => s.id === specId);

  if (!spec) {
    return failure(new Error(`승인된 스펙을 찾을 수 없습니다: ${specId}`));
  }

  const result = await finalizeSpec(sddRoot, spec);

  if (result.success) {
    await deleteDraft(sddPath, specId);
  }

  return result;
}

/**
 * 초안 삭제
 */
async function deleteDraft(sddPath: string, specId: string): Promise<void> {
  const [domain, name] = specId.split('/');
  const draftsPath = path.join(sddPath, '.reverse-drafts', domain);

  try {
    const mdPath = path.join(draftsPath, `${name}.md`);
    const jsonPath = path.join(draftsPath, `${name}.json`);

    if (await fileExists(mdPath)) {
      await fs.unlink(mdPath);
    }
    if (await fileExists(jsonPath)) {
      await fs.unlink(jsonPath);
    }
  } catch {
    // 삭제 실패 무시
  }
}

/**
 * 확정 결과 포맷팅
 */
export function formatFinalizeResult(result: FinalizeResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('📦 스펙 확정 결과'));
  lines.push('═'.repeat(50));
  lines.push('');

  if (result.finalized.length === 0 && result.errors.length === 0) {
    lines.push(chalk.yellow('확정할 스펙이 없습니다.'));
    lines.push('');
    return lines.join('\n');
  }

  // 확정된 스펙
  if (result.finalized.length > 0) {
    lines.push(chalk.green(`✅ ${result.finalized.length}개 스펙 확정:`));
    for (const spec of result.finalized) {
      lines.push(`   ${chalk.cyan(spec.id)} → ${spec.specPath}`);
    }
    lines.push('');
  }

  // 오류
  if (result.errors.length > 0) {
    lines.push(chalk.red(`❌ ${result.errors.length}개 오류:`));
    for (const error of result.errors) {
      lines.push(`   ${error.specId}: ${error.error}`);
    }
    lines.push('');
  }

  // 다음 단계
  if (result.finalized.length > 0) {
    lines.push(chalk.bold('💡 다음 단계:'));
    lines.push('   1. .sdd/specs/ 디렉토리에서 확정된 스펙 확인');
    lines.push('   2. sdd validate로 스펙 검증');
    lines.push('   3. 구현 시작!');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 확정된 스펙 목록 조회
 *
 * 도메인 기반 형식: .sdd/specs/<domain>/<feature-id>/spec.md
 */
export async function getFinalizedSpecs(
  sddRoot: string
): Promise<Result<FinalizedSpec[], Error>> {
  const specsDir = path.join(sddRoot, '.sdd', 'specs');

  if (!await fileExists(specsDir)) {
    return success([]);
  }

  const specs: FinalizedSpec[] = [];

  try {
    const domainEntries = await fs.readdir(specsDir);

    for (const domainEntry of domainEntries) {
      const domainPath = path.join(specsDir, domainEntry);
      const domainStat = await fs.stat(domainPath);
      if (!domainStat.isDirectory()) continue;

      // 직접 spec.md가 있는지 확인 (기존 구조 호환)
      const directSpecPath = path.join(domainPath, 'spec.md');
      if (await fileExists(directSpecPath)) {
        const content = await fs.readFile(directSpecPath, 'utf-8');
        const idMatch = content.match(/id:\s*(.+)/);
        const domainMatch = content.match(/domain:\s*(.+)/);

        const id = idMatch ? idMatch[1].trim() : domainEntry;
        const domain = domainMatch ? domainMatch[1].trim() : 'unknown';

        specs.push({
          id,
          domain,
          specPath: path.relative(sddRoot, directSpecPath),
          original: {} as ExtractedSpec,
          finalizedAt: (await fs.stat(directSpecPath)).mtime,
        });
        continue;
      }

      // 도메인 기반 구조: specs/<domain>/<feature>/spec.md
      const featureEntries = await fs.readdir(domainPath);

      for (const featureEntry of featureEntries) {
        const featurePath = path.join(domainPath, featureEntry);
        const featureStat = await fs.stat(featurePath);
        if (!featureStat.isDirectory()) continue;

        const specPath = path.join(featurePath, 'spec.md');
        if (!await fileExists(specPath)) continue;

        const content = await fs.readFile(specPath, 'utf-8');

        // 메타데이터 파싱
        const idMatch = content.match(/id:\s*(.+)/);
        const domainMatch = content.match(/domain:\s*(.+)/);

        const id = idMatch ? idMatch[1].trim() : `${domainEntry}/${featureEntry}`;
        const domain = domainMatch ? domainMatch[1].trim() : domainEntry;

        specs.push({
          id,
          domain,
          specPath: path.relative(sddRoot, specPath),
          original: {} as ExtractedSpec, // 원본은 로드하지 않음
          finalizedAt: (await fs.stat(specPath)).mtime,
        });
      }
    }

    return success(specs);
  } catch (error) {
    return failure(new Error(`확정 스펙 목록 조회 실패: ${error}`));
  }
}
