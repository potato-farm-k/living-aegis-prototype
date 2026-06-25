# 결정 기록

이 문서는 `living-aegis-prototype`의 구조와 문서 정책에 관한 결정을 기록한다.

## 2026-06-23 - 초기 저장소 구조

결정:

- 이 저장소는 Living Aegis Origin 제작을 위한 prototype 실험장이다.
- 메인 게임은 `living-aegis-origin`에서 관리한다.
- simulator는 `living-aegis-simulator`에서 관리한다.
- 루트 `index.html`은 실제 게임이 아니라 prototype 목록/런처 페이지이다.
- 각 prototype은 가능한 한 독립 폴더에서 실행 가능하게 관리한다.
- 초기 단계에서는 build tool 없이 plain HTML, CSS, JavaScript로 시작한다.

이유: 메인 게임, 기능 실험, 제작 보조 도구의 역할을 분리하면 각 저장소의 변경 목적이 명확해지고 실험 과정에서 생기는 혼선을 줄일 수 있다.

## 2026-06-23 - 내부 설명 문서는 한국어 중심으로 작성

결정: 내부 설명 문서는 한국어 중심으로 작성한다.

이유: 이 프로젝트는 개인 학습과 반복 참고가 중요하므로, README와 index 문서처럼 자주 읽는 설명은 한국어로 정리하는 편이 좋다.

세부 원칙:

- 파일명, 폴더명, 코드 식별자, 주요 기술 용어는 영어를 유지한다.
- HTML, CSS, JavaScript 코드와 변수명, 함수명, class 이름, id 이름은 변경하지 않는다.
- `Canvas 2D`, `GitHub Pages`, `JavaScript`, `HUD`, `prototype`, `simulator`처럼 필요한 기술 용어는 영어 표기를 허용한다.
- GitHub Pages 화면의 프로젝트 제목과 저장소 이름은 영어를 유지할 수 있다.

## 2026-06-23 - Codex 반복 작업 지침을 AGENTS.md에 기록

결정: Codex가 이 저장소에서 작업할 때 반복해서 적용할 작업 원칙은 루트의 `AGENTS.md`에 기록한다.

이유: 새 작업을 시작할 때 이전 대화 맥락에 의존하지 않고, 저장소 안의 기준 문서와 각 prototype 폴더의 README를 먼저 확인한 뒤 같은 원칙으로 안전하게 작업하기 위해서이다.

## 2026-06-24 - 달-지구 기본 구도 후보값을 prototype에서 검증

결정: `lunar-view-framing-simulator`에서 정리한 1차 구도 후보값을 실제 플레이 감각에 가까운 `prototype-01-lunar-view-control`에서 검증하기로 한다.

이유: Earth Scale 5x/7x, Earth Vertical Position 30%, Lunar Surface Area 30% 후보값이 게임 화면처럼 느껴지는지 simulator가 아닌 prototype 화면에서 확인하기 위해서이다.

## 2026-06-24 - Lunar View Control 1차 기본 Earth Scale 후보

결정: `prototype-01-lunar-view-control`의 1차 기본 Earth Scale 후보를 `6x`로 둔다.

이유: `6x`는 지구 자체의 긴장감과 향후 지구 궤도 공격 위성 표시 공간 사이의 균형을 보기 위한 프로토타입 검토용 기준값이다. 메인 게임 공식 확정값은 아니다.

보류: 마우스 시야 이동과 위쪽 시선 이동 시 지구와 달 표면이 살짝 겹치는 구도는 후속 검토 후보로 둔다.

## 2026-06-24 - Lunar View Control 2차 검토 후 6x 유지

결정: `prototype-01-lunar-view-control`의 두 번째 검토 결과, Earth Scale `6x` 기본값을 계속 유지한다.

이유: `6x`는 안정적인 화면 구도와 후속 공격 위성 표시 공간을 고려한 프로토타입 기준값이다.

## 2026-06-25 - Mouse View Mode를 시야 조작감 검증용으로 추가

결정: 키보드 시야 이동만으로는 조작감 판단이 어려워 `prototype-01-lunar-view-control`에 마우스 시야 이동 확인 기능을 추가한다.

이유: 이 기능은 전투 시스템이 아니라 Earth Scale 6x 기준에서 1인칭 HUD 시야 조작감과 현재 시야 이동 폭의 적절성을 검증하기 위한 것이다.

## 2026-06-25 - Threat Direction Scan 진행

결정: `prototype-01-lunar-view-control` 검토 결과, Earth Scale `6x` 기본값이 안정적으로 보이고 마우스 기반 시야 이동이 자연스러운 긴장감을 만든다고 판단했다. 이에 따라 다음 단계로 화면 밖 또는 지구 주변의 위협 방향을 찾는 감각을 확인하기 위해 `prototype-02-threat-direction-scan`을 진행한다.

이유: 이번 단계에서는 전투 시스템으로 넘어가지 않고, 위협이 정면에 고정되어 있지 않을 때 edge indicator와 제한된 시야 이동만으로 “저쪽을 봐야 한다”는 감각이 생기는지 확인하기 위해서이다.

보류: fullscreen mode는 후속 개선 후보로 남긴다. Earth Scale `6x`는 현재 prototype 검토 기준값이며, 메인 게임 공식 확정값은 아니다.

## 2026-06-25 - Threat Direction Scan의 감지와 시각 포착 구분

결정: `prototype-02-threat-direction-scan`에서 위협의 방향 감지와 시야 내 포착을 구분한다. 달 표면에 가려진 위협은 감지 상태로 표시하되 `시야 내 포착`으로 보지 않는다.

이유: 위협 마커가 화면 안쪽 방향에 있더라도 Lunar Surface Area 30% 기준의 달 표면 영역 뒤에 있으면 실제로 볼 수 있는 상태가 아니기 때문이다. 이번 단계에서는 정교한 지형 판정 대신 달 표면 하단 영역 기준의 단순 2D 가림 판정을 사용한다.
