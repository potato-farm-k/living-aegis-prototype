# Prototype 08 - P0 Missile Front Approach

상태: `1차 구현`

이 prototype은 Surface Occluded / Predicted Contact 없이,
Off-screen / Visual Contact / Lock Ready만으로
P0 Missile-type Threat의 정면 접근감과 Impact Warning Corridor,
그리고 Impact Warning → Lock Ready → Intercept로 이어지는 첫 방어 행동 감각을 검증하기 위한 Canvas 2D prototype입니다.

## 목적

`prototype-07-threat-origin-types`까지의 검토에서는 공격 원천과 Lunar Defense Zone 흐름은 성립했지만, 마지막 접근이 화면 위에서 아래로 내려와 달 표면에 꽂히는 것처럼 읽히는 문제가 남았다.

이번 prototype은 Three.js / WebGL spike로 바로 넘어가기 전에, Canvas 2D front projection만으로 P0 Missile-type Threat가 먼 source에서 Lunar Defense Zone으로 정면 접근하는 느낌을 줄 수 있는지 확인한다.

## 검증 질문

- 위협이 Y축 낙하가 아니라 전방 접근으로 읽히는가?
- `source → boost → main trajectory → Impact Warning Corridor → Lunar Defense Zone / Impact` 단계가 구분되는가?
- `Impact Warning Corridor`가 마지막 방어 선택 구간으로 느껴지는가?
- `Off-screen / Visual Contact / Lock Ready`만으로 P0 전투 흐름이 전달되는가?
- Impact Warning 이후 `Lock Ready`와 Intercept 입력이 직관적으로 읽히는가?
- 성공 / 실패 / Impact 결과가 최소한으로 구분되는가?
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
- `Intercepted`: Lock Ready 상태에서 Canvas Click 또는 Space 입력을 받은 상태
- `Missed`: Lock Ready가 아니거나 Impact 이후 입력해 요격하지 못한 상태
- `Impact`: 위협이 Lunar Defense Zone에 도달한 상태

요격체 궤적, 체력, 점수, 게임 오버는 포함하지 않는다.

## 접근감 표현

위협은 화면 위에서 아래로 단순 낙하하지 않고, 먼 source 지점에서 Lunar Defense Zone 방향으로 수렴한다.

Canvas 2D 안에서는 실제 물리 대신 아래 표현으로 정면 접근감을 만든다.

- marker size scaling
- brightness / outline pulse
- trail ghost points
- Impact Warning Corridor path cue
- HUD frame warning
- hidden logical impact target

`Impact Warning Corridor`에서는 HUD warning, corridor guide, threat pulse, screen frame warning을 함께 강화한다. 이 구간은 단순 텍스트 경고가 아니라 마지막 방어 선택 구간으로 본다.

2차 interaction feel test에서는 warning intensity를 조금 더 강화하고, `Lock Ready`일 때 crosshair / threat outline / HUD 문구가 더 분명하게 바뀌도록 보강했다. Lock Ready가 아닌 상태에서 입력하면 `No Lock` 또는 `No Visual` 결과를 표시하고, Lunar Defense Zone 도달 뒤에는 `Impact`로 구분한다. 이 처리는 실제 요격체 궤적이나 전투 밸런스가 아니라, 첫 방어 행동의 최소 감각을 확인하기 위한 feedback이다.

이번 defense anchor 보정에서는 `Lunar Defense Zone`을 앞쪽 지면에 놓인 visible target ring이 아니라, 플레이어가 이미 그 안에 있는 `player-centered logical impact target`으로 해석한다. 기존 source / boost / main trajectory 구조와 final approach 계산용 anchor는 유지하되, 기본 화면에서는 `Lunar Defense Zone` ring / label / defense marker를 표시하지 않는다. 위험 인지는 보이는 지면 목표물이 아니라 threat 자체, HUD warning, Warning Intensity, Lock Ready 상태로 전달한다.

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
- Lock Radius: `Lock Ready` 판정 반경 조정
- Warning Intensity: Impact Warning Corridor의 표시 강도 조정

## 포함한 기능

