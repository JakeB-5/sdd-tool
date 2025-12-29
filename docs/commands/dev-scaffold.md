# /dev-scaffold

TypeScript 보일러플레이트 코드를 생성하는 개발 스킬입니다.

## 개요

`/dev-scaffold`는 SDD CLI의 새 명령어, 모듈, 파서, 검증기의 TypeScript 보일러플레이트 코드를 생성합니다.

## 사용법

```
/dev-scaffold command <name>      # CLI 명령어 스캐폴드
/dev-scaffold module <name>       # 모듈 스캐폴드
/dev-scaffold parser <name>       # 파서 스캐폴드
/dev-scaffold validator <name>    # 검증기 스캐폴드
```

## 명령어 스캐폴드

```
/dev-scaffold command export

생성 파일:
  src/cli/commands/export.ts      # 명령어 핸들러
  src/cli/commands/export.test.ts # 테스트
```

**생성 코드 예시:**

```typescript
// src/cli/commands/export.ts
import { Command } from 'commander';

export interface ExportOptions {
  output?: string;
  format?: string;
}

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export description')
    .option('-o, --output <path>', 'Output path')
    .option('-f, --format <type>', 'Output format')
    .action(handleExport);
}

async function handleExport(options: ExportOptions): Promise<void> {
  // TODO: Implement
}
```

## 모듈 스캐폴드

```
/dev-scaffold module auth/token

생성 파일:
  src/core/auth/token.ts          # 모듈 구현
  src/core/auth/token.test.ts     # 테스트
  src/core/auth/index.ts          # 인덱스 업데이트
```

## 파서 스캐폴드

```
/dev-scaffold parser yaml

생성 파일:
  src/core/parsers/yaml-parser.ts
  src/core/parsers/yaml-parser.test.ts
```

## 검증기 스캐폴드

```
/dev-scaffold validator spec

생성 파일:
  src/core/validators/spec-validator.ts
  src/core/validators/spec-validator.test.ts
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--dry-run` | 실제 파일 생성 없이 미리보기 |
| `--force` | 기존 파일 덮어쓰기 |

## 관련 명령어

- [`/dev-implement`](/commands/dev-implement) - 스펙 구현
- [`/sdd.new`](/commands/sdd-new) - 스펙 생성
