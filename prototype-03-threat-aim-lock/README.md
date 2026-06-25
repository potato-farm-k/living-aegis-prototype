# Prototype 03 - Threat Aim Lock

상태: `1차 구현`

이 프로토타입은 발사/격추 시스템이 아니라, 시야 내 포착한 위협을 화면 중앙 조준 기준점에 맞추는 감각을 확인하기 위한 실험입니다.

## 목적

`prototype-02-threat-direction-scan`에서 확인한 edge indicator, 화면 밖 위협, 달 표면 가림, 시야 내 포착 상태 구분을 바탕으로, 실제로 보이는 위협만 중앙 조준 기준점에 맞출 수 있는지 확인한다.

이번 단계의 핵심은 전투 전체가 아니라 `Visual Contact` 상태의 위협을 화면 중앙에 맞추는 행동이 자연스러운지 보는 것이다. `Lock Ready`는 실제 무기 락온 완료나 발사 가능 상태가 아니라, 조준 중심 정렬 감각을 확인하기 위한 임시 상태이다.

이 프로토타입은 FPS식 중앙 조준 방식을 사용한다. 조준 기준점인 crosshair는 Canvas 화면 중앙에 고정된다. 마우스 입력은 crosshair를 화면 안에서 움직이는 것이 아니라 플레이어 시야, 즉 view offset을 움직인다.

조준 가능 대상은 지구 주변 영역에 한정하지 않고, 현재 보이는 Canvas / viewport 전체를 기준으로 판단한다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: `30%`
- View Movement: `prototype-01-lunar-view-control`, `prototype-02-threat-direction-scan`과 같은 제한된 좌우/상하 이동 범위
- Aim Guide Radius: 화면 중앙 조준 기준점 기준 `64px`

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 조준 중심 정렬 감각을 확인하기 위한 prototype 기준값이다.

## 조작 방법

- Mouse Move: Canvas 클릭 후 제한된 시야 이동
- Canvas 드래그: Pointer Lock이 제한되는 환경에서 마우스 시야 이동 확인
- WASD 또는 Arrow keys: 보조 시야 이동
- `R`: 기본 정면 보기로 복귀
- `5`: Earth Scale 5x
- `6`: Earth Scale 6x
- `7`: Earth Scale 7x
- `N`: 다음 위협 위치로 이동
- 화면 버튼: Earth Scale 전환, 기본 정면 보기 복귀, 다음 위협 위치 이동

마우스 클릭 발사, 조준 사격, 실제 락온 완료, 격추 기능은 포함하지 않는다.

마우스 또는 키보드 입력으로 view offset이 바뀌면 배경, 지구, 달 표면, 위협 마커가 상대적으로 움직인다. crosshair는 view offset 한계에 도달한 뒤에도 화면 중앙에 고정되며, 화면 끝으로 따로 이동하지 않는다.

## 위협 상태 구분

- `Off-screen`: 위협이 화면 밖에 있으며 edge indicator로 방향만 안내한다.
- `Detected / Occluded`: 위협이 화면 안쪽 방향에 들어왔지만 Lunar Surface Area 30% 기준의 달 표면 영역 안에 있어 실제로 보이지 않는 상태로 본다.
- `Visual Contact`: 위협이 화면 안에 있고 달 표면 영역 밖에 있어 실제로 볼 수 있는 상태로 본다.

현재는 달 표면 하단 영역을 기준으로 한 단순 2D 가림 판정을 사용한다. 정교한 달 표면 이미지, 크레이터, 언덕, 공격 위성 궤도선이 추가되면 가림 판정은 다시 조정할 수 있다.

위협 마커는 지구 주변에 있어야만 `Visual Contact`가 되는 것이 아니다. 현재 Canvas 화면 안에 있고 달 표면에 가려져 있지 않다면 화면 어느 위치에 있든 `Visual Contact` 상태가 될 수 있다.

위협은 현재 보이는 화면 안에만 고정 생성되는 것이 아니라, 제한된 view offset으로 탐색 가능한 범위 안에 배치된다. 각 위협 후보는 플레이어가 시야를 움직여 화면 중앙 crosshair 근처까지 가져올 수 있는 위치를 기준으로 둔다.

## 조준 상태 규칙

- `Not Available`: 위협이 화면 밖이거나 달 표면에 가려져 조준 가능 상태로 보지 않는다.
- `Aim Searching`: 위협이 `Visual Contact` 상태지만 화면 중앙 조준 기준점 근처에는 아직 들어오지 않았다.
- `Aim Aligned / Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 조준 기준점의 가이드 반경 안에 들어왔다.

달 표면에 가려진 위협은 중앙 조준 기준점 근처에 있어도 `Lock Ready`가 되면 안 된다. 이번 단계의 `Lock Ready`는 실제 타겟 락온 완료 연출이 아니라, 화면 중앙 정렬 감각 확인용 상태이다.

`Visual Contact`는 현재 화면 안에서 실제로 보이는 상태이고, `Aim Aligned / Lock Ready`는 그 보이는 위협을 화면 중앙 crosshair에 맞춘 상태이다. 화면 안에 보이는 것과 조준 정렬은 서로 다른 상태로 본다.

## 확인할 질문

- 시야 내 포착한 위협을 화면 중앙에 맞추는 행동이 자연스러운가?
- edge indicator → visual contact → aim aligned 흐름이 긴장감을 만드는가?
- 달 표면에 가려진 위협은 조준 가능 상태가 되지 않는가?
- Earth Scale 6x 기준에서 위협 마커와 조준 중심이 잘 읽히는가?
- 이후 발사/격추 단계로 넘어갈 수 있을 만큼 조준 감각이 성립하는가?

## 포함한 기능

- 2D Canvas 기반 달-지구 기본 배경
- Earth Scale 5x/6x/7x 비교
- Earth Vertical Position 30%, Lunar Surface Area 30% 기준 구도
- 마우스 기반 제한 시야 이동
- WASD/Arrow keys 보조 시야 이동
- 화면 밖 또는 현재 Canvas 화면 기준 위협 후보 표시
- 화면 밖 위협 방향을 알려주는 edge indicator
- 화면 중앙에 고정된 조준 기준점
- 화면 중앙 기준 조준 가능 범위 가이드
- crosshair를 움직이지 않고 view offset으로 위협을 중앙에 가져오는 FPS식 조준 흐름
- 위협 상태와 조준 상태를 분리한 현재 상태 패널
- `Visual Contact` 상태에서만 `Aim Aligned / Lock Ready`가 되는 화면 좌표 기반 단순 거리 판정
- 다음 위협 위치로 이동하는 버튼과 `N` 키 입력

## 제외한 기능

플레이어 발사, 미사일 생성, 격추 판정, 점수, 체력, 실패 조건, 적 공격, 사운드, 폭발, 실제 타겟 락온 완료 연출, 실제 궤도 계산은 이번 범위에서 제외합니다.

또한 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다.

## 다음 단계 후보

- 조준 기준점 시각 표현 개선
- Lock Ready 판정 범위 조정
- 발사 입력 전 단계의 긴장감 확인
- 이후 별도 단계에서 발사/격추 루프 검토
