# Prototype 07 - Threat Origin Types

상태: `1차 구현`

이 프로토타입은 완성형 전투 시스템이 아니라, 공격 원천의 종류와 출발 위치에 따라 위협의 가려짐, Visual Contact, 접근 감각이 어떻게 달라지는지 확인하기 위한 실험입니다.

## 목적

`prototype-06-attack-source-trajectory`에서 확인한 공격 원천 표시, launch pulse, 단순 접근 경로, Lunar Defense Zone 접근 흐름을 바탕으로 다음 구분이 화면에서 읽히는지 확인한다.

- `Origin Type`: 어디서 발사됐는가
- `Source Position`: 어느 위치에서 발사됐는가
- `Visibility Behavior`: 처음부터 보이는가, 아니면 가려졌다가 나중에 보이는가

`Under-Horizon Approach`는 독립된 Origin Type이 아니다. `Under-Horizon`은 낮은 `Earth Surface Source` 또는 낮은 `Orbital Source`에서 발생하는 `Occluded-then-Visual-Contact` visibility behavior로 정리한다. 발사 원천은 항상 지구 표면 또는 지구 주변 궤도이며, 달 표면 아래나 달 뒤쪽에서 위협이 생성되는 것으로 다루지 않는다.

## 분류 기준과 테스트 조합

### Origin Type

- `Earth Surface`: 지구 표면 또는 지구 가장자리에서 발사
- `Orbital`: 지구 표면에서 조금 떨어진 지구 주변 궤도 원천에서 발사

### Source Position

- `High / Visible`: 상대적으로 높은 위치에서 출발해 처음부터 보이는 직접 접근
- `Low / Under-Horizon`: 지구 하단 또는 지구 아래쪽 궤도에서 출발해 초기에는 가려졌다가 나중에 보이는 접근

### Visibility Behavior

- `Visible from launch`: High 계열의 기본 동작
- `Occluded first, then Visual Contact`: Low 계열의 기본 동작

현재 UI에서는 비교를 단순하게 유지하기 위해 아래 네 조합 버튼으로 테스트한다.

- `Earth Surface High`
- `Earth Surface Low`
- `Orbital High`
- `Orbital Low`

## 조합별 표시

### Earth Surface High / Low

source marker를 지구 표면 또는 가장자리에 붙여 지구 표면 원천으로 읽히게 한다. `Earth Surface Low`는 지구 하단 가장자리에서 시작하고 Under-Horizon visibility behavior를 사용한다. 실제 지구 표면 좌표나 남극 좌표는 계산하지 않는다.

### Orbital High / Low

source marker를 지구 표면에서 약간 떨어진 위치에 두고 orbit guide를 표시해 궤도 원천으로 읽히게 한다. `Orbital Low`는 지구 아래쪽 궤도에서 시작하고 Under-Horizon visibility behavior를 사용한다. 실제 위성 운동이나 공격 위성 궤도는 계산하지 않는다.

## Low / Under-Horizon 흐름

Low 계열은 `source → hidden waypoint → reveal waypoint → Lunar Defense Zone` 순서의 단순 곡선 경로를 사용한다.

```text
Earth Surface Low 또는 Orbital Low
→ Detected / Occluded
→ Visual Contact
→ Lock Ready
→ Intercepted
```

초기 hidden 구간은 달 표면 또는 현재 시야에 가려진 감지 상태로 처리한다. 이후 위협은 보이는 하늘의 reveal waypoint로 올라와 반드시 `Visual Contact`가 가능해지고, Lunar Defense Zone 위쪽을 거쳐 달 표면 내부 방어 지점으로 내려온다. Low 계열의 source marker와 launch pulse는 지구 하단 또는 지구 하단 궤도에만 표시한다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: 정면 보기 약 `30%`, 아래 보기 약 `50%` ~ `80%`
- Lunar Defense Zone Surface Depth: 보이는 달 표면 영역 안에서 약 `60%`
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
- `Detected / Occluded`: 위협이 현재 표시되는 달 표면 영역에 가려졌거나 Low 경로의 reveal waypoint에 아직 도달하지 않은 상태이다.
- `Visual Contact`: 위협이 화면 안에 있고 달 표면에 가려지지 않아 실제로 볼 수 있는 상태이다.
- `Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 crosshair의 가이드 반경 안에 들어온 상태이다.
- `Intercepted`: `Lock Ready` 상태에서 발사 입력을 받아 요격 성공으로 처리된 상태이다.
- `Impact Warning`: 위협 접근 진행도가 높거나 Low 접근 초기 경고가 필요한 상태 메시지이다.
- `Threat Passed`: 위협이 접근 경로 끝까지 도달한 상태 메시지이다.

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
- Earth Surface High / Low, Orbital High / Low 조합 선택 UI
- 조합별 source marker, launch pulse, 단순 접근 경로
- Orbital 계열의 orbit guide
- Low 계열의 hidden / reveal waypoint와 `Occluded Track` cue
- 달 표면 내부 surface depth 약 60%의 Lunar Defense Zone
- 움직이는 위협 1개와 Lock Ready / 요격 피드백
- 새 위협 생성 / Restart와 현재 상태 패널

## 제외한 기능

점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현, 사운드, 실제 총알/요격체 궤적, 실제 탄도 계산, 실제 중력 계산, 실제 공격 위성 궤도 계산, 실제 위성 운동, 실제 달 뒤편 물리 계산, 실제 지구 남극 좌표 계산, 지구 표면의 정확한 발사 좌표 계산은 이번 범위에서 제외한다.

또한 복잡한 폭발 연출, 실제 무기 시스템 확정, 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다.

## 확인할 질문

- Earth Surface와 Orbital이 source marker 위치와 orbit guide로 구분되는가?
- High와 Low의 출발 위치 및 visibility behavior 차이가 읽히는가?
- Low 계열이 달이 아니라 지구 하단 또는 낮은 지구 궤도에서 출발하는 것으로 보이는가?
- Low 계열에서 `Detected / Occluded → Visual Contact → Lock Ready → Intercepted` 흐름이 가능한가?
- Origin Type과 Source Position이 바뀌어도 기존 edge indicator와 요격 흐름이 유지되는가?

## 다음 단계 후보

- Earth Surface / Orbital source marker와 orbit guide 표현 개선
- Low 계열 hidden / reveal waypoint와 타이밍 조정
- 달 표면/충돌 연출 문제 검토
- 실제 공격 궤도 후보 검토
- 마우스 감도와 시야 이동 범위 조정
- fullscreen mode 검토
- 이후 별도 단계에서 실제 요격체 궤적 검토