- Canvas 2D 기반 정면 prototype
- P0 Missile-type Threat 1개
- `source → boost → main trajectory → Impact Warning Corridor → Impact` 단계 표시
- 먼 source 지점에서 Lunar Defense Zone 방향으로 수렴하는 front projection
- threat marker 크기 증가, brightness, outline pulse, trail 변화
- Impact Warning Corridor 진입 시 HUD warning과 corridor cue 강화
- 기본 화면에서 visible Lunar Defense Zone ring / label 숨김
- final approach와 Impact Point는 플레이어 중심 logical target을 내부 좌표로 유지
- 중앙 crosshair와 Lock Ready 상태
- Lock Ready / No Lock / No Visual / Intercepted / Impact 결과 표시
- Off-screen indicator
- progress / phase / visibility / lock state / intercept result / input hint debug panel
- Defense Zone / Impact Target이 logical / hidden 상태임을 표시하는 debug text
- fixed boost debug label
- reset / replay, pause, speed multiplier
- camera pitch slider
- Impact Warning Corridor start percent slider
- Lock Radius와 Warning Intensity 검토용 slider

## 제외한 기능

`Surface Occluded`, `Predicted Contact`, `Predicted Impact`, `Incoming Prediction`, Beam/Charge-type Threat, Mass/Object-type Threat, 실제 game balance, 복잡한 enemy taxonomy, Three.js, WebGL, 실제 asset, Sound Direction, Concept Art 반영은 이번 범위에서 제외한다.

또한 실제 미사일 탄도, 중력, 궤도 계산, 복잡한 orbital threat boost model, mouse-look 확장, off-screen arrow 정밀 보정, 요격체 궤적, 체력, 점수, 게임 오버, 여러 위협 동시 출현, 메인 게임 구현, simulator 저장소 수정은 포함하지 않는다.

## 1차 PM 검토 메모

1차 PM 검토 결과, 이 prototype은 전반적으로 이전 prototype보다 의도에 가까워진 것으로 판단한다. 최종 전투 문법이나 main game 적용 기준으로 확정하지 않고, 다음 검토 단계로 넘어가기 위한 prototype review note로 기록한다.

긍정적으로 확인한 점:

- `source → boost → main trajectory → Impact Warning Corridor → Lunar Defense Zone / Impact` 단계 구분이 명확해졌다.
- `Impact Warning Start %` 조절로 마지막 방어 구간 진입 시점을 검토할 수 있게 되었다.
- 위협 궤도가 전진하며 접근한다는 느낌이 이전보다 나아졌고, source 위치별 궤도도 전반적으로 안정적으로 보인다.
- camera pitch 조정과 `Upper` preset에서는 위협이 달 아래에서 올라와 떨어지는 움직임이 자연스럽게 읽힌다.
- 낙하감 감소, 정면 접근감 강화, 단계 구분, warning start 조절 가능성은 1차 검토에서 긍정적으로 확인했다.

현재 검증 상태:

- P0 Missile-type Threat의 정면 접근감은 이전 prototype보다 개선되었다.
- source, boost, main trajectory, Impact Warning Corridor, Lunar Defense Zone / Impact 단계가 분리되면서 trajectory를 이해하기 쉬워졌다.
- `Impact Warning Start %` 조절을 통해 마지막 방어 구간 진입 시점을 검토할 수 있게 되었다.
- 아직 완성형 전투 문법이나 main game 적용 기준으로 확정하지 않는다.

Minor issue / backlog:

- `Left` / `Right` source preset에서 off-screen arrow가 실제 threat trajectory 위치보다 화면 모서리 쪽을 고정적으로 가리키는 경향이 있다.
- 현재 관찰 기준으로 실제 궤도는 화면 중심 방향 약 `1/5` 정도 위치로 들어오지만, arrow는 왼쪽 / 오른쪽 모서리 쪽에 고정되는 편이다.
- 지금 단계에서는 P0 front approach의 궤도 안정성과 접근감 검증에 치명적이지 않으므로 수정하지 않고, 향후 `HUD indicator refinement` backlog로 보류한다.

지금 확장하지 않을 항목:

