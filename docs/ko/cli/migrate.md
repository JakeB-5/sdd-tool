# sdd migrate

기존 문서나 외부 SDD 도구에서 마이그레이션합니다.

## 사용법

```bash
sdd migrate [command] [options]
```

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `detect` | 외부 SDD 도구 감지 (`-p, --path <path>`로 검색 경로 지정) |
| `openspec [source]` | OpenSpec 프로젝트에서 마이그레이션 |
| `speckit [source]` | Spec Kit 프로젝트에서 마이그레이션 |
| `docs <source>` | 마크다운 문서를 스펙으로 변환 |
| `analyze <file>` | 문서 SDD 호환성 분석 |
| `scan [dir]` | 마이그레이션 가능한 문서 스캔 |

## 옵션

| 옵션 | 적용 대상 | 설명 |
|------|-----------|------|
| `--dry-run` | `docs`, `openspec`, `speckit` | 실제 파일 생성 없이 미리보기 |
| `--overwrite` | `openspec`, `speckit` | 기존 스펙 덮어쓰기 |
| `-o, --output <dir>` | `docs` | 출력 디렉토리 지정 |
| `--ext <extensions>` | `scan` | 파일 확장자 필터 (기본: .md) |

## 예시

### 외부 도구 감지

```bash
sdd migrate detect
```

출력:
```
🔍 외부 SDD 도구 감지 중...
   경로: /my-project

📦 OpenSpec
   경로: ./openspec
   신뢰도: 높음 ✓
   스펙 수: 5개

💡 마이그레이션 명령어:
  • sdd migrate openspec "./openspec"
```

### OpenSpec에서 마이그레이션

```bash
sdd migrate openspec
```

출력:
```
🔄 OpenSpec에서 마이그레이션 중...
   소스: ./openspec
   대상: ./.sdd

✅ 마이그레이션 완료
   생성: 5개
   스킵: 0개
```

### Spec Kit에서 마이그레이션

```bash
sdd migrate speckit
```

출력:
```
🔄 Spec Kit에서 마이그레이션 중...
   소스: ./.specify
   대상: ./.sdd

✅ 마이그레이션 완료
   생성: 3개
   스킵: 1개 (이미 존재)
```

### 마크다운 문서 변환

```bash
sdd migrate docs ./docs/features
```

출력:
```
3개 파일 발견

✅ login.md → .sdd/specs/login/spec.md
✅ signup.md → .sdd/specs/signup/spec.md
✅ profile.md → .sdd/specs/profile/spec.md

=== 마이그레이션 완료 ===
총: 3개, 성공: 3개, 실패: 0개
```

### 문서 호환성 분석

```bash
sdd migrate analyze ./docs/auth.md
```

출력:
```
📊 문서 분석: auth.md

제목: 인증 시스템
설명: JWT 기반 인증

SDD 호환성:
  ✅ RFC 2119 키워드: 5개
  ✅ GIVEN-WHEN-THEN 시나리오: 2개

발견된 요구사항:
  • 시스템은 JWT 토큰을 발급해야 한다(SHALL)
  • 토큰 만료 시간은 24시간이어야 한다(SHOULD)
  ... 외 3개

💡 권장사항:
  • 이 문서는 SDD 형식으로 마이그레이션하기에 적합합니다!
  • `sdd migrate docs ./docs/auth.md`로 마이그레이션하세요.
```

### 디렉토리 스캔

```bash
sdd migrate scan ./docs
```

출력:
```
📂 스캔 결과: ./docs

🟢 마이그레이션 준비됨:
  • docs/auth.md
  • docs/payment.md

🟡 일부 수정 필요:
  • docs/api.md

🔴 추가 작업 필요:
  • docs/readme.md
  ... 외 2개

=== 요약 ===
총: 6개, 준비됨: 2개, 일부: 1개, 미준비: 3개

다음 명령어로 마이그레이션을 시작하세요:
  • sdd migrate docs docs/auth.md
```

## 지원하는 외부 도구

| 도구 | 감지 기준 |
|------|----------|
| OpenSpec | `openspec/` 디렉토리, `AGENTS.md` 파일 |
| Spec Kit | `.specify/` 디렉토리, `memory/constitution.md` |

## 관련 문서

- [sdd init](./init) - 프로젝트 초기화
- [CLI 참고 문서](./) - 전체 명령어
