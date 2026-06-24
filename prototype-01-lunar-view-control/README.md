# Prototype 01 - Lunar View Control

상태: `1차 구현`

이 프로토타입은 전투 시스템이 아니라, 달 표면에서 지구를 바라보는 기본 구도와 제한된 시야 이동 감각을 확인하기 위한 실험입니다.

## 목적

`living-aegis-simulator`의 `lunar-view-framing-simulator`에서 정리한 1차 달-지구 화면 구도 후보값을 실제 플레이 감각에 가까운 정적 prototype 화면에 적용한다.

시뮬레이터는 값을 찾는 도구이고, 이 prototype은 그 값이 화면에서 게임처럼 느껴지는지 확인하는 실험이다.

## 적용한 기준값

- Earth Scale: `5x` 기본값
- Alternative Earth Scale: `7x`
- Earth Vertical Position: `30%`
- Lunar Surface Area: `30%`
- View Movement: 작은 범위로 제한된 좌우/상하 이동

이 값들은 최종 게임 기준으로 확정된 값이 아니라, 1차 후보를 검토하기 위한 기본값이다.

## 조작 방법

- Arrow keys 또는 WASD: 제한된 시야 이동
- `1` 또는 `5`: Earth Scale 5x
- `2` 또는 `7`: Earth Scale 7x
- `R`: 기본 정면 보기로 복귀
- 화면 버튼: Earth Scale 전환 및 기본 정면 보기 복귀

## 확인할 질문

- Earth Scale 5x와 7x 중 어느 쪽이 더 게임 화면에 적절한가?
- Earth Vertical Position 30%가 1인칭 화면에서 자연스러운가?
- Lunar Surface Area 30%가 달 표면에 서 있다는 감각을 주는가?
- 제한된 시야 이동이 답답함보다 긴장감과 현장감을 주는가?

## 제외한 기능

미사일, 발사, 격추, 점수, 적, 사운드, 마우스 조준, 게임 승패 조건은 이번 범위에서 제외합니다.

또한 공격 위성, 타겟 락온, 카메라 반동, 메인 게임 구현, simulator 저장소 수정은 포함하지 않는다.

## 다음 단계 후보

- Earth Scale 5x/7x 비교 결과 기록
- Earth Vertical Position과 Lunar Surface Area 후보값 조정 여부 판단
- 제한된 시야 이동 범위가 적절한지 확인
- 이후 별도 prototype에서 마우스 조준 또는 전투 감각을 독립적으로 실험
