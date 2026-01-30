# sdd export

스펙을 다양한 형식으로 내보냅니다.

## 사용법

```bash
sdd export [specId...] [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `specId` | 내보낼 스펙 ID (여러 개 가능) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--all` | 전체 스펙 내보내기 |
| `-f, --format <format>` | 형식 (html, json, markdown) |
| `-o, --output <path>` | 출력 경로 |
| `--theme <theme>` | 테마 (light, dark) |
| `--no-toc` | 목차 제외 |

## 형식

### HTML

반응형 스타일, 목차, RFC 2119 키워드 강조 포함:

```bash
sdd export user-auth --format html
```

### JSON

구조화된 요구사항/시나리오 데이터:

```bash
sdd export user-auth --format json
```

### Markdown

여러 스펙을 하나의 파일로 병합:

```bash
sdd export --all --format markdown
```

## 예시

### 단일 스펙 HTML

```bash
sdd export user-auth
```

### 전체 스펙 내보내기

```bash
sdd export --all
```

### 다크 테마

```bash
sdd export user-auth --theme dark
```

### 출력 경로 지정

```bash
sdd export --all -o ./docs/specs.html
```

### 목차 제외

```bash
sdd export user-auth --no-toc
```

## 출력 예시

### HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <title>SDD 스펙: user-auth</title>
  <style>/* 내장 스타일 */</style>
</head>
<body>
  <nav class="toc">목차</nav>
  <main>
    <h1>user-auth</h1>
    <section id="requirements">요구사항</section>
    <section id="scenarios">시나리오</section>
  </main>
</body>
</html>
```

### JSON 구조

```json
{
  "id": "user-auth",
  "title": "사용자 인증",
  "requirements": [
    {
      "id": "REQ-001",
      "title": "로그인",
      "keyword": "SHALL"
    }
  ],
  "scenarios": [
    {
      "id": "scenario-1",
      "given": ["유효한 계정"],
      "when": ["로그인 시도"],
      "then": ["성공"]
    }
  ]
}
```
