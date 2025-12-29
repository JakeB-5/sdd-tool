# /dev-status

SDD CLI 구현 진행 상황을 분석하고 Phase별 스펙 현황, 구현 완료율, 테스트 통과율을 보고합니다.

## 사용법

```
/dev-status
/dev-status --detailed
/dev-status --phase <n>
```

## 분석 항목

1. **Phase별 진행 상황**
   - `.sdd/.tasks/phase-*.md` 파일 분석
   - 완료/진행중/대기 태스크 집계

2. **스펙 현황**
   - `.sdd/specs/` 디렉토리의 스펙 수
   - 구현 완료된 스펙 수
   - 도메인별 분포

3. **테스트 현황**
   - `npx vitest run --reporter=json` 실행
   - 통과/실패/건너뛴 테스트 수
   - 커버리지 (있는 경우)

4. **코드 통계**
   - 소스 파일 수
   - 테스트 파일 수
   - LOC (Lines of Code)

## 출력 형식

```
📊 SDD CLI 구현 현황

🔹 Phase 1: 기본 CLI (완료)
   ✅ 32/32 태스크 완료

🔹 Phase 1-G: 도메인/컨텍스트 (완료)
   ✅ 16/16 태스크 완료

🔹 Phase 1-R: Reverse Engineering (진행중)
   🔄 24/49 태스크 완료 (49%)

📁 스펙: 45개 (35개 구현됨)
🧪 테스트: 1333개 통과 / 0개 실패
📄 코드: 12,500 LOC

💡 다음 작업: /dev-next 실행
```

## 참고사항

- 실시간 데이터를 분석합니다
- 테스트 실행에 시간이 걸릴 수 있습니다
- `--detailed` 옵션으로 상세 정보를 볼 수 있습니다
