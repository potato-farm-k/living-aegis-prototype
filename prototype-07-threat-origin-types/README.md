# Prototype 07 - Threat Origin Types

상태: `1차 구현`

이 프로토타입은 완성형 전투 시스템이 아니라, 공격 원천의 종류와 위치가 시야 가림, Visual Contact, 접근 감각에 어떤 영향을 주는지 확인하기 위한 실험입니다.

## 목적

`prototype-06-attack-source-trajectory`에서 확인한 source marker, launch pulse, 단순 접근 경로, Lunar Defense Zone 접근 흐름을 바탕으로 다음 개념을 분리해 비교한다.

- `Origin Type`: 어디서 발사됐는가
- `Source Position`: 어느 위치에서 발사됐는가
- `Trajectory Model`: 어떻게 목표로 이동하는가
- `Visibility Behavior`: 현재 화면에서 보이는가, 가려지는가

High / Low는 별도 공격 타입이나 별도 궤적 모델이 아니라, 프로토타입 검토용 source position preset이다. 네 조합은 모두 같은 trajectory generator를 사용하고, 차이는 지구 또는 궤도상의 출발 위치에만 둔다.

## 분류 기준과 테스트 조합

### Origin Type

- `Earth Surface`: 지구 표면 또는 지구 가장자리에서 발사
- `Orbital`: 지구 표면에서 조금 떨어진 지구 주변 궤도 원천에서 발사

### Source Position

- `High`: 지구 또는 지구 주변 궤도의 높은 위치 preset
- `Low`: 지구 하단 또는 지구 아래쪽 궤도의 낮은 위치 preset

현재 UI에서는 아래 네 조합을 선택한다.

- `Earth Surface High`
- `Earth Surface Low`
- `Orbital High`
- `Orbital Low`

### Trajectory Model

모든 조합은 하나의 공통 cubic bezier 기반 world-space trajectory model을 사용한다. 위협의 목표점은 `Lunar Defense Zone` 하나이며, 중간에 반드시 통과해야 하는 고정 하늘 경유점은 두지 않는다.

```text
start = selected source position
end = current Lunar Defense Zone surface anchor
launchDirection = normalize(source position - earth center)
controlA = start + launchDirection × small boost distance
controlB = source와 Lunar Defense Zone 사이의 완만한 접근 control point
trajectory = one smooth cubic bezier from start to end
```

공통 generator는 `sourcePosition - earthCenter`를 정규화한 radial outward 방향에 첫 control point를 짧게 둔다. 이 방향은 위협이 멀리 치솟아 반드시 통과하는 waypoint가 아니라, 발사 직후 지구 바깥쪽으로 살짝 밀려나는 초기 접선이다. 두 번째 control point는 source와 `Lunar Defense Zone`을 잇는 방향 안에서 완만한 곡률을 만들며, 마지막 구간도 별도 하강 단계 없이 같은 곡선으로 목표에 수렴한다.

Earth Surface / Orbital, High / Low는 모두 같은 boost 계산과 같은 trajectory model을 사용한다. High / Low 전용 우회 경로, hidden waypoint, reveal waypoint, behind path는 사용하지 않는다. 이 경로는 실제 탄도, 중력, 지구 탈출 또는 달 비행 궤도 계산이 아니라 공격 원천에서 방어 지점으로 접근하는 감각을 확인하기 위한 단순 곡선이다.

`Visual Contact`는 위협을 고정 하늘 지점으로 보내서 만드는 것이 아니다. 단일 곡선 위의 위협이 현재 화면의 보이는 하늘 영역에 들어오면 `Visual Contact`로 판정하고, 달 표면에 가려져 있으면 `Detected / Occluded`로 판정한다.

`Lunar Defense Zone`은 화면이나 우주공간의 고정 좌표가 아니라 현재 보이는 달 표면 내부의 surface anchor다. 실제 달 위도/경도 대신, 현재 달 지평선에서 화면 하단 방향으로 surface depth 약 `60%` 내려온 위치를 사용한다. 시야 이동으로 달 표면 비중과 지평선이 달라지면 실제 마커와 위협의 최종 목표점도 같은 표면 기준으로 함께 이동한다. 텍스트 라벨은 가독성을 위해 기준점보다 약간 위에 표시한다.

