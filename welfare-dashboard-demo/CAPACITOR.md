모바일 앱(카파시터) 빌드 가이드
=================================

사전 준비
- Node 18+ / npm
- iOS: Xcode, CocoaPods(`sudo gem install cocoapods`)
- Android: Android Studio, Android SDK

패키지 설치
1) 프로젝트 루트로 이동: `cd welfare-dashboard-demo`
2) 카파시터 패키지 설치:
   - `npm i @capacitor/core`
   - `npm i -D @capacitor/cli`

초기화 및 플랫폼 추가
- 한 번만 실행
  - `npm run cap:init`
  - `npm run cap:add:ios`
  - `npm run cap:add:android`

개발(라이브 리로드)
1) Vite 개발 서버 실행: `npm run dev`
2) 자신의 LAN IP와 포트를 환경변수로 지정하여 앱 실행
   - Android: `CAP_SERVER_URL=http://<내IP>:5173 npm run mobile:android`
   - iOS: `CAP_SERVER_URL=http://<내IP>:5173 npm run mobile:ios`
   - 앱은 지정된 서버 URL을 로드합니다(`capacitor.config.ts`의 `server.url`).

프로덕션 빌드
1) 웹 번들 생성: `npm run build`
2) 앱에 반영: `npm run cap:copy` 또는 `npm run cap:sync`
3) IDE에서 열기
   - Android Studio: `npm run cap:open:android`
   - Xcode: `npm run cap:open:ios`

스크립트 요약(package.json)
- `mobile:build`: 웹 빌드 후 `cap copy`
- `mobile:android`: 빌드 후 에뮬레이터/디바이스 실행
- `mobile:ios`: 빌드 후 시뮬레이터/디바이스 실행
- `cap:*`: 각종 보조 스크립트(초기화/추가/동기화/열기)

기타 팁
- 앱 아이콘/스플래시는 `@capacitor/assets`로 생성 가능: `npx @capacitor/assets generate`
- 상태바/내비바 색상 등 네이티브 UI는 `@capacitor/status-bar` 등 플러그인으로 제어할 수 있습니다.

