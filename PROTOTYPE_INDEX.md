# Prototype Index

이 문서는 `living-aegis-prototype`에 등록된 prototype을 추적한다.

이 저장소는 Living Aegis Origin 제작을 위한 prototype 실험장이다. 메인 게임은 `living-aegis-origin`에서 관리하고, simulator는 `living-aegis-simulator`에서 관리한다.

## Prototype 01 - Lunar View Control

- Path: `prototype-01-lunar-view-control/`
- Status: `1차 구현`
- Purpose: 달 표면에서 지구를 바라보는 기본 구도와 제한된 시야 이동 감각 확인
- Entry: `prototype-01-lunar-view-control/index.html`
- Notes: Earth Scale 6x를 기본 후보로 두고 5x/7x를 비교 후보로 유지하며, 키보드와 마우스 시야 이동으로 Earth Vertical Position 30%, Lunar Surface Area 30% 후보값을 플레이 감각으로 확인하는 프로토타입

## Prototype 02 - Threat Direction Scan

- Path: `prototype-02-threat-direction-scan/`
- Status: `1차 구현`
- Purpose: 마우스 시야 이동으로 화면 밖 또는 지구 주변의 위협 방향을 찾는 감각 확인
- Entry: `prototype-02-threat-direction-scan/index.html`
- Notes: Earth Scale 6x, Earth Vertical Position 30%, Lunar Surface Area 30% 기준에서 위협 방향 표시, edge indicator, 달 표면 가림 상태와 시야 내 포착 상태의 구분을 확인하는 프로토타입

## Prototype 03 - Threat Aim Lock

- Path: `prototype-03-threat-aim-lock/`
- Status: `1차 구현`
- Purpose: 시야 내 포착한 위협을 화면 중앙 조준 기준점에 맞추는 감각 확인
- Entry: `prototype-03-threat-aim-lock/index.html`
- Notes: `prototype-02-threat-direction-scan`의 edge indicator와 위협 상태 구분을 바탕으로, 현재 보이는 Canvas 화면 전체 기준에서 `Visual Contact` 상태일 때만 `Aim Aligned / Lock Ready`가 되는지 확인하는 프로토타입

## Removed Placeholder

- `prototype-01-basic-defense/`는 초기 구조 확인용 scaffold였으며, 실제 실험 대상이 아니어서 루트 런처와 활성 prototype 목록에서 제거했다.
