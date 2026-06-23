# living-aegis-prototype

이 저장소는 Living Aegis Origin 제작을 위한 prototype 실험장이다.

이 저장소는 메인 게임이 아니다. 메인 게임은 `living-aegis-origin`에서 관리하고, simulator는 `living-aegis-simulator`에서 관리한다.

## 목적

Living Aegis Origin에 넣기 전 기능 아이디어를 작고 독립적인 prototype으로 실험한다.

루트 `index.html`은 실제 게임이 아니라 prototype 목록/런처 페이지이다. 현재 등록된 prototype을 보여주고, 각 독립 prototype 폴더로 연결한다.

각 prototype은 가능한 한 독립 폴더에서 실행 가능하게 관리한다.

## 로컬 실행

브라우저에서 `index.html`을 열면 prototype 런처를 볼 수 있다.

현재 런처에서 이동할 수 있는 prototype:

```text
prototype-01-basic-defense/
```

각 prototype은 build step 없이 정적 페이지로 실행할 수 있도록 관리한다.

## GitHub Pages

이 저장소는 단순한 HTML, CSS, JavaScript를 사용한다. 따라서 루트 런처 페이지와 각 prototype 폴더를 GitHub Pages에서 바로 제공할 수 있다.

## prototype 추가 기준

새 prototype은 별도 폴더에 추가한 뒤 다음 문서를 함께 갱신한다.

- `index.html`
- `PROTOTYPE_INDEX.md`
- `CHANGELOG.md`

prototype 폴더는 이후 `DECISION_LOG.md`에서 별도로 변경 결정이 기록되기 전까지 서로 독립적으로 유지한다.

## 문서 언어 원칙

내부 설명 문서는 한국어 중심으로 작성한다. 파일명, 폴더명, 코드 식별자, 주요 기술 용어는 영어를 유지한다.
