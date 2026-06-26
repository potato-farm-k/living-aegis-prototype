# Prototype 05 - Threat Approach Timing

상태: `1차 구현`

이 프로토타입은 완성형 전투 시스템이 아니라, 움직이는 위협을 찾고 조준하고 요격하는 시간 감각을 확인하기 위한 실험입니다.

## 목적

`prototype-04-intercept-feedback`에서 확인한 위협 탐색, 시야 내 포착, 중앙 조준 기준점 정렬, `Lock Ready`, 최소 요격 피드백 흐름을 바탕으로, 정지한 위협이 아니라 천천히 접근하는 위협을 대상으로 tracking, aim, intercept timing이 성립하는지 확인한다.

이번 단계의 핵심은 점수나 승패가 있는 전투 루프가 아니라, 움직이는 위협을 화면 안에서 따라가며 중앙 crosshair에 맞추고, `Lock Ready` 상태에서 발사하는 시간 압박이 자연스럽게 느껴지는지 보는 것이다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: `30%`
- Aim Guide Radius: 화면 중앙 조준 기준점 기준 `64px`
- View Movement: 이전 prototype과 같은 제한된 좌우/상하 이동 범위
- Threat Speed: `Slow`, `Normal`, `Fast` 비교 가능, 기본값은 `Normal`

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 움직이는 위협의 접근 타이밍과 요격 감각을 확인하기 위한 prototype 기준값이다.

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
- `1`: Threat Speed Slow
- `2`: Threat Speed Normal
- `3`: Threat Speed Fast
- `N`: 새 위협 생성 / Restart
- 화면 버튼: Earth Scale 전환, 기본 정면 보기 복귀, 새 위협 생성 / Restart, Threat Speed 전환

## 위협 상태 구분

- `Off-screen`: 위협이 화면 밖에 있으며 edge indicator로 방향만 안내한다.
- `Detected / Occluded`: 위협이 화면 안쪽 방향에 들어왔지만 Lunar Surface Area 30% 기준의 달 표면 영역 안에 있어 실제로 보이지 않는 상태로 본다.
- `Visual Contact`: 위협이 화면 안에 있고 달 표면 영역 밖에 있어 실제로 볼 수 있는 상태로 본다.
- `Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 crosshair의 가이드 반경 안에 들어온 상태이다.
- `Intercepted`: `Lock Ready` 상태에서 발사 입력을 받아 요격 성공으로 처리된 상태이다.
- `Impact Warning`: 위협 접근 진행도가 높거나 달 표면 위험 영역 가까이 도달한 상태 메시지이다.
- `Threat Passed`: 위협이 접근 경로 끝까지 도달한 상태 메시지이다.

현재는 달 표면 하단 영역을 기준으로 한 단순 2D 가림 판정을 사용한다. 정교한 달 표면 이미지, 크레이터, 언덕, 공격 위성 궤도선이 추가되면 가림 판정은 다시 조정할 수 있다.

## 움직이는 위협 규칙

- 위협은 한 번에 1개만 등장한다.
- 위협은 world/view-space 기준의 단순 곡선 경로를 따라 이동한다.
- 위협 위치는 매 프레임 현재 `progress`와 선택한 `Threat Speed`에 따라 갱신한다.
- 위협이 움직여도 지구, 배경, 위협 마커는 같은 view transform 기준으로 화면에 투영된다.
- 화면 밖 위협은 edge indicator로 방향만 표시한다.
- 위협이 달 표면 가까이 도달하면 `Impact Warning`, 경로 끝까지 도달하면 `Threat Passed` 상태 메시지를 표시한다.

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

## 위협 도달 처리

- 위협이 달 표면 위험 영역 가까이 도달하면 `Impact Warning`을 표시한다.
- 위협이 경로 끝까지 도달하면 `Threat Passed`를 표시한다.
- 체력 감소, 게임 오버, 점수 차감은 없다.
- 이 처리는 실패 조건을 만드는 것이 아니라, 움직이는 위협을 놓쳤을 때의 흐름을 확인하기 위한 상태 메시지이다.

## 포함한 기능

- 2D Canvas 기반 달-지구 기본 배경
- Earth Scale 5x/6x/7x 비교
- Earth Vertical Position 30%, Lunar Surface Area 30% 기준 구도
- 마우스 기반 제한 시야 이동
- WASD/Arrow keys 보조 시야 이동
- 화면 밖 위협 방향을 알려주는 edge indicator
- 화면 중앙에 고정된 crosshair
- 화면 중앙 기준 Lock Ready 판정 범위 가이드
- 화면 밖 위협, 달 표면 가림, 시야 내 포착, Lock Ready, Intercepted, Impact Warning, Threat Passed 상태 구분
- 단순 곡선 경로를 따라 움직이는 위협 1개
- Slow / Normal / Fast 위협 속도 선택
- Mouse Click과 Space를 통한 발사 입력
- 요격 성공 시 간단한 flash, burst circle, 위협 비활성화
- 새 위협 생성 / Restart 버튼과 `N` 키 입력
- 현재 상태 패널

## 제외한 기능

점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현, 사운드, 실제 총알/요격체 궤적, 실제 미사일 궤도, 실제 공격 위성 궤도 계산은 이번 범위에서 제외합니다.

또한 복잡한 폭발 연출, 실제 무기 시스템 확정, 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다.

## 확인할 질문

- 움직이는 위협을 찾고 따라가는 감각이 자연스러운가?
- 위협이 움직이면 기존 edge indicator, Visual Contact, Lock Ready 흐름이 유지되는가?
- Lock Ready 상태를 유지한 채 발사하는 것이 너무 어렵거나 쉽지 않은가?
- 위협 속도가 긴장감을 만들 수 있는가?
- 마우스 감도와 시야 이동 범위가 움직이는 위협을 따라가기에 적절한가?
- 이후 실제 공격체 궤도, 속도, 난이도 설계로 넘어갈 수 있는가?

## 다음 단계 후보

- 위협 속도 조정
- 위협 이동 경로 후보 비교
- 마우스 감도와 시야 이동 범위 조정
- fullscreen mode 검토
- 실제 공격체 궤도 후보 검토
- 이후 별도 단계에서 실제 요격체 궤적 검토
