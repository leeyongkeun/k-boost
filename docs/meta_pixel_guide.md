# 메타 픽셀 설치 요청 (개발자 전달용)

> 대상 앱: React (Vercel 배포) — `k-boost-amber.vercel.app`
> 픽셀 ID: `1307787700930555`

---

## ✅ 설치 완료 (2026-05-31)

이 앱은 **Next.js App Router**라 아래 원본 가이드(CRA `public/index.html` 기준)를
다음과 같이 변환해 적용했습니다. 실제 구현은 아래를 참고하세요.

| 항목 | 적용 위치 |
|---|---|
| 픽셀 ID | `.env.local` → `NEXT_PUBLIC_META_PIXEL_ID` (헬퍼 폴백 포함) |
| 헬퍼 모듈 | `lib/pixel.ts` (`trackStandard`/`trackCustom`/`trackLead`, fbq 가드 일원화) |
| 기본 코드 + PageView | `app/layout.tsx` `<head>` — `next/script`(afterInteractive) + `<noscript>` |
| `test_start` | `app/page.tsx` — Landing onStart |
| `quiz_start` | `app/page.tsx` — handleSubmit (결과 확인) |
| `result_view` | `app/page.tsx` — result phase 진입 |
| `Lead` ★ | `components/QuizResult.tsx` — handleCtaSubmit (연락처 제출) |
| `cta_click` | `components/Completion.tsx` — 외부 CTA onClick |

> 공유 결과 페이지(`/result/[id]`)는 중복 집계 방지를 위해 메인 퍼널만 추적합니다.

---

## 1. 작업 개요

메타(페이스북/인스타그램) 광고 성과 추적을 위해 앱에 **메타 픽셀**을 설치합니다.
아래 두 단계를 적용해주세요.

1. 기본 픽셀 코드 설치 (`<head>`)
2. 각 사용자 행동별 이벤트 코드 추가 (버튼 클릭 핸들러)

추적할 행동:

| 이벤트 | 의미 | 코드 |
|---|---|---|
| 앱 진입 | 광고 클릭 후 실제 진입한 사람 수 | `PageView` (기본 코드에 포함) |
| 테스트 시작 | 첫 화면에서 버튼 누른 사람 수 | `test_start` |
| 퀴즈 시작 | 두번째 화면에서 버튼 누른 사람 수 | `quiz_start` |
| 결과 확인 | 결과 화면 진입한 사람 수 | `result_view` |
| 연락처 제출 ★ | 실제 리드 전환 (가장 중요) | `Lead` |
| CTA 클릭 | 홈페이지로 넘어간 사람 수 | `cta_click` |

---

## 2. 1단계 — 기본 픽셀 코드 설치

`public/index.html` 의 `<head>` 태그 안에 아래 코드를 추가해주세요.

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1307787700930555');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1307787700930555&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->
```

---

## 3. 2단계 — 각 행동별 이벤트 코드 추가

**각 버튼의 클릭 핸들러 함수 안**에 해당 코드를 추가해주세요.
(페이지 로드 시 한꺼번에 실행되면 안 됩니다 — 아래 주의사항 참고)

```js
// 첫번째 화면 - 테스트 시작 버튼 클릭 시
window.fbq('trackCustom', 'test_start');

// 두번째 화면 - 테스트 시작 버튼 클릭 시
window.fbq('trackCustom', 'quiz_start');

// 세번째 화면 - 결과 화면 진입 시
window.fbq('trackCustom', 'result_view');

// 세번째 화면 - 연락처 제출 완료 시 ★ 가장 중요
window.fbq('track', 'Lead');

// 마지막 화면 - 홈페이지 CTA 버튼 클릭 시
window.fbq('trackCustom', 'cta_click');
```

### 안전하게 사용하는 방법 (권장)

`fbq` 로딩 전 호출 시 에러가 나지 않도록 항상 존재 여부를 확인하고 호출해주세요.

```js
if (window.fbq) { window.fbq('track', 'Lead'); }
```

> 모든 이벤트에 동일하게 `if (window.fbq) { ... }` 가드를 적용하는 것을 권장합니다.

---

## 4. 주의사항

- 이벤트는 **반드시 버튼 클릭 완료 시점**에 실행되어야 합니다.
- 페이지 로드 시 한꺼번에 실행되면 안 됩니다.
- `Lead`(연락처 제출)는 가장 중요한 전환 이벤트이므로 누락 없이 적용해주세요.

---

## 5. 설치 확인 방법

설치 완료 후 브라우저에서 확인:

1. 브라우저에서 앱 접속
2. `F12` → **Console** 탭
3. 아래 입력

```js
typeof fbq
```

4. `"function"` 이 나오면 설치 완료입니다.

설치 완료 후 알려주시면 광고 세팅 이어서 진행하겠습니다.
