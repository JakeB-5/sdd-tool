# sdd prompt

SDD 프롬프트를 출력합니다.

## 사용법

```bash
sdd prompt [type] [options]
```

## 프롬프트 타입

| 타입 | 설명 |
|------|------|
| `system` | 시스템 프롬프트 (기본) |
| `spec` | 스펙 작성 프롬프트 |
| `plan` | 계획 작성 프롬프트 |
| `tasks` | 작업 분해 프롬프트 |
| `review` | 리뷰 프롬프트 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--raw` | 마크다운 없이 원본 텍스트 출력 |
| `--copy` | 클립보드에 복사 |
| `-o, --output <file>` | 파일로 저장 |

## 예시

### 시스템 프롬프트 출력

```bash
sdd prompt
```

출력:
```
=== SDD System Prompt ===

당신은 Spec-Driven Development(SDD) 전문가입니다.

## 핵심 원칙

1. 명세 우선: 코드보다 명세가 먼저입니다
2. RFC 2119: SHALL, MUST, SHOULD, MAY 키워드 사용
3. GIVEN-WHEN-THEN: 시나리오 기반 요구사항 정의

## 워크플로우

...
```

### 스펙 작성 프롬프트

```bash
sdd prompt spec
```

### 파일로 저장

```bash
sdd prompt system -o ./prompts/sdd-system.md
```

### 클립보드에 복사

```bash
sdd prompt spec --copy
```

출력:
```
✅ 프롬프트가 클립보드에 복사되었습니다.
```

## 사용 시나리오

### 외부 AI 도구에서 사용

SDD 프롬프트를 다른 AI 도구(ChatGPT, Gemini 등)에서 사용할 때:

```bash
# 프롬프트를 클립보드에 복사
sdd prompt system --copy

# 외부 AI 도구에 붙여넣기
```

### 커스텀 워크플로우

```bash
# 프롬프트를 파일로 저장
sdd prompt spec -o ./custom-prompts/spec.md

# 필요에 따라 수정 후 사용
```

## 관련 문서

- [CLI 참고 문서](./) - 전체 명령어
