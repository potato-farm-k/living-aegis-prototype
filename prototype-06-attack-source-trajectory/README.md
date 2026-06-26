# Prototype 06 - Attack Source Trajectory

상태: `1차 구현`

이 프로토타입은 완성형 전투 시스템이 아니라, 공격 원천에서 위협이 출발해 접근하고 요격되는 흐름을 확인하기 위한 실험입니다.

## 목적

`prototype-05-threat-approach-timing`에서 확인한 움직이는 위협 탐색, 중앙 조준, `Lock Ready`, 최소 요격 피드백 흐름을 바탕으로, 위협이 지구 또는 지구 주변 공격 원천에서 출발한다는 감각이 생기는지 확인한다.

이번 단계의 핵심은 실제 궤도 물리나 완성형 전투 루프가 아니라, 공격 원천 표시, launch pulse, 단순 접근 경로, 움직이는 위협이 한 흐름으로 읽히는지 보는 것이다.

이번 보정에서는 위협 시작점을 `attack-source` 마커와 같은 world 좌표로 맞추고, 경로 끝을 달 표면 근처의 `Lunar Defense Zone` / 달 방어선 쪽으로 정리했다. 목적은 공격 원천과 위협 접근 흐름을 시각적으로 연결하는 것이며, 실제 미사일 궤도나 실제 공격 궤도 계산은 아니다.

추가 보정에서는 전면 접근 기준으로 위협이 달 표면 아래로 지나가지 않고, 달 표면 내부의 `Lunar Defense Zone`을 향해 접근하도록 정리했다. 또한 시선을 아래로 향하면 달 표면 비중이 증가하도록 바꾸고, 달 표면 가림 판정도 현재 표시되는 동적 달 표면 영역을 기준으로 처리한다.

이번 위치 보정에서는 `Lunar Defense Zone`을 하늘에 떠 있는 목표점이나 지평선 라벨이 아니라 달 표면 내부의 방어 지점으로 본다. 현재 프로토타입에서는 실제 달 위도/경도 대신, 화면에 보이는 달 표면 영역 안의 normalized surface anchor를 사용한다. 기본값은 지평선에서 화면 하단 방향으로 약 `60%` 내려온 surface depth 지점이다. 라벨은 읽기 위해 약간 위에 표시할 수 있지만, 실제 마커와 위협 도달 기준점은 달 표면 내부 anchor에 둔다.

## 적용한 기준값