`Impact Warning`은 Visual Contact가 한 번 이상 발생한 뒤 terminal approach 후반부에만 표시한다. 위협이 계속 달 표면에 가려져 있으면 `Detected / Occluded`를 유지하며 `Lock Ready`를 허용하지 않는다.

향후 지구 표면 전체나 다양한 원형/타원 궤도상의 source position을 검토할 때도, 첫 boost 방향은 각 source에서 지구 중심 반대 방향으로 두는 것을 기본 후보로 삼는다.

### Visibility Behavior와 Under-Horizon

`Under-Horizon`은 독립된 Origin Type이나 Trajectory Model이 아니다. 낮은 source position 또는 현재 view offset 때문에 위협이 동적 달 표면 영역 뒤에 놓일 때 자연스럽게 발생하는 visibility behavior다.

```text
위협이 화면 밖에 있음
→ Off-screen / edge indicator

위협이 화면 안이지만 현재 달 표면 영역 뒤에 있음
→ Detected / Occluded

위협이 현재 보이는 하늘 영역에 있음
→ Visual Contact

Visual Contact 상태에서 중앙 crosshair 근처에 있음
→ Lock Ready
```

판정은 Origin Type이나 High / Low preset으로 강제하지 않는다. 따라서 Low 위협도 실제로 보이는 영역에 있으면 `Visual Contact`가 되고, High 위협도 시야 이동으로 달 표면 뒤에 놓이면 `Detected / Occluded`가 된다.

## 조합별 표시

### Earth Surface High / Low

source marker를 지구 표면 또는 가장자리에 붙여 지구 표면 원천으로 읽히게 한다. High와 Low는 지구 가장자리의 출발 각도만 다르며, 같은 trajectory model로 Lunar Defense Zone을 향한다. 실제 지구 표면 좌표나 남극 좌표는 계산하지 않는다.

### Orbital High / Low

source marker를 지구 표면에서 약간 떨어진 위치에 두고 orbit guide를 표시해 궤도 원천으로 읽히게 한다. High와 Low는 궤도상의 출발 각도만 다르며, 같은 trajectory model로 Lunar Defense Zone을 향한다. 실제 위성 운동이나 공격 위성 궤도는 계산하지 않는다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: 정면 보기 약 `30%`, 아래 보기 약 `50%` ~ `80%`
- Lunar Defense Zone Surface Depth: 현재 보이는 달 표면 영역 안에서 지평선부터 약 `60%`
- Aim Guide Radius: 화면 중앙 조준 기준점 기준 `64px`
- View Movement: 이전 prototype과 같은 제한된 좌우/상하 이동 범위

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 공격 원천과 위치별 감각을 확인하기 위한 prototype 기준값이다.

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
- 화면 버튼: Earth Scale 전환, 기본 정면 보기 복귀, 새 위협 생성 / Restart, Origin Type / Source Position 조합 선택

## 위협 상태 구분

