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

## 2026-06-25 - Threat Aim Lock 진행

결정: `prototype-02-threat-direction-scan` 검토 결과, edge indicator를 따라 위협 방향을 찾는 흐름과 화면 밖 위협 / 달 표면에 가려진 위협 / 시야 내 포착 상태 구분이 필요하다고 판단했다. 해당 구분이 동작한 뒤, 다음 단계로 시야 내 포착한 위협을 화면 중앙 조준 기준점에 맞추는 감각을 확인하기 위해 `prototype-03-threat-aim-lock`을 진행한다.

이유: 이번 단계에서는 발사, 격추, 점수, 실패 조건을 구현하지 않고, `Visual Contact` 상태의 위협만 `Aim Aligned / Lock Ready` 상태로 넘어갈 수 있는지 확인한다. `Lock Ready`는 실제 무기 락온 완료가 아니라 조준 중심 정렬 감각을 확인하기 위한 prototype 상태이다.

## 2026-06-25 - Threat Aim Lock의 조준 범위 기준 정리

결정: `prototype-03-threat-aim-lock`의 조준 가능 범위는 지구 주변 영역이 아니라 현재 보이는 Canvas / viewport 전체 기준으로 판단한다. 조준 방식은 화면 중앙에 고정된 crosshair와 view offset 기반 screen-space 투영을 사용한다. 지구와 위협 마커는 동일한 view transform으로 화면 위치를 계산한다.

이유: 조준 기준점은 플레이어 화면 중앙에 고정된 HUD 기준이어야 하며, 마우스 입력은 crosshair가 아니라 view offset을 움직여야 한다. 지구와 위협은 world/view-space 위치를 기준으로 현재 view offset에 따라 같은 비율로 화면에 투영되며, 조준점이 움직이거나 위협이 자동으로 중앙에 끌려오는 방식은 사용하지 않는다. edge indicator는 화면 밖 방향 표시용 HUD로만 사용한다. `Lock Ready`는 `Visual Contact` 상태의 위협이 화면 중앙 조준 기준점 근처에 들어온 경우에만 성립한다. 달 표면에 가려진 위협은 중앙 조준점 근처에 있어도 `Lock Ready`가 되지 않는다.

## 2026-06-26 - Intercept Feedback 진행

결정: `prototype-03-threat-aim-lock` 검토 결과, 위협 탐색 → 시야 내 포착 → 중앙 조준점 정렬 → `Lock Ready` 흐름이 동작한다고 판단했다. 조준점은 화면 중앙에 고정하고 지구/배경/위협 마커가 같은 view transform을 공유하도록 수정한 뒤 움직임이 자연스러워졌다. 다음 단계로 `Lock Ready` 상태에서 최소 발사/요격 피드백 감각을 확인하기 위해 `prototype-04-intercept-feedback`을 진행한다.

이유: 이번 단계는 완성형 전투 루프가 아니라, `Lock Ready` 이후 발사 입력과 위협 제거 피드백이 자연스럽게 읽히는지 확인하기 위한 작은 prototype이 필요하기 때문이다. 점수, 체력, 실패 조건, 웨이브, 난이도 상승, 실제 무기 시스템 확정은 포함하지 않는다.

보류: fullscreen mode, 위협 위치, 실제 공격 궤도, 마우스 감도/시야 범위 조정은 후속 검토 후보로 남긴다.

## 2026-06-26 - Threat Approach Timing 진행

결정: `prototype-04-intercept-feedback` 검토 결과, Lock Ready 상태에서 발사 입력 후 최소 요격 반응이 동작한다고 판단했다. 아직 실제 총알/요격체 궤적은 없지만 입력 후 폭발/요격 피드백을 확인하는 목적은 달성했다. 다음 단계로 정지한 위협이 아니라 움직이는 위협의 접근 타이밍과 요격 감각을 검증하기 위해 `prototype-05-threat-approach-timing`을 진행한다.

이유: 이번 단계에서는 완성형 전투 루프가 아니라, 움직이는 위협 1개를 찾고 따라가며 `Visual Contact`와 `Lock Ready` 흐름이 유지되는지, 그리고 제한된 시간 안에 발사 입력을 넣는 감각이 성립하는지 확인하기 위해서이다. 점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현은 포함하지 않는다.

