# Prototype 08 - P0 Missile Front Approach

상태: `1차 구현`

이 prototype은 Surface Occluded / Predicted Contact 없이,
Off-screen / Visual Contact / Lock Ready만으로
P0 Missile-type Threat의 정면 접근감과 Impact Warning Corridor를 검증하기 위한 Canvas 2D prototype입니다.

## 목적

`prototype-07-threat-origin-types`까지의 검토에서는 공격 원천과 Lunar Defense Zone 흐름은 성립했지만, 마지막 접근이 화면 위에서 아래로 내려와 달 표면에 꽂히는 것처럼 읽히는 문제가 남았다.

이번 prototype은 Three.js / WebGL spike로 바로 넘어가기 전에, Canvas 2D front projection만으로 P0 Missile-type Threat가 먼 source에서 Lunar Defense Zone으로 정면 접근하는 느낌을 줄 수 있는지 확인한다.

## 검증 질문

- 위협이 Y축 낙하가 아니라 전방 접근으로 읽히는가?
- `source → boost → main trajectory → Impact Warning Corridor → Lunar Defense Zone / Impact` 단계가 구분되는가?
- `Impact Warning Corridor`가 마지막 방어 선택 구간으로 느껴지는가?
- `Off-screen / Visual Contact / Lock Ready`만으로 P0 전투 흐름이 전달되는가?
- `Surface Occluded / Predicted Contact` 없이도 prototype이 성립하는가?
- Canvas 2D에서 이 접근감이 충분하면 Three.js spike를 계속 보류할 수 있는가?

## 상태 모델

Threat Progress는 아래 단계로 단순화한다.

- `source`: 먼 source 지점과 초기 신호
- `boost`: source 근처에서 짧게 밀려나는 구간
- `mainTrajectory`: Lunar Defense Zone 방향으로 수렴하는 주요 접근 구간
- `impactWarningCorridor`: 마지막 방어 선택 구간
- `finalApproach`: Lunar Defense Zone에 밀고 들어오는 마지막 구간
- `impact`: Lunar Defense Zone / Impact 도달 상태

기본 기준은 `source / boost` 0% ~ 15%, `main trajectory` 15% ~ 75%, `Impact Warning Corridor` 75% ~ 95%, `final impact` 95% ~ 100%다. `Impact Warning Start` slider로 corridor 시작 지점을 검토할 수 있다.

## Visibility와 Engagement

이번 prototype의 visibility는 아래 두 상태 중심으로 제한한다.

- `Off-screen`: camera pitch 또는 source offset 때문에 threat marker가 화면 밖에 있는 상태
- `Visual Contact`: threat marker가 화면 안에 있고 플레이어가 직접 볼 수 있는 상태

`Surface Occluded`, `Predicted Contact`, `Predicted Impact`, `Incoming Prediction`은 구현하지 않는다.

Engagement는 아래처럼 단순화한다.

- `Not Locked`: Visual Contact가 아니거나 crosshair 기준 반경 밖인 상태
- `Lock Ready`: Visual Contact 상태의 위협이 중앙 crosshair 근처에 들어온 상태
- `Intercept`: Lock Ready 상태에서 Canvas Click 또는 Space 입력을 받은 상태
- `Impact`: 위협이 Lunar Defense Zone에 도달한 상태

요격체 궤적, 체력, 점수, 게임 오버는 포함하지 않는다.

## 접근감 표현

위협은 화면 위에서 아래로 단순 낙하하지 않고, 먼 source 지점에서 Lunar Defense Zone 방향으로 수렴한다.

Canvas 2D 안에서는 실제 물리 대신 아래 표현으로 정면 접근감을 만든다.

- marker size scaling
- brightness / outline pulse
- trail ghost points
- Impact Warning Corridor path cue
- warning ring pulse
- Lunar Defense Zone 강조

`Impact Warning Corridor`에서는 HUD warning, corridor guide, threat pulse, Lunar Defense Zone ring을 함께 강화한다. 이 구간은 단순 텍스트 경고가 아니라 마지막 방어 선택 구간으로 본다.