- `Off-screen`: 위협이 화면 밖에 있으며 edge indicator로 방향만 안내한다.
- `Detected / Occluded`: 위협이 화면 안에 있지만 현재 동적 달 표면 영역 뒤에 있어 실제로 보이지 않는 상태이다.
- `Visual Contact`: 위협이 화면 안의 보이는 하늘 영역에 있는 상태이다.
- `Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 crosshair의 가이드 반경 안에 들어온 상태이다.
- `Intercepted`: `Lock Ready` 상태에서 발사 입력을 받아 요격 성공으로 처리된 상태이다.
- `Impact Warning`: Visual Contact가 한 번 이상 발생한 뒤 terminal approach 후반부에 들어간 상태이다.
- `Threat Passed`: 위협이 접근 경로 끝까지 도달한 상태이다.

가려진 상태에서는 중앙 crosshair 근처에 있더라도 `Lock Ready`가 되지 않는다.

## 발사/요격 규칙

- `Lock Ready` 상태에서 Mouse Click 또는 Space 입력을 하면 `Intercepted` 상태가 된다.
- 요격 성공 시 위협 마커를 제거하고 짧은 flash와 burst circle을 표시한다.
- `Visual Contact` 상태지만 `Lock Ready`가 아니면 `Not Aligned`를 표시한다.
- `Detected / Occluded` 상태에서는 `Occluded`를 표시하고 요격 성공 처리하지 않는다.
- 화면 밖 위협에는 `No Visual Contact`를 표시하고 요격 성공 처리하지 않는다.
- 실패/패널티는 이번 단계에서 넣지 않는다.

## 포함한 기능

- 2D Canvas 기반 달-지구 기본 배경
- Earth Scale 5x/6x/7x 비교
- Earth Vertical Position 30%, 동적 Lunar Surface Area 기준 구도
- 마우스 기반 제한 시야 이동과 중앙 고정 crosshair
- 화면 밖 위협 방향을 알려주는 edge indicator
- Earth Surface High / Low, Orbital High / Low source position preset UI
- 네 조합에 공통으로 적용되는 단순 cubic bezier trajectory model
- source position에서 지구 중심 반대 방향을 짧은 초기 접선으로 사용하는 공통 radial outward launch boost
- 고정 하늘 경유점 없이 Lunar Defense Zone 하나를 목표로 하는 단일 곡선
- 현재 달 표면의 surface depth 약 60%에 마커와 위협 목표점을 함께 두는 Lunar Defense Zone anchor
- 조합별 source marker와 launch pulse
- Orbital 계열의 orbit guide
- 현재 화면과 동적 달 표면 영역 기준의 Occluded / Visual Contact 판정
- 달 표면 내부 surface depth 약 60%의 Lunar Defense Zone
- 움직이는 위협 1개와 Lock Ready / 요격 피드백
- 새 위협 생성 / Restart와 현재 상태 패널

## 제외한 기능

점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현, 사운드, 실제 총알/요격체 궤적, 실제 탄도 계산, 실제 중력 계산, 실제 공격 위성 궤도 계산, 실제 위성 운동, 실제 달 뒤편 물리 계산, 실제 지구 남극 좌표 계산, 지구 표면의 정확한 발사 좌표 계산은 이번 범위에서 제외한다.

또한 복잡한 폭발 연출, 실제 무기 시스템 확정, 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다.

## 확인할 질문

- Earth Surface와 Orbital이 source marker 위치와 orbit guide로 구분되는가?
- High와 Low가 별도 공격 방식이 아니라 source position 차이로 읽히는가?
- 각 source에서 발사 직후 지구 중심 반대 방향으로 짧게 boost 되는가?
- 네 조합이 같은 trajectory model로 Lunar Defense Zone을 향하는가?
- 위협이 높은 고정 경유점으로 치솟지 않고 하나의 부드러운 곡선으로 목표에 접근하는가?
- 시야 이동으로 달 표면 비중이 바뀌어도 Lunar Defense Zone과 위협 목표점이 같은 surface anchor에 놓이는가?
- Visual Contact가 경로 강제 보정이 아니라 현재 화면과 달 표면 기준 상태 판정으로 발생하는가?
- 시야 이동에 따라 High도 Occluded, Low도 Visual Contact가 될 수 있는가?
- Origin Type과 Source Position이 바뀌어도 edge indicator, Lock Ready, 요격 흐름이 유지되는가?

## 다음 단계 후보

- Earth Surface / Orbital source marker와 orbit guide 표현 개선
- 시야 범위, 속도, 공격 각도와 위협 크기 변화를 통한 Visual Contact 시간 및 마지막 접근 감각 개선
- 고도감, 착탄 예상점과 그림자를 통한 마지막 접근 깊이감 개선
- 달 표면 지형과 충돌/폭발 연출을 함께 검토해 위협이 아래로 꽂히거나 달 내부로 들어가는 듯한 표현 개선
- 실제 공격 궤도 후보 검토
- 마우스 감도와 시야 이동 범위 조정
- fullscreen mode 검토
- 이후 별도 단계에서 실제 요격체 궤적 검토
