# Prototype 07 - Threat Origin Types

상태: `1차 구현`

이 프로토타입은 완성형 전투 시스템이 아니라, 공격 원천 타입별 차이가 플레이어에게 읽히는지 확인하기 위한 실험입니다.

## 목적

`prototype-06-attack-source-trajectory`에서 확인한 공격 원천 표시, launch pulse, 단순 접근 경로, Lunar Defense Zone 접근 흐름을 바탕으로, 위협이 어디서 오는지에 따라 플레이 감각이 달라지는지 확인한다.

이번 단계의 핵심은 실제 궤도 물리나 완성형 전투 루프가 아니라, `Earth Surface Source`, `Orbital Source`, `Under-Horizon Approach`가 화면에서 서로 다르게 읽히는지 보는 것이다.

기존 `Behind Surface Approach`라는 이름은 위협이 달 뒤쪽이나 달 표면 아래에서 발생하는 것으로 오해될 수 있어 `Under-Horizon Approach`로 정리했다. 이 접근의 발사 원천은 달이 아니라 지구 아래쪽 또는 지구 아래쪽의 낮은 궤도다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: 정면 보기 약 `30%`, 아래 보기 약 `50%` ~ `80%`
- Lunar Defense Zone Surface Depth: 보이는 달 표면 영역 안에서 약 `60%`
- Aim Guide Radius: 화면 중앙 조준 기준점 기준 `64px`
- View Movement: 이전 prototype과 같은 제한된 좌우/상하 이동 범위

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 공격 원천 타입별 감각을 확인하기 위한 prototype 기준값이다.

## 조작 방법

- Mouse Move: Canvas 클릭 후 제한된 시야 이동
- Canvas 드래그: Pointer Lock이 제한되는 환경에서 마우스 시야 이동 확인
- Mouse Click: 발사 입력
- Space: 발사 입력
- WASD 또는 Arrow keys: 보조 시야 이동
- `R`: 기본 정면 보기로 복귀
- `5`: Earth Scale 5x
- `6`: Earth Scale 6x
- `7`: Earth Scale 7x
- `N`: 새 위협 생성 / Restart
- 화면 버튼: Earth Scale 전환, 기본 정면 보기 복귀, 새 위협 생성 / Restart, Origin / Approach Type 선택

## Origin Type과 Approach Type

- `Origin Type`: 위협이 어디서 출발하는가를 나타낸다.
- `Approach Type`: 위협이 플레이어 시야에서 어떻게 보이고, 가려지고, 접근하는가를 나타낸다.

현재 UI는 비교를 단순하게 유지하기 위해 세 항목을 같은 버튼 그룹에 둔다. `Earth Surface Source`와 `Orbital Source`는 Origin Type이고, `Under-Horizon Approach`는 낮은 지구/궤도 원천에서 출발한 위협의 Approach Type이다.

## 타입 설명

### Earth Surface Source

지구 표면 또는 지구 가장자리 근처에서 출발하는 위협을 확인한다. 실제 지구 표면 좌표 계산은 하지 않고, 지구 가장자리 후보 지점에 source marker와 launch pulse를 표시한다.

### Orbital Source

지구 표면이 아니라 지구 주변 궤도상의 원천에서 출발하는 위협을 확인한다. 실제 공격 위성 궤도 계산은 하지 않고, 얇은 orbit guide와 orbital source marker를 시각 가이드로만 표시한다.

### Under-Horizon Approach

지구 아래쪽의 `Low Earth Source` 또는 지구 하단의 `Low Orbital Source`에서 출발한 위협이 달 표면/시야 지평선에 잠시 가려졌다가 보이는 하늘 영역으로 올라오는 접근을 확인한다. source marker와 launch pulse는 지구 하단 또는 지구 하단 궤도에 표시하며, 달 표면에서는 위협이 발사되지 않는다.

경로는 `source → hidden waypoint → reveal waypoint → Lunar Defense Zone` 순서의 단순 곡선으로 구성한다. 초기에는 `Detected / Occluded`와 `Impact Warning`으로 읽히고, 진행 중 달 표면 위의 reveal point에 도달하면 시선을 아래로 돌렸는지와 무관하게 반드시 `Visual Contact`가 된다. 이후 보이는 하늘 영역에서 Lunar Defense Zone 위쪽으로 접근한 뒤 표면 방어 지점을 향해 내려온다.

## 위협 상태 구분