보류: 실제 총알/요격체 궤적, 실제 공격 궤도, 위협 속도/경로 후보, 마우스 감도/시야 범위 조정은 후속 검토 후보로 남긴다.

## 2026-06-26 - Attack Source Trajectory 진행

결정: `prototype-05-threat-approach-timing` 검토 결과, 움직이는 위협을 찾고 조준하고 요격하는 시간 감각은 성립한다고 판단했다. 다만 위협이 지구 또는 지구 주변 공격 원천에서 출발한다는 감각은 아직 약하므로, 다음 단계로 공격 원천 표시와 위협 접근 경로를 연결하기 위해 `prototype-06-attack-source-trajectory`를 진행한다.

이유: 이번 단계에서는 실제 궤도 물리나 완성형 전투 루프를 구현하지 않고, 지구 가장자리 또는 지구 주변의 단순 공격 원천 마커, launch pulse, 움직이는 위협 경로가 한 흐름으로 읽히는지 확인하기 위해서이다. 점수, 체력, 게임 오버, 웨이브, 난이도 상승, 여러 위협 동시 출현은 포함하지 않는다.

보류: 실제 궤도 물리, 실제 공격 위성 궤도, 지구 표면 발사 좌표, 실제 요격체 궤적은 후속 검토 후보로 남긴다. Earth Scale `6x`는 현재 prototype 검토 기준값이며, 메인 게임 공식 확정값은 아니다.

## 2026-06-26 - Attack Source Trajectory 경로 보정

결정: `prototype-06-attack-source-trajectory`에서 위협은 `attack-source` 마커와 같은 지점에서 출발하는 것으로 정리한다.

결정: 위협 경로는 실제 물리 궤도가 아니라, 공격 원천에서 달/주인공 방향으로 접근하는 흐름을 보여주는 단순 경로로 둔다.

이유: 이번 prototype의 목적은 실제 미사일 궤도, 실제 공격 위성 궤도, 지구 표면 발사 좌표, 충돌 판정을 확정하는 것이 아니라, 공격 원천과 위협 접근 흐름이 플레이 화면에서 한눈에 연결되는지 확인하는 것이기 때문이다.

## 2026-06-26 - 동적 달 표면 비중과 전면 접근 기준

결정: `prototype-06-attack-source-trajectory`에서 시야를 아래로 이동하면 달 표면 비중을 동적으로 증가시키는 방향으로 정리한다.

결정: `Lunar Defense Zone`은 현재 단계에서 전면 접근 기준의 달 표면/주인공 방어 지점으로 본다.

결정: 달 뒤편 접근, Attack-Source 다양화, Lunar Defense Zone 좌우 범위는 후속 검토 후보로 남긴다.

이유: 이번 단계의 목적은 FPS식 시야에서 아래를 볼 때 달 표면이 더 많이 보이는 감각과, 위협이 달 표면 아래로 지나가지 않고 전면 방어 지점으로 접근하는 흐름을 확인하는 것이기 때문이다.

## 2026-06-26 - Lunar Defense Zone 표면 기준

결정: `prototype-06-attack-source-trajectory`에서 `Lunar Defense Zone`은 달 표면상의 방어 지점으로 해석한다.

결정: `Lunar Defense Zone`은 공중의 목표점이 아니라, 주인공이 서 있는 달 표면 앞쪽의 기준점으로 표현한다.

이유: `Lunar Defense Zone`이 하늘에 떠 있는 마커처럼 보이면 위협이 달 표면 방어 지점으로 접근한다는 흐름이 약해지므로, 실제 마커와 도달 기준점은 현재 화면에 표시되는 달 표면에 붙어 있어야 한다.

## 2026-06-26 - Lunar Defense Zone surface anchor 기준

결정: `prototype-06-attack-source-trajectory`에서 `Lunar Defense Zone`은 지평선 기준이 아니라 달 표면 내부의 surface anchor로 표현한다.

결정: 현재 기준값은 달 표면 영역 안에서 지평선으로부터 약 `60%` 내려온 지점으로 둔다.

결정: 실제 달 위도/경도와 Lunar Defense Zone의 좌우/앞뒤 범위는 후속 검토 후보로 남긴다.

이유: `Lunar Defense Zone`이 지평선 라벨처럼 보이면 주인공 앞쪽 표면 방어 지점이라는 의미가 약해지므로, 현재 보이는 달 표면 영역 안쪽에 명확한 기준점을 두기 위해서이다.

