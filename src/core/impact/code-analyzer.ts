/**
 * 코드 영향도 분석기
 *
 * 스펙 변경이 소스 코드 파일에 미치는 영향을 분석합니다.
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { fileExists, readFile } from '../../utils/fs.js';
import { ImpactLevel, getImpactLevel } from './schemas.js';

/**
 * 코드 파일 정보
 */
export interface CodeFile {
  path: string;
  relativePath: string;
  type: 'typescript' | 'javascript' | 'other';
  specReferences: string[];
  imports: string[];
  exports: string[];
}

/**
 * 스펙-코드 연결
 */
export interface CodeLink {
  specId: string;
  filePath: string;
  linkType: 'comment' | 'filename' | 'directory' | 'config';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 코드 매핑 설정
 */
export interface CodeMappingConfig {
  version: string;
  mappings: Array<{
    specId: string;
    files: string[];
    directories?: string[];
  }>;
  patterns?: {
    include?: string[];
    exclude?: string[];
  };
}

/**
 * 영향받는 코드 파일
 */
export interface AffectedCodeFile {
  path: string;
  relativePath: string;
  impactLevel: ImpactLevel;
  impactType: 'direct' | 'indirect';
  reason: string;
  linkedSpec?: string;
}

/**
 * 코드 영향도 분석 결과
 */
export interface CodeImpactResult {
  targetSpec: string;
  directFiles: AffectedCodeFile[];
  indirectFiles: AffectedCodeFile[];
  totalFiles: number;
  riskScore: number;
  riskLevel: ImpactLevel;
  summary: string;
  recommendations: string[];
}

/**
 * 스펙 참조 패턴
 */
const SPEC_REFERENCE_PATTERNS = [
  /\/\/\s*spec:\s*([\w-]+)/gi,           // // spec: feature-id
  /\/\*\s*spec:\s*([\w-]+)\s*\*\//gi,    // /* spec: feature-id */
  /\/\*\*[\s\S]*?@spec\s+([\w-]+)[\s\S]*?\*\//gi, // /** @spec feature-id */
  /#\s*spec:\s*([\w-]+)/gi,              // # spec: feature-id (for Python, etc.)
];

/**
 * 코드 영향도 분석 실행
 */
export async function analyzeCodeImpact(
  projectRoot: string,
  sddPath: string,
  targetSpec: string
): Promise<Result<CodeImpactResult, ChangeError>> {
  try {
    // 매핑 설정 로드 (있는 경우)
    const mappingConfig = await loadCodeMappingConfig(sddPath);

    // 소스 코드 파일 스캔
    const codeFiles = await scanCodeFiles(projectRoot);

    // 스펙-코드 연결 찾기
    const links = await findSpecLinks(
      targetSpec,
      codeFiles,
      mappingConfig
    );

    // 직접 영향받는 파일
    const directFiles: AffectedCodeFile[] = links.map((link) => ({
      path: link.filePath,
      relativePath: path.relative(projectRoot, link.filePath),
      impactLevel: getLinkImpactLevel(link.confidence),
      impactType: 'direct' as const,
      reason: getLinkReason(link.linkType),
      linkedSpec: link.specId,
    }));

    // 간접 영향받는 파일 (import 추적)
    const indirectFiles = await findIndirectImpact(
      projectRoot,
      directFiles.map((f) => f.path),
      codeFiles
    );

    // 리스크 점수 계산
    const totalFiles = directFiles.length + indirectFiles.length;
    const riskScore = calculateCodeRiskScore(directFiles, indirectFiles);
    const riskLevel = getImpactLevel(riskScore);

    // 요약 및 권장사항
    const summary = generateCodeSummary(targetSpec, directFiles, indirectFiles);
    const recommendations = generateCodeRecommendations(
      directFiles,
      indirectFiles,
      riskLevel
    );

    return success({
      targetSpec,
      directFiles,
      indirectFiles,
      totalFiles,
      riskScore,
      riskLevel,
      summary,
      recommendations,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `코드 영향도 분석 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 코드 매핑 설정 로드
 */
async function loadCodeMappingConfig(
  sddPath: string
): Promise<CodeMappingConfig | null> {
  const configPath = path.join(sddPath, 'code-mapping.json');

  if (!(await fileExists(configPath))) {
    return null;
  }

  const contentResult = await readFile(configPath);
  if (!contentResult.success) {
    return null;
  }

  try {
    return JSON.parse(contentResult.data) as CodeMappingConfig;
  } catch {
    return null;
  }
}

/**
 * 소스 코드 파일 스캔
 */
async function scanCodeFiles(
  projectRoot: string,
  maxDepth: number = 10
): Promise<CodeFile[]> {
  const codeFiles: CodeFile[] = [];
  const excludeDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.sdd',
    '.next',
    '.nuxt',
    'vendor',
    '__pycache__',
  ]);

  async function scan(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!excludeDirs.has(entry.name) && !entry.name.startsWith('.')) {
            await scan(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (isCodeFile(ext)) {
            const codeFile = await analyzeCodeFile(fullPath, projectRoot);
            if (codeFile) {
              codeFiles.push(codeFile);
            }
          }
        }
      }
    } catch {
      // 디렉토리 접근 오류 무시
    }
  }

  await scan(projectRoot, 0);
  return codeFiles;
}

/**
 * 코드 파일 여부 확인
 */
function isCodeFile(ext: string): boolean {
  const codeExtensions = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.vue',
    '.svelte',
  ]);
  return codeExtensions.has(ext);
}

/**
 * 코드 파일 분석
 */
async function analyzeCodeFile(
  filePath: string,
  projectRoot: string
): Promise<CodeFile | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    // 스펙 참조 추출
    const specReferences = extractSpecReferences(content);

    // import 추출
    const imports = extractImports(content);

    // export 추출
    const exports = extractExports(content);

    return {
      path: filePath,
      relativePath: path.relative(projectRoot, filePath),
      type: ext === '.ts' || ext === '.tsx' ? 'typescript' : ext === '.js' || ext === '.jsx' ? 'javascript' : 'other',
      specReferences,
      imports,
      exports,
    };
  } catch {
    return null;
  }
}

/**
 * 스펙 참조 추출
 */
function extractSpecReferences(content: string): string[] {
  const refs = new Set<string>();

  for (const pattern of SPEC_REFERENCE_PATTERNS) {
    // 패턴을 복사하여 lastIndex 초기화
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match[1]) {
        refs.add(match[1].toLowerCase());
      }
    }
  }

  return Array.from(refs);
}

/**
 * import 문 추출
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];

  // ES6 import
  const es6Pattern = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = es6Pattern.exec(content)) !== null) {
    if (match[1] && !match[1].startsWith('.')) {
      continue; // 외부 패키지 제외
    }
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  // CommonJS require
  const cjsPattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  while ((match = cjsPattern.exec(content)) !== null) {
    if (match[1] && !match[1].startsWith('.')) {
      continue; // 외부 패키지 제외
    }
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  return imports;
}

/**
 * export 문 추출
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];

  // Named exports
  const namedPattern = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = namedPattern.exec(content)) !== null) {
    if (match[1]) {
      exports.push(match[1]);
    }
  }

  // Default export
  if (/export\s+default/.test(content)) {
    exports.push('default');
  }

  return exports;
}

/**
 * 스펙-코드 연결 찾기
 */
async function findSpecLinks(
  targetSpec: string,
  codeFiles: CodeFile[],
  mappingConfig: CodeMappingConfig | null
): Promise<CodeLink[]> {
  const links: CodeLink[] = [];
  const normalizedSpec = targetSpec.toLowerCase();

  // 1. 설정 파일에서 매핑 확인
  if (mappingConfig) {
    const mapping = mappingConfig.mappings.find(
      (m) => m.specId.toLowerCase() === normalizedSpec
    );

    if (mapping) {
      for (const file of mapping.files) {
        // 경로 정규화 (슬래시 통일)
        const normalizedFile = file.replace(/\\/g, '/');
        const codeFile = codeFiles.find(
          (cf) => {
            const normalizedRelPath = cf.relativePath.replace(/\\/g, '/');
            return normalizedRelPath === normalizedFile ||
                   cf.path.replace(/\\/g, '/').endsWith(normalizedFile);
          }
        );
        if (codeFile) {
          links.push({
            specId: targetSpec,
            filePath: codeFile.path,
            linkType: 'config',
            confidence: 'high',
          });
        }
      }
    }
  }

  // 2. 주석에서 스펙 참조 확인
  for (const file of codeFiles) {
    if (file.specReferences.includes(normalizedSpec)) {
      // 이미 추가된 파일인지 확인
      if (!links.some((l) => l.filePath === file.path)) {
        links.push({
          specId: targetSpec,
          filePath: file.path,
          linkType: 'comment',
          confidence: 'high',
        });
      }
    }
  }

  // 3. 파일명/디렉토리명 매칭
  for (const file of codeFiles) {
    const fileName = path.basename(file.path, path.extname(file.path)).toLowerCase();
    const dirName = path.basename(path.dirname(file.path)).toLowerCase();

    // 파일명 매칭 (예: auth.ts ↔ auth 스펙)
    if (fileName === normalizedSpec || fileName === normalizedSpec.replace(/-/g, '')) {
      if (!links.some((l) => l.filePath === file.path)) {
        links.push({
          specId: targetSpec,
          filePath: file.path,
          linkType: 'filename',
          confidence: 'medium',
        });
      }
    }

    // 디렉토리명 매칭 (예: auth/ 디렉토리 ↔ auth 스펙)
    if (dirName === normalizedSpec || dirName === normalizedSpec.replace(/-/g, '')) {
      if (!links.some((l) => l.filePath === file.path)) {
        links.push({
          specId: targetSpec,
          filePath: file.path,
          linkType: 'directory',
          confidence: 'low',
        });
      }
    }
  }

  return links;
}

/**
 * 간접 영향받는 파일 찾기
 */
async function findIndirectImpact(
  projectRoot: string,
  directFilePaths: string[],
  allFiles: CodeFile[]
): Promise<AffectedCodeFile[]> {
  const indirectFiles: AffectedCodeFile[] = [];
  const directSet = new Set(directFilePaths);
  const visited = new Set<string>(directFilePaths);

  // 직접 영향받는 파일을 import하는 파일 찾기
  for (const file of allFiles) {
    if (directSet.has(file.path)) continue;

    for (const imp of file.imports) {
      const resolvedImport = resolveImport(file.path, imp);

      // 직접 영향받는 파일을 import하는지 확인
      for (const directPath of directFilePaths) {
        if (isImportMatch(resolvedImport, directPath)) {
          if (!visited.has(file.path)) {
            visited.add(file.path);
            indirectFiles.push({
              path: file.path,
              relativePath: path.relative(projectRoot, file.path),
              impactLevel: 'medium',
              impactType: 'indirect',
              reason: `${path.basename(directPath)}를 import함`,
            });
          }
        }
      }
    }
  }

  return indirectFiles;
}

/**
 * import 경로 해석
 */
function resolveImport(fromFile: string, importPath: string): string {
  if (!importPath.startsWith('.')) {
    return importPath;
  }

  const dir = path.dirname(fromFile);
  return path.resolve(dir, importPath);
}

/**
 * import가 대상 파일과 일치하는지 확인
 */
function isImportMatch(resolvedImport: string, targetFile: string): boolean {
  // 확장자 없이 비교
  const importWithoutExt = resolvedImport.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
  const targetWithoutExt = targetFile.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');

  // 정확한 일치
  if (importWithoutExt === targetWithoutExt) return true;

  // index 파일 처리
  if (targetWithoutExt.endsWith('/index')) {
    const dirPath = targetWithoutExt.slice(0, -6);
    if (importWithoutExt === dirPath) return true;
  }

  return false;
}

/**
 * 링크 신뢰도에 따른 영향도 수준
 */
function getLinkImpactLevel(confidence: 'high' | 'medium' | 'low'): ImpactLevel {
  switch (confidence) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
  }
}

/**
 * 링크 유형에 따른 이유 설명
 */
function getLinkReason(linkType: CodeLink['linkType']): string {
  switch (linkType) {
    case 'comment':
      return '스펙 ID 주석 참조';
    case 'filename':
      return '파일명 일치';
    case 'directory':
      return '디렉토리명 일치';
    case 'config':
      return '매핑 설정에 정의됨';
  }
}

/**
 * 코드 리스크 점수 계산
 */
function calculateCodeRiskScore(
  directFiles: AffectedCodeFile[],
  indirectFiles: AffectedCodeFile[]
): number {
  let score = 0;

  // 직접 영향 파일
  const highCount = directFiles.filter((f) => f.impactLevel === 'high').length;
  const mediumCount = directFiles.filter((f) => f.impactLevel === 'medium').length;
  const lowCount = directFiles.filter((f) => f.impactLevel === 'low').length;

  score += highCount * 2;
  score += mediumCount * 1;
  score += lowCount * 0.5;

  // 간접 영향 파일
  score += indirectFiles.length * 0.3;

  // 1-10 범위로 정규화
  return Math.min(10, Math.max(1, Math.round(score)));
}

/**
 * 코드 요약 생성
 */
function generateCodeSummary(
  targetSpec: string,
  directFiles: AffectedCodeFile[],
  indirectFiles: AffectedCodeFile[]
): string {
  const parts: string[] = [];

  parts.push(`'${targetSpec}' 스펙 변경 시 코드 영향:`);

  if (directFiles.length > 0) {
    parts.push(`- ${directFiles.length}개 파일에 직접 영향`);

    // 링크 유형별 분류
    const byComment = directFiles.filter((f) => f.reason === '스펙 ID 주석 참조').length;
    const byFilename = directFiles.filter((f) => f.reason === '파일명 일치').length;
    const byDir = directFiles.filter((f) => f.reason === '디렉토리명 일치').length;
    const byConfig = directFiles.filter((f) => f.reason === '매핑 설정에 정의됨').length;

    if (byComment > 0) parts.push(`  - 주석 참조: ${byComment}개`);
    if (byFilename > 0) parts.push(`  - 파일명 매칭: ${byFilename}개`);
    if (byDir > 0) parts.push(`  - 디렉토리 매칭: ${byDir}개`);
    if (byConfig > 0) parts.push(`  - 설정 매핑: ${byConfig}개`);
  } else {
    parts.push('- 직접 연결된 코드 파일 없음');
  }

  if (indirectFiles.length > 0) {
    parts.push(`- ${indirectFiles.length}개 파일에 간접 영향 (import 관계)`);
  }

  parts.push(`- 총 영향 범위: ${directFiles.length + indirectFiles.length}개 파일`);

  return parts.join('\n');
}

/**
 * 코드 권장사항 생성
 */
function generateCodeRecommendations(
  directFiles: AffectedCodeFile[],
  indirectFiles: AffectedCodeFile[],
  riskLevel: ImpactLevel
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'high') {
    recommendations.push('영향받는 모든 코드 파일을 검토하세요.');
    recommendations.push('관련 테스트 케이스를 실행하세요.');
    recommendations.push('변경 전 코드 리뷰를 권장합니다.');
  } else if (riskLevel === 'medium') {
    recommendations.push('직접 영향받는 파일을 검토하세요.');
    recommendations.push('관련 테스트를 실행하세요.');
  } else {
    recommendations.push('표준 변경 프로세스를 따르세요.');
  }

  // 직접 연결 없는 경우
  if (directFiles.length === 0) {
    recommendations.push('코드에 스펙 참조 주석을 추가하면 추적이 용이합니다.');
    recommendations.push('예: // spec: ' + 'feature-id');
  }

  // 간접 영향이 많은 경우
  if (indirectFiles.length > 5) {
    recommendations.push('영향 범위가 넓습니다. 단계적 변경을 고려하세요.');
  }

  return recommendations;
}

/**
 * 코드 영향도 결과 포맷팅
 */
export function formatCodeImpactResult(result: CodeImpactResult): string {
  const lines: string[] = [];

  lines.push(`💻 코드 영향도 분석: ${result.targetSpec}`);
  lines.push('');

  if (result.directFiles.length > 0) {
    lines.push('📂 직접 영향받는 파일:');
    for (const file of result.directFiles) {
      const icon =
        file.impactLevel === 'high' ? '🔴' : file.impactLevel === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${icon} ${file.relativePath}`);
      lines.push(`     └─ ${file.reason}`);
    }
    lines.push('');
  } else {
    lines.push('📂 직접 연결된 코드 파일 없음');
    lines.push('   (코드에 `// spec: feature-id` 주석을 추가하여 연결할 수 있습니다)');
    lines.push('');
  }

  if (result.indirectFiles.length > 0) {
    lines.push('🔗 간접 영향받는 파일 (import 관계):');
    for (const file of result.indirectFiles) {
      lines.push(`  └─ ${file.relativePath}`);
      lines.push(`     └─ ${file.reason}`);
    }
    lines.push('');
  }

  const riskIcon =
    result.riskLevel === 'high' ? '🔴' : result.riskLevel === 'medium' ? '🟡' : '🟢';
  lines.push(`📈 리스크 점수: ${result.riskScore}/10 ${riskIcon}`);
  lines.push(`📊 총 영향 파일: ${result.totalFiles}개`);
  lines.push('');

  if (result.recommendations.length > 0) {
    lines.push('💡 권장사항:');
    for (const rec of result.recommendations) {
      lines.push(`  - ${rec}`);
    }
  }

  return lines.join('\n');
}