- `Off-screen`: 위협이 화면 밖에 있으며 edge indicator로 방향만 안내한다.
- `Detected / Occluded`: 위협이 현재 표시되는 달 표면 영역에 가려졌거나, Under-Horizon 경로의 reveal waypoint에 아직 도달하지 않아 실제로 보이지 않는 상태로 본다.
- `Visual Contact`: 위협이 화면 안에 있고 달 표면에 가려지지 않아 실제로 볼 수 있는 상태로 본다.
- `Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 crosshair의 가이드 반경 안에 들어온 상태이다.
- `Intercepted`: `Lock Ready` 상태에서 발사 입력을 받아 요격 성공으로 처리된 상태이다.
- `Impact Warning`: 위협 접근 진행도가 높거나 Under-Horizon 접근 초기 경고가 필요한 상태 메시지이다.
- `Threat Passed`: 위협이 접근 경로 끝까지 도달한 상태 메시지이다.

`Under-Horizon Approach`의 핵심 상태 흐름은 `Detected / Occluded → Visual Contact → Lock Ready → Intercepted`이다. 가려진 구간에서는 중앙 crosshair 근처에 있더라도 `Lock Ready`가 되지 않는다.

## Lock Ready 규칙

- 위협이 화면 밖에 있으면 `Lock Ready`가 되지 않는다.
- 위협이 달 표면에 가려져 있으면 중앙 crosshair 근처에 있어도 `Lock Ready`가 되지 않는다.
- 위협이 `Visual Contact` 상태이고 화면 중앙 crosshair 근처에 있을 때만 `Lock Ready`가 된다.
- `Lock Ready`는 실제 무기 락온 완료가 아니라, 조준 중심 정렬 감각을 확인하기 위한 prototype 상태이다.

## 발사/요격 규칙

- `Lock Ready` 상태에서 Mouse Click 또는 Space 입력을 하면 `Intercepted` 상태가 된다.
- 요격 성공 시 위협 마커를 제거하고 짧은 flash와 burst circle을 표시한다.
- `Visual Contact` 상태지만 `Lock Ready`가 아니면 발사해도 요격 성공 처리하지 않고 `Not Aligned` 메시지만 표시한다.
- `Detected / Occluded` 상태에서는 발사해도 요격 성공 처리하지 않고 `Occluded` 메시지만 표시한다.
- 화면 밖 위협에는 발사해도 요격 성공 처리하지 않고 `No Visual Contact` 메시지만 표시한다.
- `Threat Passed` 이후 발사해도 요격 성공 처리하지 않고 상태 메시지만 표시한다.
- 실패/패널티는 이번 단계에서 넣지 않는다.

## 포함한 기능

- 2D Canvas 기반 달-지구 기본 배경
- Earth Scale 5x/6x/7x 비교
- Earth Vertical Position 30%, 동적 Lunar Surface Area 기준 구도
- 마우스 기반 제한 시야 이동
- WASD/Arrow keys 보조 시야 이동
- 화면 밖 위협 방향을 알려주는 edge indicator
- 화면 중앙에 고정된 crosshair
- 화면 중앙 기준 Lock Ready 판정 범위 가이드
- Origin / Approach Type 선택 UI
- 타입별 source marker, launch pulse, 단순 접근 경로
- Orbital Source용 얇은 orbit guide
- Under-Horizon Approach용 Low Earth / Low Orbital source marker와 launch pulse
- 시야 지평선 아래의 가려진 구간을 알리는 `Occluded Track` cue
- hidden waypoint에서 보이는 하늘의 reveal waypoint로 올라온 뒤 Lunar Defense Zone으로 하강하는 단순 곡선 경로
- Lunar Defense Zone을 달 표면 내부 surface depth 약 60% 지점에 표시
- Earth Surface / Orbital Source는 동적 달 표면 영역, Under-Horizon Approach는 hidden / reveal waypoint 기준으로 처리하는 Occluded / Visual Contact 판정
- 움직이는 위협 1개
- Mouse Click과 Space를 통한 발사 입력
- 요격 성공 시 간단한 flash, burst circle, 위협 비활성화
- 새 위협 생성 / Restart 버튼과 `N` 키 입력
- 현재 상태 패널

## 제외한 기능

점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현, 사운드, 실제 총알/요격체 궤적, 실제 탄도 계산, 실제 중력 계산, 실제 공격 위성 궤도 계산, 실제 달 뒤편 물리 계산, 실제 지구 남극 좌표 계산, 지구 표면의 정확한 발사 좌표 계산은 이번 범위에서 제외합니다.

또한 복잡한 폭발 연출, 실제 무기 시스템 확정, 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다. 이번 단계에서는 waypoint와 단순 곡선 경로로 가려짐과 등장 감각만 확인한다.

## 확인할 질문

- Earth Surface Source와 Orbital Source가 시각적으로 구분되는가?
- Under-Horizon Approach의 출발 원천이 달이 아니라 지구 하단 또는 낮은 궤도로 읽히는가?
- 초기 가려짐 뒤 위협이 보이는 하늘 영역으로 올라와 Visual Contact가 되는가?
- 공격 원천 타입이 바뀌어도 edge indicator, Occluded, Visual Contact, Lock Ready 흐름이 유지되는가?
- 플레이어가 “이번 위협은 어디서 오는가”를 빠르게 이해할 수 있는가?
- 이후 실제 공격 위성, 낮은 원천 접근, 궤도 경로, 난이도 설계로 확장할 수 있는가?

## 다음 단계 후보

- Earth Surface Source / Orbital Source 시각 표현 개선
- Under-Horizon Approach의 hidden / reveal waypoint와 타이밍 조정
- 달 표면/충돌 연출 문제 검토
- 실제 공격 궤도 후보 검토
- 마우스 감도와 시야 이동 범위 조정
- fullscreen mode 검토
- 이후 별도 단계에서 실제 요격체 궤적 검토