## 2026-06-26 - Direct Surface Approach 단순 곡선 기준

결정: `prototype-06-attack-source-trajectory`에서는 실제 물리 계산 대신 `Direct Surface Approach`용 단순 곡선 경로를 사용한다.

결정: 이 경로는 `Attack Source`에서 출발한 위협이 `Lunar Defense Zone` 위쪽 하늘 영역을 거쳐 달 표면 내부 방어 지점으로 내려오는 흐름을 보여준다.

결정: 달 뒤편/아래쪽 접근과 실제 궤도 계산은 후속 검토 후보로 남긴다.

이유: 이번 prototype의 목적은 탄도, 중력, 궤도 정확도가 아니라 공격 원천에서 달 표면 방어 지점으로 이어지는 전면 접근 흐름이 자연스럽게 읽히는지 확인하는 것이기 때문이다.

## 2026-06-26 - Prototype 06 검토 결과 메모

결정: `prototype-06-attack-source-trajectory`에서 `Attack Source`에서 시작해 `Lunar Defense Zone`으로 접근하는 흐름은 성립한 것으로 본다.

결정: 직선 이동보다 완만한 곡선 접근이 더 자연스러우므로 현재 단계에서는 단순 곡선 접근을 유지한다.

보류: 마지막 도달 지점에서 위협이 달 내부로 들어가는 듯한 표현은 실제 달 표면 지형, 충돌 연출, 공격체 고도 표현, 접근 타입 구분과 함께 후속 단계에서 다룬다.

## 2026-06-26 - Threat Origin Types 진행

결정: `prototype-06-attack-source-trajectory` 검토 결과, 공격 원천에서 출발한 위협이 Lunar Defense Zone으로 접근하는 흐름은 성립한다고 판단했다.

결정: Lunar Defense Zone은 달 지평선이 아니라 달 표면 내부 방어 지점으로 정리했으며, 현재 prototype 기준에서는 보이는 달 표면 영역 안에서 surface depth 약 `60%` 지점에 둔다.

결정: 다음 단계로 Earth Surface Source / Orbital Source / Behind Surface Approach를 구분해 공격 원천 타입별 플레이 감각을 확인하기 위해 `prototype-07-threat-origin-types`를 진행한다.

보류: 마지막 도달 지점에서 위협이 달 내부로 들어가는 듯한 표현은 후속 표면/충돌 연출 문제로 남긴다. 실제 궤도 물리, 실제 공격 위성 궤도, 실제 달 뒤편 접근 물리, 지구 표면의 정확한 발사 좌표 계산은 후속 검토 후보로 남긴다.

## 2026-06-27 - 공격 원천 위치와 공통 trajectory 기준 정리

결정: `prototype-07-threat-origin-types` 검토 결과, High / Low는 별도 공격 타입이나 별도 궤적 모델이 아니라 source position preset으로 정리한다.

결정: `Earth Surface High`, `Earth Surface Low`, `Orbital High`, `Orbital Low`는 모두 같은 trajectory generator를 사용한다. 각 조합의 차이는 지구 표면 또는 지구 주변 궤도상의 출발 위치에만 둔다.

결정: Under-Horizon은 독립된 Origin Type이나 별도 trajectory model이 아니다. 낮은 source position 또는 현재 view offset 때문에 위협이 동적 달 표면 영역 뒤에 놓일 때 발생하는 `Occluded-then-Visual-Contact` visibility behavior로 정리한다.

결정: `Occluded`, `Visual Contact`, `Lock Ready`는 Origin Type이나 Source Position으로 강제하지 않고 현재 화면과 동적 달 표면 영역을 기준으로 판정한다.

이유: Low 전용 hidden / reveal 경로는 Low를 별도 공격 방식처럼 보이게 하고 궤적을 복잡하게 만든다. 공통 경로 생성기와 화면 기준 가림 판정을 사용하면 원천 종류와 위치만 비교하면서 기존 탐색·조준·요격 흐름을 유지할 수 있다.

보류: 실제 지구 남극 좌표, 실제 공격 위성 궤도와 위성 운동, 실제 탄도/중력, 실제 달 뒤편 물리 계산은 후속 검토 후보로 남긴다.
