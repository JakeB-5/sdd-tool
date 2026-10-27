/**
 * sdd-tool 패키지 메타데이터 조회
 *
 * Walks up from this module to the sdd-tool package.json because the module's
 * depth differs between src/ and the bundled dist/.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ToolPackageInfo {
  version: string;
  description: string;
}

let cached: ToolPackageInfo | undefined;

/**
 * name, version, description of the running sdd-tool package.
 * Throws when the package.json cannot be located.
 */
export function getToolPackage(): ToolPackageInfo {
  if (cached) return cached;

  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (;;) {
    try {
      const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf-8')) as {
        name?: string;
        version?: string;
        description?: string;
      };
      if (pkg.name === 'sdd-tool' && pkg.version) {
        cached = { version: pkg.version, description: pkg.description ?? '' };
        return cached;
      }
    } catch {
      // no readable package.json at this level; keep walking up
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error('sdd-tool의 package.json을 찾을 수 없습니다.');
    }
    dir = parent;
  }
}

/**
 * Version of the running sdd-tool (the value `sdd --version` reports).
 */
export function getToolVersion(): string {
  return getToolPackage().version;
}