- Earth Scale: `6x` 기본값
- Alternative Earth Scale: `5x`, `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: 정면 보기 약 `30%`, 아래 보기 약 `50%` ~ `80%`
- Lunar Defense Zone Surface Depth: 보이는 달 표면 영역 안에서 약 `60%`
- Aim Guide Radius: 화면 중앙 조준 기준점 기준 `64px`
- View Movement: 이전 prototype과 같은 제한된 좌우/상하 이동 범위

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 공격 원천과 위협 접근 경로를 확인하기 위한 prototype 기준값이다. 달 표면 비중은 정면 보기에서 약 `30%`이며, 시선을 아래로 향하면 점점 증가해 중앙 crosshair가 달 표면 위에 놓일 수 있다. 다시 시선을 위로 올리면 달 표면 비중이 줄어들고 지구가 다시 보인다.

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
- 화면 버튼: Earth Scale 전환, 기본 정면 보기 복귀, 새 위협 생성 / Restart, Source Mode 전환

## 공격 원천 표시 방식

- 공격 원천은 지구 가장자리 또는 지구 주변의 단순 world 좌표에 배치한다.
- 공격 원천은 지구, 배경, 위협과 같은 view transform을 공유한다.
- `Earth Source`는 지구 가장자리 근처에 마커를 둔다.
- `Orbital Source`는 지구 주변 궤도 후보처럼 보이는 위치에 마커를 둔다.
- 새 위협 생성 시 source marker에서 짧은 launch pulse를 표시하고, 위협 마커도 같은 지점에서 출발한다.
- 이 표현은 실제 지구 표면 좌표나 실제 공격 위성 궤도 계산이 아니다.

## 위협 이동 규칙

- 위협은 한 번에 1개만 등장한다.
- 위협은 공격 원천 마커와 동일하거나 거의 같은 지점에서 시작한다.
- 위협은 world/view-space 기준의 단순 직선 또는 완만한 곡선 경로를 따라 달 표면상의 `Lunar Defense Zone` / 달 방어선 쪽으로 이동한다.
- 이번 단계에서는 전면 접근 기준으로, 위협이 달 표면 아래나 뒤쪽으로 지나가지 않고 달 표면 내부 방어 지점으로 접근하는 흐름을 우선 확인한다.
- `Lunar Defense Zone`의 실제 기준점은 공중이나 지평선이 아니라, 현재 표시되는 달 표면 영역 안쪽의 surface depth 약 `60%` 위치에 둔다.
- 위협의 접근 목표도 이 표면 내부 기준점으로 정리한다.
- 위협, 지구, 공격 원천, 경로 표시는 같은 view transform 기준으로 화면에 투영된다.
- 화면 밖 위협은 edge indicator로 방향만 표시한다.
- 위협이 달 표면 가까이 도달하면 `Impact Warning`, 경로 끝까지 도달하면 `Threat Passed` 상태 메시지를 표시한다.
- 이 경로는 실제 탄도, 중력, 공격무기 궤도 계산이 아니라 공격 원천에서 달/주인공 방향으로 접근한다는 시각적 흐름을 확인하기 위한 단순 경로이다.

## 위협 상태 구분

- `Source Ready`: 위협이 요격되었거나 지나간 뒤 공격 원천이 다시 준비된 상태이다.
- `Launch Signal`: 새 위협 생성 직후 공격 원천에서 짧은 pulse가 표시되는 상태이다.
- `Off-screen`: 위협이 화면 밖에 있으며 edge indicator로 방향만 안내한다.
- `Detected / Occluded`: 위협이 화면 안쪽 방향에 들어왔지만 현재 표시되는 달 표면 영역 안에 있어 실제로 보이지 않는 상태로 본다.
- `Visual Contact`: 위협이 화면 안에 있고 달 표면 영역 밖에 있어 실제로 볼 수 있는 상태로 본다.
- `Lock Ready`: `Visual Contact` 상태의 위협이 화면 중앙 crosshair의 가이드 반경 안에 들어온 상태이다.
- `Intercepted`: `Lock Ready` 상태에서 발사 입력을 받아 요격 성공으로 처리된 상태이다.
- `Impact Warning`: 위협 접근 진행도가 높거나 달 표면 위험 영역 가까이 도달한 상태 메시지이다.
- `Threat Passed`: 위협이 접근 경로 끝까지 도달한 상태 메시지이다.

현재는 화면에 표시되는 동적 달 표면 하단 영역을 기준으로 한 단순 2D 가림 판정을 사용한다. 정면 보기에서는 약 `30%` 달 표면 기준이고, 아래 보기에서는 증가한 달 표면 영역을 그대로 가림 판정에 사용한다. 정교한 달 표면 이미지, 크레이터, 언덕, 공격 위성 궤도선이 추가되면 가림 판정은 다시 조정할 수 있다.

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

- 위협이 달 표면 내부의 `Lunar Defense Zone` 가까이 도달하면 `Impact Warning`을 표시한다.
- 위협이 경로 끝까지 도달하면 `Threat Passed`를 표시한다.
- 체력 감소, 게임 오버, 점수 차감은 없다.
- 실제 충돌 판정은 구현하지 않고, 표면 내부 방어 지점에 접근하거나 도달하는 느낌만 확인한다.
- 이 처리는 실패 조건을 만드는 것이 아니라, 공격 원천에서 출발한 위협을 놓쳤을 때의 흐름을 확인하기 위한 상태 메시지이다.

## 포함한 기능

- 2D Canvas 기반 달-지구 기본 배경
- Earth Scale 5x/6x/7x 비교
- Earth Vertical Position 30%, 정면 Lunar Surface Area 30% 기준 구도
- 시선을 아래로 향하면 Lunar Surface Area가 약 50% ~ 80%까지 증가하는 동적 달 표면 표시
- 마우스 기반 제한 시야 이동
- WASD/Arrow keys 보조 시야 이동
- 화면 밖 위협 방향을 알려주는 edge indicator
- 화면 중앙에 고정된 crosshair
- 화면 중앙 기준 Lock Ready 판정 범위 가이드
- 지구 가장자리 또는 지구 주변 공격 원천 마커
- 공격 원천 launch pulse
- 공격 원천과 같은 지점에서 시작하는 단순 위협 접근 경로
- 달 표면 내부 방어 지점으로 접근하는 전면 접근 기준 경로
- 달 표면 내부 surface anchor 기준의 `Lunar Defense Zone` 표시
- 현재 표시되는 동적 달 표면 영역 기준의 Occluded / Visual Contact 판정
- 움직이는 위협 1개
- Mouse Click과 Space를 통한 발사 입력
- 요격 성공 시 간단한 flash, burst circle, 위협 비활성화
- 새 위협 생성 / Restart 버튼과 `N` 키 입력
- 현재 상태 패널

## 제외한 기능

점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현, 사운드, 실제 총알/요격체 궤적, 실제 미사일 궤도, 실제 탄도 계산, 실제 중력 계산, 실제 공격 위성 궤도 계산, 실제 공격무기 궤도, 실제 달 위도/경도 계산, 지구 표면 발사, 지구 궤도 위성 발사, 지구 표면의 정확한 발사 좌표 계산, 종착지/충돌 판정, Attack-Source 위치 다양화, Lunar Defense Zone 좌우/앞뒤 범위 확정은 이번 범위에서 제외합니다.

또한 복잡한 폭발 연출, 실제 무기 시스템 확정, 메인 게임 구현, simulator 저장소 수정, fullscreen mode 구현은 포함하지 않는다.

## 확인할 질문

- 위협의 출발점이 지구 또는 지구 주변으로 보이면 게임의 긴장감이 더 명확해지는가?
- 공격 원천 표시가 너무 복잡하지 않으면서도 “저기서 온다”는 느낌을 주는가?
- 위협이 이동할 때 기존 edge indicator, Visual Contact, Occluded, Lock Ready 흐름이 유지되는가?
- 시선을 아래로 향하면 달 표면 비중이 충분히 증가하고, 중앙 crosshair가 달 표면 위에 놓일 수 있는가?
- Earth Scale 6x 기준에서 공격 원천, 지구, 위협 마커가 함께 읽히는가?
- 이후 실제 공격 위성, 지구 표면 기지, 궤도선 표현으로 확장할 수 있는가?

## 다음 단계 후보

- 공격 원천 시각 표현 개선
- Earth Surface Source / Orbital Source 후보 비교
- 지구 표면 여러 발사 지점 후보 비교
- 지구 궤도 위성 발사 지점 후보 비교
- Attack-Source와 Lunar Defense Zone의 다양한 조합 검토
- Lunar Defense Zone의 앞/뒤, 좌/우, 달 표면상 위치 기준 검토
- 전면 접근 / 측면 접근 / 달 뒤편 접근 후보 비교
- 달 표면 아래 또는 뒤편 방향에서 접근하는 위협 검토
- 달 뒤편 접근 시 처음에는 `Impact Warning` 또는 `Detected / Occluded`로 표시되고, 플레이어가 시선을 아래로 향했을 때 `Visual Contact`가 되는 흐름 검토
- 위협 이동 경로 후보 비교
- 실제 공격 궤도 후보 검토
- 실제 공격무기 궤도 검토
- 지구 표면 발사와 지구 궤도 위성 발사 표현 검토
- 종착지/충돌 판정 검토
- 마우스 감도와 시야 이동 범위 조정
- fullscreen mode 검토
- 이후 별도 단계에서 실제 요격체 궤적 검토