기본 view에서는 `Earth direction` marker를 화면 정면 기준에 가깝게 둔다. 이번 calibration patch에서는 marker 크기를 줄여 정면 기준점처럼 읽히도록 하고, 좌우 또는 상하에서 들어오는 변주는 source preset stress test로만 확인한다.

Camera Pitch는 `-45`부터 `+45`까지 조정해 `Off-screen / Visual Contact` 전환을 더 분명히 볼 수 있게 했다. 이 값은 실제 mouse-look이나 시야 시스템 확장이 아니라, 검토용 pitch calibration이다.

Boost angle은 이번 단계에서 물리적으로 재설계하지 않는다. 현재 boost는 front projection 검토를 위한 fixed screen-space boost이며, 복잡한 orbital threat boost model은 후속 검토 후보로 남긴다.

## 조작 방법

- Canvas Click: 발사 입력
- Space: 발사 입력
- Replay (`R` / `N`): 위협 재시작. 일시정지 중에도 다시 재생 상태로 전환한다.
- Pause 또는 `P`: 일시정지
- Speed: 진행 속도 배율
- Source preset: 먼 source의 화면상 시작 방향 후보
- Camera Pitch: `-45` / `+45` 범위에서 Off-screen / Visual Contact 전환 확인
- Impact Warning Start: corridor 시작 progress 조정

## 포함한 기능

- Canvas 2D 기반 정면 prototype
- P0 Missile-type Threat 1개
- `source → boost → main trajectory → Impact Warning Corridor → Impact` 단계 표시
- 먼 source 지점에서 Lunar Defense Zone 방향으로 수렴하는 front projection
- threat marker 크기 증가, brightness, outline pulse, trail 변화
- Impact Warning Corridor 진입 시 HUD warning과 corridor cue 강화
- Lunar Defense Zone 표시
- 중앙 crosshair와 Lock Ready 상태
- Off-screen indicator
- progress / phase / visibility / aim debug panel
- fixed boost debug label
- reset / replay, pause, speed multiplier
- camera pitch slider
- Impact Warning Corridor start percent slider

## 제외한 기능

`Surface Occluded`, `Predicted Contact`, `Predicted Impact`, `Incoming Prediction`, Beam/Charge-type Threat, Mass/Object-type Threat, 실제 game balance, 복잡한 enemy taxonomy, Three.js, WebGL, 실제 asset, Sound Direction, Concept Art 반영은 이번 범위에서 제외한다.

또한 실제 미사일 탄도, 중력, 궤도 계산, 복잡한 orbital threat boost model, mouse-look 확장, 요격체 궤적, 체력, 점수, 게임 오버, 여러 위협 동시 출현, 메인 게임 구현, simulator 저장소 수정은 포함하지 않는다.

## PM 검토 포인트

- 위협이 화면 위에서 아래로 떨어지는 느낌이 줄었는가?
- 위협이 먼 곳에서 Lunar Defense Zone으로 접근하는 느낌이 나는가?
- source / boost / main trajectory / Impact Warning Corridor / Impact 단계가 구분되는가?
- Impact Warning Corridor가 마지막 방어 선택 구간으로 느껴지는가?
- Off-screen indicator가 필요한 상황에서만 자연스럽게 작동하는가?
- Visual Contact와 Lock Ready가 단순하지만 명확한가?
- Surface Occluded / Predicted Contact 없이도 prototype 흐름이 성립하는가?
- camera pitch 조정이 혼란보다 이해를 돕는가?
- Three.js spike 없이 Canvas 2D로 더 진행할 가능성이 보이는가?

## 다음 단계 후보

- P0 Missile-type Threat의 실제 고도감 표현 검토
- Lunar Defense Zone 접근의 충돌 / 표면 연출 검토
- Three.js / WebGL spike 필요성 재판단
- Threat type별 Impact Warning Corridor duration 비교
- Beam/Charge-type Threat과 Mass/Object-type Threat은 P0 문법이 안정된 뒤 별도 prototype으로 검토
