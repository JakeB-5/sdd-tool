# dev-scaffold (Skill)

TypeScript 보일러플레이트 코드를 생성하는 개발 스킬입니다.

> **Note**: 이것은 슬래시 커맨드가 아닌 **스킬**입니다. Claude가 작업 컨텍스트에 따라 자동으로 선택하여 사용합니다.

## 개요

`dev-scaffold` 스킬은 SDD CLI의 새 명령어, 모듈, 파서, 검증기의 TypeScript 보일러플레이트 코드를 생성합니다.

## 트리거 조건

Claude가 다음과 같은 요청을 받으면 자동으로 이 스킬을 사용합니다:

- "새 명령어 만들어", "모듈 추가"
- "scaffold", "보일러플레이트"

## 사용 예시

### 명령어 스캐폴드

```
User: export 명령어 만들어줘

Claude: 생성 파일:
  src/cli/commands/export.ts      # 명령어 핸들러
  src/cli/commands/export.test.ts # 테스트
```

**생성 코드:**

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

### 모듈 스캐폴드

```
User: auth/token 모듈 만들어줘

Claude: 생성 파일:
  src/core/auth/token.ts          # 모듈 구현
  src/core/auth/token.test.ts     # 테스트
  src/core/auth/index.ts          # 인덱스 업데이트
```

### 파서 스캐폴드

```
User: yaml 파서 만들어줘

Claude: 생성 파일:
  src/core/parsers/yaml-parser.ts
  src/core/parsers/yaml-parser.test.ts
```

### 검증기 스캐폴드

```
User: spec 검증기 만들어줘

Claude: 생성 파일:
  src/core/validators/spec-validator.ts
  src/core/validators/spec-validator.test.ts
```

## 관련 스킬

- [`dev-implement`](/commands/dev-implement) - 스펙 구현
