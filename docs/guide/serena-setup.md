# Serena MCP 설치 및 설정 가이드

> Serena는 30개 이상의 프로그래밍 언어를 지원하는 시맨틱 코드 분석 MCP 서버입니다.

## 개요

`sdd reverse` 명령어는 기존 코드베이스에서 스펙을 추출하기 위해 Serena MCP를 사용합니다.
Serena는 다음 기능을 제공합니다:

- **심볼 분석**: 클래스, 함수, 인터페이스 등 코드 심볼 추출
- **참조 추적**: 심볼 간 의존성 관계 분석
- **패턴 검색**: 정규식 기반 코드 검색
- **다중 언어**: 30+ 프로그래밍 언어 지원

## 지원 언어

### 주요 언어
- TypeScript / JavaScript
- Python
- Java / Kotlin
- Go
- Rust

### 시스템 언어
- C / C++
- C#
- Zig
- Nim

### 함수형 언어
- Haskell
- OCaml / F#
- Clojure
- Elixir / Erlang

### 스크립팅
- Ruby
- PHP
- Perl
- Lua
- R / Julia

### 기타
- Swift
- Scala
- Dart
- Crystal
- V / Odin

## 설치 방법

### 1. Serena MCP 설치

#### Python 사용자
```bash
pip install serena-mcp
```

#### Node.js 사용자
```bash
npm install -g @serena-ai/mcp
```

#### 소스에서 설치
```bash
git clone https://github.com/serena-ai/serena-mcp
cd serena-mcp
pip install -e .
```

### 2. Claude Code MCP 설정

Claude Code 설정에서 Serena MCP 서버를 추가합니다.

#### 방법 A: 설정 UI
1. Claude Code 실행
2. Settings (⚙️) → MCP Servers
3. "Add Server" 클릭
4. Serena 서버 정보 입력

#### 방법 B: 설정 파일
`~/.claude/mcp_settings.json`:
```json
{
  "mcpServers": {
    "serena": {
      "command": "serena-mcp",
      "args": ["--project", "."],
      "env": {}
    }
  }
}
```

### 3. 프로젝트 활성화

Claude Code에서 Serena 도구를 사용하려면 프로젝트를 활성화해야 합니다:

```
mcp__serena__activate_project 프로젝트_경로
```

## 사용 확인

### 연결 상태 확인
```bash
# SDD CLI에서
sdd reverse --check-serena

# Claude Code에서
mcp__serena__get_current_config
```

### 기본 테스트
```bash
# 디렉토리 목록 조회
mcp__serena__list_dir .

# 파일 심볼 분석
mcp__serena__get_symbols_overview src/index.ts
```

## 주요 도구

### 파일 시스템

| 도구 | 설명 |
|------|------|
| `list_dir` | 디렉토리 내용 조회 |
| `find_file` | 파일 검색 (glob 패턴) |
| `read_file` | 파일 읽기 |

### 심볼 분석

| 도구 | 설명 |
|------|------|
| `get_symbols_overview` | 파일의 심볼 개요 |
| `find_symbol` | 심볼 검색 |
| `find_referencing_symbols` | 참조하는 심볼 찾기 |

### 검색

| 도구 | 설명 |
|------|------|
| `search_for_pattern` | 정규식 패턴 검색 |

## sdd reverse 워크플로우

### 1. 프로젝트 스캔
```bash
sdd reverse scan
```

Serena를 사용하여 프로젝트 구조를 분석하고 도메인을 추정합니다.

### 2. 스펙 추출
```bash
sdd reverse extract src/auth/
```

코드에서 스펙 초안을 추출합니다:
- 클래스/함수 시그니처
- 타입 정보
- 주석/문서
- 의존성 관계

### 3. 리뷰 및 수정
```bash
sdd reverse review
```

추출된 스펙을 검토하고 수정합니다.

### 4. 확정
```bash
sdd reverse finalize
```

승인된 스펙을 정식 스펙으로 변환합니다.

## 트러블슈팅

### Serena 연결 실패

**증상**: `Serena MCP가 필요합니다` 에러

**해결**:
1. Serena 설치 확인: `pip show serena-mcp`
2. MCP 설정 확인: `~/.claude/mcp_settings.json`
3. Claude Code 재시작

### 프로젝트 활성화 실패

**증상**: `프로젝트를 활성화할 수 없습니다` 에러

**해결**:
1. 프로젝트 경로 확인
2. 언어 서버 설치 확인 (해당 언어)
3. `mcp__serena__get_current_config`로 상태 확인

### 심볼을 찾을 수 없음

**증상**: `심볼을 찾을 수 없습니다` 에러

**해결**:
1. 언어 지원 확인
2. 파일이 프로젝트에 포함되어 있는지 확인
3. `.gitignore` 패턴 확인

## 참고 링크

- [Serena MCP GitHub](https://github.com/serena-ai/serena-mcp)
- [Serena 문서](https://docs.serena.ai/mcp)
- [SDD CLI 문서](/cli/reverse)
- [역추출 가이드](/guide/reverse-extraction)

## 개발/테스트 모드

Serena 없이 테스트하려면:

```bash
# 환경 변수로 체크 건너뛰기
SDD_SKIP_SERENA_CHECK=true sdd reverse scan

# CLI 옵션으로 건너뛰기
sdd reverse scan --skip-serena-check
```

> ⚠️ 이 모드는 개발/테스트 용도로만 사용하세요. 실제 스펙 추출은 Serena가 필요합니다.
