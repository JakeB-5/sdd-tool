# sdd init

프로젝트를 SDD Tool로 초기화합니다.

## 사용법

```bash
sdd init [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `-f, --force` | 기존 설정 덮어쓰기 |
| `--skip-git-setup` | Git/CI-CD 설정 건너뛰기 |
| `--auto-approve` | 모든 설정을 자동 승인 |

## 생성되는 파일

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법 템플릿
│   ├── AGENTS.md           # AI 워크플로우 가이드
│   ├── specs/              # 기능 명세 디렉토리
│   ├── changes/            # 변경 제안 디렉토리
│   ├── archive/            # 완료된 변경 아카이브
│   └── templates/          # 스펙 템플릿
│
└── .claude/
    └── commands/           # 슬래시 커맨드 (29개)
        ├── sdd.start.md
        ├── sdd.new.md
        ├── sdd.plan.md
        └── ...
```

## Git 워크플로우 설정

초기화 완료 후, 프로젝트 구조를 분석하고 Git 워크플로우 설정을 제안합니다:

1. **Git Hooks 설치**: 커밋/푸시 시 자동 스펙 검증
2. **커밋 템플릿 설치**: 일관된 커밋 메시지 형식
3. **GitHub Actions 설정**: PR 시 자동 검증 및 라벨링

각 설정은 **사용자 승인 후** 실행됩니다.

## 예시

### 기본 초기화 (대화형)

```bash
sdd init
```

출력 예시:
```
SDD 프로젝트를 초기화합니다...
✓ SDD 프로젝트가 초기화되었습니다.

🔍 프로젝트 구조를 분석합니다...

=== 프로젝트 분석 결과 ===

📁 프로젝트 타입:
   TypeScript (Node.js)

🔧 Git 상태:
   저장소: ✅ 초기화됨
   Hooks: ❌ 미설치
   커밋 템플릿: ❌ 없음

🚀 CI/CD 상태:
   GitHub Actions: ❌ 미설정

📋 권장 설정:
   • Git Hooks: 커밋/푸시 시 자동 스펙 검증
   • 커밋 템플릿: 일관된 커밋 메시지 형식
   • GitHub Actions: PR 시 자동 검증 및 라벨링

Git 워크플로우(Hooks + 템플릿)를 설치하시겠습니까? (y/n): y
✓ Git 워크플로우 설치 완료!

GitHub Actions CI/CD를 설정하시겠습니까? (y/n): y
✓ sdd-validate.yml 생성 완료
✓ sdd-labeler.yml 생성 완료
```

### 자동 승인 (CI/스크립트용)

```bash
sdd init --auto-approve
```

모든 설정이 질문 없이 자동으로 적용됩니다.

### Git 설정 건너뛰기

```bash
sdd init --skip-git-setup
```

SDD 구조만 초기화하고 Git/CI-CD 설정은 건너뜁니다.

### 기존 설정 덮어쓰기

```bash
sdd init --force
```

## 초기화 후

1. Claude Code 실행: `claude`
2. 워크플로우 시작: `/sdd.start`

## 관련 문서

- [sdd git](/cli/git) - Git 워크플로우 설정
- [sdd cicd](/cli/cicd) - CI/CD 파이프라인 설정
- [커밋 컨벤션](/guide/commit-convention)
- [CI/CD 설정 가이드](/guide/cicd-setup)
