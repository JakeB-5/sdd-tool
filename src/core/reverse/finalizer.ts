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
import { listSpecs } from '../spec/locator.js';
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
 *
 * sdd new와 동일한 형식으로 생성:
 * - YAML frontmatter (id, title, status, created, domain, depends, ...)
 * - ## 요구사항 + REQ-ID + RFC 2119 키워드
 * - ## 시나리오 + - **GIVEN/WHEN/THEN** 형식
 * - ## 비기능 요구사항, ## 제약사항, ## 용어 정의
 */
function convertToSddSpec(spec: ExtractedSpec): string {
  const extractedAt =
    spec.metadata.extractedAt instanceof Date
      ? spec.metadata.extractedAt.toISOString().split('T')[0]
      : String(spec.metadata.extractedAt).split('T')[0];

  // feature-id 추출 (domain/name 형식에서 name만 사용)
  const featureId = spec.id.includes('/') ? spec.id.split('/').pop()! : spec.id;

  // source_files YAML 형식
  const sourceFilesYaml =
    spec.metadata.sourceFiles.length > 0
      ? spec.metadata.sourceFiles.map(f => `  - ${f}`).join('\n')
      : '  - (none)';

  // 1. YAML frontmatter (sdd new와 동일)
  let content = `---
id: ${featureId}
title: "${spec.name}"
status: draft
created: ${extractedAt}
domain: ${spec.domain}
depends: null
extracted_from: reverse-extraction
confidence: ${spec.confidence.score}
source_files:
${sourceFilesYaml}
---

# ${spec.name}

> ${spec.description}

---

## 개요

${spec.description}

---

## 요구사항

`;

  // 2. 계약에서 요구사항 생성 + RFC 2119 키워드 추가
  if (spec.contracts.length > 0) {
    let reqIndex = 1;
    for (const contract of spec.contracts) {
      const reqId = `REQ-${String(reqIndex++).padStart(2, '0')}`;
      const reqTitle = contract.description.split('의')[0] || contract.description;
      content += `### ${reqId}: ${reqTitle}

시스템은 ${contract.description.toLowerCase()}을(를) 제공해야 한다(SHALL).

`;
      if (contract.signature) {
        content += `\`\`\`typescript
${contract.signature}
\`\`\`

`;
      }
    }
  } else {
    content += `### REQ-01: [요구사항 제목]

[요구사항 상세 설명]
- 시스템은 [기능]을 지원해야 한다(SHALL)

`;
  }

  // 3. 시나리오를 - **GIVEN** 형식으로 변환
  content += `---

## 시나리오

`;

  if (spec.scenarios.length > 0) {
    for (let i = 0; i < spec.scenarios.length; i++) {
      const scenario = spec.scenarios[i];
      content += `### Scenario ${i + 1}: ${scenario.name}

- **GIVEN** ${scenario.given}
- **WHEN** ${scenario.when}
- **THEN** ${scenario.then}

`;
    }
  } else {
    content += `### Scenario 1: [시나리오명]

- **GIVEN** [전제 조건]
- **WHEN** [행동/트리거]
- **THEN** [예상 결과]

`;
  }

  // 4. 비기능 요구사항
  content += `---

## 비기능 요구사항

### 성능

- 응답 시간: [N]ms 이내 (SHOULD)

### 보안

- [보안 요구사항] (SHALL)

---

## 제약사항

- 원본 파일: ${spec.metadata.sourceFiles.join(', ') || '(없음)'}
- 역추출 신뢰도: ${spec.confidence.grade} (${spec.confidence.score}%)

---

## 용어 정의

| 용어 | 정의 |
|------|------|
| [용어1] | [정의1] |
`;

  // 5. 관련 스펙 (있으면 추가)
  if (spec.relatedSpecs.length > 0) {
    content += `
---

## 관련 스펙

`;
    for (const related of spec.relatedSpecs) {
      content += `- [[${related}]]\n`;
    }
  }

  return content;
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
    // 도메인/평면 레이아웃 모두 spec locator로 탐색
    for (const location of await listSpecs(path.join(sddRoot, '.sdd'))) {
      const content = await fs.readFile(location.specPath, 'utf-8');

      // 메타데이터 파싱
      const idMatch = content.match(/id:\s*(.+)/);
      const domainMatch = content.match(/domain:\s*(.+)/);

      specs.push({
        id: idMatch ? idMatch[1].trim() : location.id,
        domain: domainMatch ? domainMatch[1].trim() : (location.domain ?? 'unknown'),
        specPath: path.relative(sddRoot, location.specPath),
        original: {} as ExtractedSpec, // 원본은 로드하지 않음
        finalizedAt: (await fs.stat(location.specPath)).mtime,
      });
    }

    return success(specs);
  } catch (error) {
    return failure(new Error(`확정 스펙 목록 조회 실패: ${error}`));
  }
}
