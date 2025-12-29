# /dev-scaffold

SDD CLI의 새 명령어, 모듈, 파서, 검증기의 TypeScript 보일러플레이트를 생성합니다.

## 사용법

```
/dev-scaffold command <name>     # 새 CLI 명령어
/dev-scaffold module <name>      # 새 코어 모듈
/dev-scaffold parser <name>      # 새 파서
/dev-scaffold validator <name>   # 새 검증기
```

## 생성되는 파일

### 명령어 (command)
```
src/cli/commands/<name>.ts       # 명령어 구현
tests/unit/cli/commands/<name>.test.ts  # 단위 테스트
tests/e2e/<name>.e2e.test.ts     # E2E 테스트
```

### 모듈 (module)
```
src/core/<name>/index.ts         # 모듈 진입점
src/core/<name>/types.ts         # 타입 정의
tests/unit/core/<name>/index.test.ts  # 테스트
```

### 파서 (parser)
```
src/core/parsers/<name>-parser.ts     # 파서 구현
tests/unit/core/parsers/<name>-parser.test.ts  # 테스트
```

### 검증기 (validator)
```
src/core/validators/<name>-validator.ts     # 검증기 구현
tests/unit/core/validators/<name>-validator.test.ts  # 테스트
```

## 예시

```
/dev-scaffold command export     # sdd export 명령어 생성
/dev-scaffold module metrics     # 메트릭 모듈 생성
/dev-scaffold parser yaml        # YAML 파서 생성
```

## 참고사항

- 기존 파일이 있으면 덮어쓰지 않습니다
- `ts-scaffolder` 에이전트를 활용합니다
- 생성 후 `npm run build`로 빌드를 확인하세요
