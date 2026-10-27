# sdd git

Git 워크플로우를 설정합니다.

## 사용법

```bash
sdd git <subcommand> [options]
```

## 서브커맨드

### hooks

Git hooks를 설치하거나 제거합니다.

```bash
# hooks 설치
sdd git hooks install

# hooks 제거
sdd git hooks uninstall
```

**설치되는 훅:**

| 훅 | 시점 | 동작 |
|----|------|------|
| `pre-commit` | 커밋 전 | `.sdd/specs/` 아래 파일이 스테이징되면 `sdd validate`(전체 스펙) 실행 |
| `commit-msg` | 커밋 메시지 작성 후 | 첫 줄 형식 `<type>(<scope>): <message>` 검증 ([커밋 컨벤션](/ko/guide/commit-convention)) |
| `pre-push` | 푸시 전 | 전체 스펙 검증 |

훅은 POSIX sh 스크립트입니다. `uninstall`은 SDD 마커가 있는 훅만 제거하고, `--force`는 기존 훅을 교체하며
(원본은 한 번 백업), 저장소 밖의 훅(`core.hooksPath`)은 거부합니다.

### template

커밋 메시지 템플릿을 설치합니다.

```bash
sdd git template install
```

Git 설정에 `.gitmessage` 템플릿이 등록됩니다.

### setup

전체 Git 워크플로우를 한 번에 설정합니다.

```bash
sdd git setup
```

**설정 내용:**
- Git hooks 설치
- 커밋 메시지 템플릿(`.gitmessage`) 설치

## 옵션

| 옵션 | 설명 |
|------|------|
| `-f, --force` | 기존 훅 / 설정 덮어쓰기 (`sdd git hooks install`, `sdd git setup`) |
| `--help` | 도움말 |

## 예시

```bash
# 전체 설정 (권장)
sdd git setup

# hooks만 설치
sdd git hooks install

# 특정 훅 제거
sdd git hooks uninstall
```

## 관련 문서

- [커밋 컨벤션](/guide/commit-convention)
- [브랜치 전략](/guide/branch-strategy)
- [CI/CD 설정](/guide/cicd-setup)
