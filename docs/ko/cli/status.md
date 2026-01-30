# sdd status

프로젝트 상태를 조회합니다.

## 사용법

```bash
sdd status
```

## 설명

현재 SDD 프로젝트의 상태를 표시합니다:

- 스펙 파일 수
- Phase별 분포
- 상태별 분포 (draft, review, approved, implemented)
- Constitution 버전

## 출력 예시

```
📊 프로젝트 상태

스펙: 12개
├── Phase 1: 4개
├── Phase 2: 5개
└── Phase 3: 3개

상태:
├── draft: 3개
├── review: 2개
├── approved: 4개
└── implemented: 3개

Constitution: v1.0.0
```

## 관련 명령어

- [`sdd list`](/cli/list) - 항목 목록 조회
- [`sdd validate`](/cli/validate) - 스펙 검증
