# sdd start

SDD 워크플로우를 시작합니다.

## 사용법

```bash
sdd start [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--new` | 새 기능 워크플로우 시작 |
| `--change` | 변경 워크플로우 시작 |
| `--continue` | 진행 중인 작업 계속 |

## 동작

`sdd start`는 프로젝트 상태를 분석하고 적절한 다음 단계를 안내합니다:

1. **신규 프로젝트**: Constitution 작성 안내
2. **Constitution 없음**: Constitution 생성 권장
3. **진행 중인 작업**: 계속 진행 옵션 제공
4. **기존 프로젝트**: 워크플로우 선택 메뉴

## 예시

### 기본 시작

```bash
sdd start
```

출력 (신규 프로젝트):
```
=== SDD 워크플로우 시작 ===

🔍 프로젝트 상태 분석 중...

📋 프로젝트 현황:
  • Constitution: ❌ 없음
  • 스펙: 0개
  • 도메인: 0개

💡 권장 다음 단계:
  1. Constitution 작성: sdd constitution

Constitution을 작성하시겠습니까? (y/n): 
```

출력 (기존 프로젝트):
```
=== SDD 워크플로우 시작 ===

🔍 프로젝트 상태 분석 중...

📋 프로젝트 현황:
  • Constitution: ✅ v1.2.0
  • 스펙: 12개 (draft: 3, approved: 9)
  • 도메인: 4개
  • 진행 중인 작업: 없음

🚀 워크플로우 선택:
  1. 새 기능 명세 작성 (/sdd-spec)
  2. 기존 스펙 변경 (/sdd-spec)
  3. 프로젝트 상태 확인 (sdd status)
  4. 품질 분석 (sdd quality)

선택 (1-4): 
```

출력 (진행 중인 작업):
```
=== SDD 워크플로우 시작 ===

🔍 프로젝트 상태 분석 중...

⚠️  진행 중인 작업이 있습니다:

📄 user-auth (auth 도메인)
   상태: draft
   마지막 수정: 2시간 전
   진행 단계: plan 작성 완료, tasks 대기

계속 진행하시겠습니까? (y/n): 
```

### 새 기능 워크플로우 바로 시작

```bash
sdd start --new
```

### 변경 워크플로우 바로 시작

```bash
sdd start --change
```

### 진행 중인 작업 계속

```bash
sdd start --continue
```

## 워크플로우 흐름

```
sdd start
    │
    ├── Constitution 없음
    │   └── sdd constitution
    │
    ├── 새 기능
    │   └── sdd new → sdd plan → sdd tasks → sdd implement
    │
    └── 변경
        └── sdd change → sdd impact → sdd apply
```

## 슬래시 커맨드

Claude Code에서는 `/sdd-start` 슬래시 커맨드를 사용합니다:

```
/sdd-start
```

## 관련 문서

- [sdd constitution](/cli/constitution) - 헌법 관리
- [sdd new](/cli/new) - 새 기능 생성
- [sdd change](/cli/change) - 변경 관리
- [시작하기 가이드](/guide/getting-started)
