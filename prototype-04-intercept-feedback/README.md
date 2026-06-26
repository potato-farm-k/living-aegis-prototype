# Prototype 04 - Intercept Feedback

상태: `1차 구현`

이 프로토타입은 완성형 전투 시스템이 아니라, Lock Ready 상태에서 발사 입력 후 최소 요격 피드백 감각을 확인하기 위한 실험입니다.

## 목적

`prototype-03-threat-aim-lock`에서 확인한 위협 탐색, 시야 내 포착, 중앙 조준 기준점 정렬, `Lock Ready` 흐름을 바탕으로 발사 입력과 요격 성공 피드백의 최소 감각을 확인한다.

이번 단계의 핵심은 전투 전체 루프가 아니라, `Lock Ready` 상태에서 마우스 클릭 또는 Space 입력을 했을 때 위협이 제거되고 짧은 시각 피드백이 충분히 읽히는지 보는 것이다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: `30%`
- Aim Guide Radius: 화면 중앙 조준 기준점 기준 `64px`
- View Movement: 이전 prototype과 같은 제한된 좌우/상하 이동 범위

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 최소 발사/요격 피드백 감각을 확인하기 위한 prototype 기준값이다.

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
- `N`: 다음 위협 위치 생성
- 화면 버튼: Earth Scale 전환, 기본 정면 보기 복귀, 다음 위협 위치 생성

## 위협 상태 구분

- `Off-screen`: 위협이 화면 밖에 있으며 edge indicator로 방향만 안내한다.
- `Detected / Occluded`: 위협이 화면 안쪽 방향에 들어왔지만 Lunar Surface Area 30% 기준의 달 표면 영역 안에 있어 실제로 보이지 않는 상태로 본다.
- `Visual Contact`: 위협이 화면 안에 있고 달 표면 영역 밖에 있어 실제로 볼 수 있는 상태로 본다.
- `Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 crosshair의 가이드 반경 안에 들어온 상태이다.
- `Intercepted`: `Lock Ready` 상태에서 발사 입력을 받아 요격 성공으로 처리된 상태이다.

현재는 달 표면 하단 영역을 기준으로 한 단순 2D 가림 판정을 사용한다. 정교한 달 표면 이미지, 크레이터, 언덕, 공격 위성 궤도선이 추가되면 가림 판정은 다시 조정할 수 있다.

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
- 실패/패널티는 이번 단계에서 넣지 않는다.

## 포함한 기능

- 2D Canvas 기반 달-지구 기본 배경
- Earth Scale 5x/6x/7x 비교
- Earth Vertical Position 30%, Lunar Surface Area 30% 기준 구도
- 마우스 기반 제한 시야 이동
- WASD/Arrow keys 보조 시야 이동
- 화면 밖 위협 방향을 알려주는 edge indicator
- 화면 중앙에 고정된 crosshair
- 화면 중앙 기준 Lock Ready 판정 범위 가이드
- 화면 밖 위협, 달 표면 가림, 시야 내 포착, Lock Ready, Intercepted 상태 구분
- Mouse Click과 Space를 통한 발사 입력
- 요격 성공 시 간단한 flash, burst circle, 위협 비활성화
- 다음 위협 위치를 생성하는 버튼과 `N` 키 입력
- 현재 상태 패널

## 제외한 기능

점수, 체력, 실패 조건, 웨이브, 난이도 상승, 사운드, 실제 미사일 궤적, 복잡한 폭발 연출, 실제 궤도 계산은 이번 범위에서 제외합니다.

또한 적 공격, 실제 무기 시스템 확정, 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다.

## 확인할 질문

- Lock Ready 상태에서 발사하는 행동이 자연스러운가?
- 발사 입력 후 위협이 사라지는 피드백이 충분히 명확한가?
- 요격 성공이 시각적으로 만족감을 주는가?
- Lock Ready가 아닌 상태에서는 발사가 제한되거나 실패 처리되는 것이 이해하기 쉬운가?
- 발사/요격 피드백을 넣어도 기존 시야 이동과 조준 감각이 유지되는가?

## 다음 단계 후보

- 요격 피드백 시각 효과 개선
- 발사 입력 감각 조정
- 위협 재생성 타이밍 조정
- fullscreen mode 검토
- 이후 별도 단계에서 반복 전투 루프 검토
