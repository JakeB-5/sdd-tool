# /sdd-reverse

레거시 코드베이스에서 SDD 스펙을 역추출합니다.

## 사용법

```
/sdd-reverse scan [path]         # 프로젝트 구조 스캔
/sdd-reverse extract [path]      # 코드에서 스펙 추출
/sdd-reverse review [spec-id]    # 추출된 스펙 리뷰
/sdd-reverse finalize [spec-id]  # 승인된 스펙 확정
```

## 전체 워크플로우

```
scan → extract → review → finalize
```

### 1. Scan (스캔)

프로젝트를 분석하여 디렉토리 구조, 언어 분포, 도메인을 추정합니다.

```
/sdd-reverse scan
/sdd-reverse scan src/
/sdd-reverse scan --json
```

### 2. Extract (추출)

스캔 결과를 기반으로 코드에서 스펙 초안을 추출합니다.

```
/sdd-reverse extract
/sdd-reverse extract --domain auth
/sdd-reverse extract --depth deep
```

### 3. Review (리뷰)

추출된 스펙 초안을 리뷰하고 승인/거부합니다.

```
/sdd-reverse review              # 리뷰 목록 표시
/sdd-reverse review auth/login   # 특정 스펙 상세
```

### 4. Finalize (확정)

승인된 스펙을 정식 SDD 스펙으로 변환합니다.

```
/sdd-reverse finalize --all      # 모든 승인 스펙 확정
/sdd-reverse finalize auth/login # 특정 스펙 확정
```

## 출력 파일

- **스캔 결과**: `.sdd/.reverse-meta.json`
- **스펙 초안**: `.sdd/.reverse-drafts/<domain>/<spec>.json`
- **확정 스펙**: `.sdd/specs/<domain>/<spec>.md`

## 참고사항

- Serena MCP가 연결되면 심볼 수준 분석이 가능합니다
- 추출된 스펙은 반드시 리뷰 후 확정해야 합니다
- 신뢰도가 낮은 스펙은 수정이 필요할 수 있습니다