- Earth size 정밀 조정은 나중에 시각 기준점 조정 단계에서 다룬다.
- source position에 따른 boost angle 고도화와 orbital threat boost model은 현재 fixed boost 방식으로 충분히 궤도 검토가 가능하므로 보류한다.
- mouse-look / 마우스 시야 조정은 지금 넣으면 접근감 검토 변수가 커질 수 있으므로 보류한다.
- Three.js / WebGL spike, `Surface Occluded`, `Predicted Contact`, Beam/Charge-type Threat, Mass/Object-type Threat은 현재 구현 항목이 아니라 later review candidate로 남긴다.

## 2차 Interaction Feel Test

이번 단계는 궤도 모델 개선이 아니라 `Impact Warning → Lock Ready → Intercept`로 이어지는 최소 방어 감각을 확인하는 interaction feel test다.

- Impact Warning Corridor에 들어가면 threat pulse, corridor cue, HUD warning, screen frame warning의 강도가 함께 올라간다.
- `Visual Contact` 상태의 위협이 중앙 crosshair의 Lock Radius 안에 들어오면 `Lock Ready`로 표시한다.
- Lock Ready 상태에서 Canvas Click 또는 Space를 입력하면 `Intercepted`로 처리하고 burst / flash feedback을 보여준다.
- Lock Ready가 아닐 때 입력하면 `No Lock` 또는 `No Visual`로 실패 결과를 구분한다.
- 위협이 Lunar Defense Zone / Impact에 도달하면 `Impact` 결과를 표시한다. Impact warning text는 약 1초 동안 2~3회 blink한 뒤 정적인 최종 결과 상태로 멈춘다.
- debug panel에는 progress %, phase, visibility, lock state, lock distance, lock radius, warning active, intercept result, input hint를 표시한다.

이번 단계에서도 `Surface Occluded`, `Predicted Contact`, Three.js / WebGL, mouse-look, Earth size 조정, source별 boost angle 재설계, off-screen arrow refinement는 구현하지 않는다.

## Hidden Defense Anchor

이번 보정은 궤도 재설계가 아니라 defense anchor / impact anchor의 화면상 의미를 바꾸는 작업이다.

- 기존에는 `Lunar Defense Zone`이 카메라 앞쪽 달 표면에 놓인 원형 목표물처럼 읽힐 수 있었다.
- 현재 기본값은 visible target을 숨긴 상태이며, `Lunar Defense Zone`은 player-centered logical impact target으로만 유지한다.
- main trajectory와 phase structure는 유지하고, final approach / impact 계산은 내부 player anchor를 계속 사용한다.
- debug panel에는 `Defense Zone: Logical / Hidden`, `Impact Target: Player Anchor / Hidden` 상태만 텍스트로 표시한다.
- 기본 gameplay 화면에서는 visible ring, label, ground target marker, final target point를 표시하지 않는다.

## 다음 PM 검토 포인트

다음 검토는 trajectory 자체보다 warning / lock / game feel 중심으로 진행한다.

1. Impact Warning Corridor 진입 시 긴장감이 생기는가?
2. Lock Ready 상태가 너무 쉽거나 어렵지 않은가?
3. threat가 Lunar Defense Zone으로 밀고 들어오는 느낌이 있는가?
4. 반복해서 봐도 낙하보다 접근으로 읽히는가?
5. source 위치를 바꿔도 P0 Missile-type 문법이 유지되는가?
6. intercept / lock / warning 흐름이 실제 게임의 첫 방어 문법으로 이어질 수 있는가?
7. click 또는 Space 입력 안내와 실제 동작이 일치하는가?
8. Intercepted / No Lock / No Visual / Impact 결과가 과하지 않게 구분되는가?
9. Lunar Defense Zone ring / label이 기본 화면에서 보이지 않는가?
10. visible ground target 없이 threat, HUD warning, Lock Ready만으로 위험이 읽히는가?

## 다음 단계 후보

- P0 Missile-type Threat의 실제 고도감 표현 검토
- Lunar Defense Zone 접근의 충돌 / 표면 연출 검토
- hidden logical impact target과 향후 debug-only anchor 표시 필요성 검토
- Three.js / WebGL spike 필요성 재판단
- Threat type별 Impact Warning Corridor duration 비교
- Beam/Charge-type Threat과 Mass/Object-type Threat은 P0 문법이 안정된 뒤 별도 prototype으로 검토
