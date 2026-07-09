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

## Prototype 04 - Intercept Feedback

- Path: `prototype-04-intercept-feedback/`
- Status: `1차 구현`
- Purpose: Lock Ready 상태에서 발사 입력 후 최소 요격 피드백 감각 확인
- Entry: `prototype-04-intercept-feedback/index.html`
- Notes: `prototype-03-threat-aim-lock`의 조준 정렬 흐름을 바탕으로, Lock Ready 상태에서 발사/요격 피드백이 자연스러운지 확인하는 프로토타입

## Prototype 05 - Threat Approach Timing

- Path: `prototype-05-threat-approach-timing/`
- Status: `1차 구현`
- Purpose: 움직이는 위협을 찾고 조준하고 요격하는 시간 감각 확인
- Entry: `prototype-05-threat-approach-timing/index.html`
- Notes: `prototype-04-intercept-feedback`의 Lock Ready 및 요격 피드백 흐름을 바탕으로, 움직이는 위협 1개를 대상으로 tracking, aim, intercept timing을 확인하는 프로토타입

## Prototype 06 - Attack Source Trajectory

- Path: `prototype-06-attack-source-trajectory/`
- Status: `1차 구현`
- Purpose: 공격 원천에서 위협이 출발해 접근하고 요격되는 흐름 확인
- Entry: `prototype-06-attack-source-trajectory/index.html`
- Notes: `prototype-05-threat-approach-timing`의 움직이는 위협과 요격 흐름을 바탕으로, 지구 또는 지구 주변 공격 원천과 위협 접근 경로가 시각적으로 연결되는지 확인하는 프로토타입

## Prototype 07 - Threat Origin Types

- Path: `prototype-07-threat-origin-types/`
- Status: `1차 구현`
- Purpose: 공격 원천의 종류와 위치가 시야 가림, Visual Contact, 접근 감각에 어떤 영향을 주는지 확인
- Entry: `prototype-07-threat-origin-types/index.html`
- Notes: `prototype-06-attack-source-trajectory`의 공격 원천 → 접근 경로 → Lunar Defense Zone 흐름을 바탕으로, 네 Origin Type / Source Position 조합이 짧은 radial boost와 공통 단일 곡선을 사용하고 Off-screen / Surface Occluded를 구분하며 source와 무관한 2초 Impact Warning을 마지막 요격 기회로 제공하는 프로토타입

## Prototype 08 - P0 Missile Front Approach

- Path: `prototype-08-p0-missile-front-approach/`
- Status: `1차 구현`
- Purpose: P0 Missile-type Threat의 정면 접근감과 Impact Warning Corridor 검증
- Entry: `prototype-08-p0-missile-front-approach/index.html`
- Notes: `Surface Occluded / Predicted Contact` 없이 `Off-screen / Visual Contact / Lock Ready`만으로, source → boost → main trajectory → Impact Warning Corridor → Lunar Defense Zone / Impact 흐름이 Canvas 2D front projection에서 성립하는지 확인하는 프로토타입

## Threat Type Validation Priority v0.1

위협 유형의 상세 기준은 `living-aegis-origin/docs/GDD.md`에서 관리하고, 이 문서에는 prototype 검증 우선순위만 기록한다. 이 분류는 최종 enemy taxonomy가 아니라 현재 단계의 working draft다.

- P0 — Missile-type Threat: 현재 prototype의 main threat다. source, boost, trajectory, Lunar Defense Zone, Impact Warning Corridor와 기본 요격 문법을 우선 검증한다. `prototype-08-p0-missile-front-approach`에서는 Surface Occluded / Predicted Contact 없이 정면 접근감과 마지막 방어 선택 구간을 별도로 확인한다.
- P1 — Beam/Charge-type Threat: 발사 후 빔 대응이 아니라 발사 전 충전 또는 조준 source 차단을 검토하는 후속 변주다. 현재 구현 대상이 아니다.
- P2 — Mass/Object-type Threat: 약점 공격, 반복 타격, 줌 활용에 적합한 느리고 무거운 special threat 후보다. 현재 구현 대상이 아니다.

Beam/Charge-type Threat과 Mass/Object-type Threat은 Missile-type Threat의 기본 플레이 문법이 안정된 뒤 별도 prototype 필요성을 판단한다.

## Removed Placeholder

- `prototype-01-basic-defense/`는 초기 구조 확인용 scaffold였으며, 실제 실험 대상이 아니어서 루트 런처와 활성 prototype 목록에서 제거했다.
