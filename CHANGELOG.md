# Changelog

## Unreleased

### Added

- `prototype-07-threat-origin-types`를 추가해 Earth Surface Source, Orbital Source, Behind Surface Approach의 차이를 확인할 수 있게 함
- `prototype-07-threat-origin-types`에 Origin Type 선택과 타입별 source marker, launch pulse, 단순 접근 경로를 추가
- `prototype-07-threat-origin-types`에서 기존 edge indicator, Visual Contact, Lock Ready, Mouse Click/Space 요격 피드백 흐름을 유지
- 루트 prototype 런처에서 `prototype-07-threat-origin-types`로 이동하는 링크 추가
- `prototype-06-attack-source-trajectory`를 추가해 공격 원천에서 위협이 출발해 접근하고 요격되는 흐름을 확인할 수 있게 함
- `prototype-06-attack-source-trajectory`에 Earth Source / Orbital Source 공격 원천 마커와 launch pulse 표시를 추가
- `prototype-06-attack-source-trajectory`에서 공격 원천 근처에서 시작하는 단순 위협 접근 경로를 추가
- `prototype-06-attack-source-trajectory`에서 움직이는 위협 추적, Lock Ready, Mouse Click/Space 요격 피드백 흐름을 유지
- 루트 prototype 런처에서 `prototype-06-attack-source-trajectory`로 이동하는 링크 추가
- `prototype-05-threat-approach-timing`을 추가해 움직이는 위협을 찾고 조준하고 요격하는 시간 감각을 확인할 수 있게 함
- `prototype-05-threat-approach-timing`에 단순 곡선 경로를 따라 접근하는 움직이는 위협 1개를 추가
- `prototype-05-threat-approach-timing`에 Slow / Normal / Fast 위협 속도 선택과 접근 진행 상태 표시를 추가
- `prototype-05-threat-approach-timing`에서 기존 Lock Ready 발사/요격 피드백 흐름을 움직이는 위협 기준으로 유지
- 루트 prototype 런처에서 `prototype-05-threat-approach-timing`으로 이동하는 링크 추가
- `prototype-04-intercept-feedback`을 추가해 Lock Ready 이후 최소 발사/요격 피드백 감각을 확인할 수 있게 함
- `prototype-04-intercept-feedback`에 Mouse Click과 Space 기반 발사 입력을 추가
- `prototype-04-intercept-feedback`에 간단한 요격 성공 피드백과 `Intercepted` 상태 표시를 추가
- 루트 prototype 런처에서 `prototype-04-intercept-feedback`으로 이동하는 링크 추가
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

- `prototype-06-attack-source-trajectory` 검토 결과를 문서화하고 마지막 도달 지점의 달 내부 진입처럼 보이는 표현을 후속 과제로 기록
- `prototype-06-attack-source-trajectory`에서 위협 이동을 `Direct Surface Approach` 단순 곡선으로 보정해 달 표면 내부 방어 지점 위쪽에서 내려오는 흐름을 강화
- `prototype-06-attack-source-trajectory`에서 `Lunar Defense Zone`을 달 지평선 기준이 아닌 달 표면 내부 surface depth 약 60% 지점으로 보정
- `prototype-06-attack-source-trajectory`에서 `Lunar Defense Zone` 마커와 위협 도달 기준을 달 표면에 붙은 방어 지점처럼 보이도록 보정
- `prototype-06-attack-source-trajectory`에서 시야 아래 이동 시 Lunar Surface Area가 증가하도록 보정하고, 위협이 달 표면 위쪽 경계의 `Lunar Defense Zone`으로 접근하도록 조정
- `prototype-06-attack-source-trajectory`에서 위협 시작점을 attack-source 마커와 같은 지점으로 맞추고, 단순 경로가 하단 `Lunar Defense Zone` / 달 방어선 쪽으로 향하도록 보정
- `prototype-03-threat-aim-lock`의 조준 가능 범위와 `Aim Aligned / Lock Ready` 판정을 현재 보이는 Canvas 화면 전체 기준으로 정리
- `prototype-03-threat-aim-lock`에서 지구와 위협 마커가 동일한 view transform을 사용하도록 시야 이동 좌표계를 정리
- `prototype-03-threat-aim-lock`의 위협 위치 계산을 고정 중앙 crosshair와 view offset 기반 screen-space 투영 방식으로 정리
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
