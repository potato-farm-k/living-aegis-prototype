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
