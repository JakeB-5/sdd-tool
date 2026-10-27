/**
 * 역추출 테스트 공용 픽스처
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDraftsDir } from '../../../../src/core/reverse/drafts.js';

/**
 * Minimal spec that passes `validateSpecFile`
 */
export function validSpec(id: string, title = 'Login'): string {
  return `---
id: ${id}
title: ${title}
status: draft
created: 2026-01-01
depends: null
---

# ${title}

> Observed login behaviour.

## Requirements

### REQ-01: Credential check

The system SHALL reject invalid credentials.

## Scenarios

### Scenario 1: Wrong password

- **GIVEN** a registered user
- **WHEN** the user submits a wrong password
- **THEN** the login is rejected
`;
}

/**
 * Write a draft spec to `.sdd/.reverse-drafts/<ref>/spec.md`
 */
export async function writeDraft(sddPath: string, ref: string, content: string): Promise<string> {
  const file = path.join(getDraftsDir(sddPath), ref, 'spec.md');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
  return file;
}
