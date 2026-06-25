# Changelog

## Unreleased

### Added

- `prototype-03-threat-aim-lock`을 추가해 시야 내 포착한 위협을 화면 중앙 조준 기준점에 맞추는 감각을 확인할 수 있게 함
- `prototype-03-threat-aim-lock`에 중앙 조준 기준점, 조준 가능 범위 가이드, `Aim Aligned / Lock Ready` 상태 표시를 추가
- 루트 prototype 런처에서 `prototype-03-threat-aim-lock`으로 이동하는 링크 추가
- `prototype-02-threat-direction-scan`을 추가해 마우스 기반 시야 이동으로 화면 밖 또는 지구 주변의 위협 방향을 찾는 감각을 확인할 수 있게 함
- `prototype-02-threat-direction-scan`에 단순 위협 마커, edge indicator, `시야 내 포착` 상태 표시를 추가
- 루트 prototype 런처에서 `prototype-02-threat-direction-scan`으로 이동하는 링크 추가
- `prototype-01-lunar-view-control`을 추가해 달-지구 기본 구도와 제한된 시야 이동 감각을 확인할 수 있게 함
- Earth Scale 5x/7x 전환과 Lunar Surface Area 30%, Earth Vertical Position 30% 기준 화면을 추가
- 루트 prototype 런처에서 `prototype-01-lunar-view-control`로 이동하는 링크 추가
- Codex 반복 작업 지침을 담은 `AGENTS.md` 추가
- 초기 prototype lab scaffold 추가
- 루트 prototype 런처 페이지 추가
- 첫 번째 prototype placeholder `prototype-01-basic-defense` 추가
- prototype 추적과 결정 기록을 위한 문서 추가

### Changed

- `prototype-03-threat-aim-lock`의 조준 가능 범위와 `Aim Aligned / Lock Ready` 판정을 현재 보이는 Canvas 화면 전체 기준으로 정리
- `prototype-03-threat-aim-lock`의 위협 후보를 제한된 view offset 안에서 중앙 crosshair까지 가져올 수 있는 FPS식 조준 흐름에 맞게 조정
- 루트 prototype 런처 카드의 번호 라벨, 제목, `Open` 버튼 텍스트, 최신순 표시를 정리
- `prototype-02-threat-direction-scan`에서 화면 밖 위협, 달 표면에 가려진 감지 상태, 실제 시야 내 포착 상태를 구분하도록 조정
- `prototype-01-lunar-view-control`에 조준이 아닌 시야 조작감 확인용 Mouse View Mode, 드래그 fallback, 감도 선택을 추가
- `prototype-01-lunar-view-control` 현재 설정 패널의 수치 항목 순서를 정정하고 `Reset View` 동작 설명을 문서화
- `prototype-01-lunar-view-control` 현재 설정 패널의 수치 항목 순서와 여백을 정리하고 6x 유지 검토 결과를 문서화
- `prototype-01-lunar-view-control`의 기본 Earth Scale을 6x로 조정하고 현재 설정 패널을 compact하게 정리
- `prototype-01-lunar-view-control`의 시야 이동 범위, WASD/R 입력, Earth Scale 6x, 설정 패널 배치를 개선
- 작업 완료 요약에 추천 커밋 메시지를 포함하도록 `AGENTS.md` 지침 추가
- 루트 prototype 런처 구조와 표시 방식을 simulator 런처 계열에 맞게 정리
- 초기 placeholder였던 `Basic Defense` 항목을 루트 prototype 런처와 활성 prototype 목록에서 제거
- README와 prototype 관련 설명 문서를 한국어 중심으로 정리
- 루트 `index.html`의 사용자 안내 문구를 한국어 중심으로 조정
- `DECISION_LOG.md`에 내부 문서 언어 정책 기록

### Removed

- 초기 구조 확인용 placeholder prototype `prototype-01-basic-defense` 삭제
