/**
 * 스펙 위치 탐색기 (Spec Locator)
 *
 * 두 가지 스펙 레이아웃을 모두 지원한다:
 * - 도메인 레이아웃: .sdd/specs/<domain>/<feature>/spec.md  (id: "<domain>/<feature>")
 * - 레거시 평면 레이아웃: .sdd/specs/<feature>/spec.md        (id: "<feature>")
 *
 * 디렉토리는 spec.md를 포함할 때만 스펙으로 간주한다.
 * spec.md가 없는 최상위 디렉토리는 도메인 디렉토리로 간주하고,
 * 그 하위의 spec.md를 포함한 디렉토리를 스펙으로 본다.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Result, success, failure } from '../../types/index.js';

/**
 * 스펙 위치 정보
 */
export interface SpecLocation {
  /** Canonical id: "<domain>/<feature>" (nested) or "<feature>" (legacy flat) */
  id: string;
  /** Domain directory name, null for legacy flat specs */
  domain: string | null;
  /** Feature directory name */
  feature: string;
  /** Absolute spec directory */
  dir: string;
  /** Absolute path to spec.md */
  specPath: string;
}

/**
 * 스펙 참조 해석 실패 에러
 */
export class SpecResolveError extends Error {
  constructor(
    message: string,
    public readonly reason: 'not_found' | 'ambiguous',
    public readonly candidates: string[] = []
  ) {
    super(message);
    this.name = 'SpecResolveError';
  }
}

const SPEC_FILE = 'spec.md';

/**
 * 하위 디렉토리 이름 목록 (점 디렉토리 제외, 디렉토리를 가리키는 심볼릭 링크 포함)
 */
async function listSubdirs(dirPath: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const names: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      names.push(entry.name);
    } else if (entry.isSymbolicLink()) {
      try {
        if ((await fs.stat(path.join(dirPath, entry.name))).isDirectory()) {
          names.push(entry.name);
        }
      } catch {
        // Broken symlink: ignore
      }
    }
  }
  return names;
}

async function realpathOrSelf(p: string): Promise<string> {
  try {
    return await fs.realpath(p);
  } catch {
    return p;
  }
}

async function hasSpecFile(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(dirPath, SPEC_FILE));
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * 모든 스펙 위치 조회 (두 레이아웃 모두)
 *
 * @param sddPath .sdd 디렉토리 경로
 */
export async function listSpecs(sddPath: string): Promise<SpecLocation[]> {
  return listSpecsUnder(path.join(sddPath, 'specs'));
}

/**
 * 스펙 루트 디렉토리(.sdd/specs 또는 동일 구조의 디렉토리) 아래의 스펙 위치 조회
 */
export async function listSpecsUnder(specsDir: string): Promise<SpecLocation[]> {
  const locations: SpecLocation[] = [];

  for (const topName of await listSubdirs(specsDir)) {
    const topDir = path.join(specsDir, topName);

    if (await hasSpecFile(topDir)) {
      // Legacy flat spec
      locations.push({
        id: topName,
        domain: null,
        feature: topName,
        dir: topDir,
        specPath: path.join(topDir, SPEC_FILE),
      });
    }

    // Domain directory (a top-level spec dir may also contain domain specs):
    // children with spec.md are specs
    for (const featureName of await listSubdirs(topDir)) {
      const featureDir = path.join(topDir, featureName);
      if (await hasSpecFile(featureDir)) {
        locations.push({
          id: `${topName}/${featureName}`,
          domain: topName,
          feature: featureName,
          dir: featureDir,
          specPath: path.join(featureDir, SPEC_FILE),
        });
      }
    }
  }

  locations.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Symlink guard: the same physical spec directory is listed once, and links
  // pointing back at the specs root itself are ignored. When a directory is
  // reachable both directly and through an alias link, the direct path wins.
  const specsRealpath = await realpathOrSelf(specsDir);
  const resolved = await Promise.all(
    locations.map(async (location) => {
      const real = await realpathOrSelf(location.dir);
      const isAlias =
        path.relative(specsRealpath, real) !== path.relative(specsDir, location.dir);
      return { location, real, isAlias };
    })
  );
  resolved.sort((a, b) => Number(a.isAlias) - Number(b.isAlias));

  const seen = new Set<string>([specsRealpath]);
  const unique: SpecLocation[] = [];
  for (const { location, real } of resolved) {
    if (seen.has(real)) continue;
    seen.add(real);
    unique.push(location);
  }
  unique.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return unique;
}

function normalizeRef(ref: string): string {
  return ref.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

/**
 * 스펙 참조를 위치 목록에서 동기적으로 해석 (의존성 매칭용)
 *
 * 우선순위:
 * 1. canonical id 정확히 일치
 * 2. fromDomain과 같은 도메인의 feature 일치
 * 3. 유일한 bare feature 일치
 */
export function resolveSpecRef(
  all: SpecLocation[],
  ref: string,
  fromDomain?: string | null
): SpecLocation | undefined {
  const normalized = normalizeRef(ref);
  if (!normalized) return undefined;

  const exact = all.find((s) => s.id === normalized);
  if (exact) return exact;

  if (normalized.includes('/')) return undefined;

  const byFeature = all.filter((s) => s.feature === normalized);
  if (fromDomain !== undefined) {
    const sameDomain = byFeature.find((s) => s.domain === fromDomain);
    if (sameDomain) return sameDomain;
  }

  return byFeature.length === 1 ? byFeature[0] : undefined;
}

/**
 * domains.yml에 등록된 스펙 참조 해석
 *
 * 도메인 범위의 참조이므로 bare feature는 `<domainId>/<feature>`를 레거시 평면 id보다 우선한다.
 */
export function resolveDomainSpecRef(
  all: SpecLocation[],
  domainId: string,
  ref: string
): SpecLocation | undefined {
  const normalized = normalizeRef(ref);
  if (normalized && !normalized.includes('/')) {
    const scoped = all.find((s) => s.id === `${domainId}/${normalized}`);
    if (scoped) return scoped;
  }
  return resolveSpecRef(all, normalized, domainId);
}

/**
 * 스펙 참조 해석
 *
 * ref는 "<domain>/<feature>", bare "<feature>", 또는 레거시 평면 id일 수 있다.
 * bare feature가 여러 도메인에 존재하면 후보 목록과 함께 실패를 반환한다.
 */
export async function resolveSpec(
  sddPath: string,
  ref: string
): Promise<Result<SpecLocation, SpecResolveError>> {
  return resolveSpecIn(await listSpecs(sddPath), ref);
}

/**
 * 이미 조회한 위치 목록에서 스펙 참조 해석 (resolveSpec과 동일한 규칙)
 */
export function resolveSpecIn(
  all: SpecLocation[],
  ref: string
): Result<SpecLocation, SpecResolveError> {
  const normalized = normalizeRef(ref);

  const exact = all.find((s) => s.id === normalized);
  if (exact) return success(exact);

  if (normalized && !normalized.includes('/')) {
    const candidates = all.filter((s) => s.feature === normalized);
    if (candidates.length === 1) return success(candidates[0]);
    if (candidates.length > 1) {
      const ids = candidates.map((c) => c.id);
      return failure(
        new SpecResolveError(
          `스펙 '${ref}'이(가) 여러 도메인에 존재합니다. <domain>/<feature> 형식으로 지정해주세요: ${ids.join(', ')}`,
          'ambiguous',
          ids
        )
      );
    }
  }

  return failure(new SpecResolveError(`스펙을 찾을 수 없습니다: ${ref}`, 'not_found'));
}
