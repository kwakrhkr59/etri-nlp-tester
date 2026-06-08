# ETRI 언어분석 API 테스터

ETRI 언어 분석 기술 6종 API를 테스트하는 Next.js 웹 인터페이스입니다.

## 지원 API

| API | 분석 코드 | 모드 |
|-----|-----------|------|
| 형태소 분석 | `morp` | 문어/구어 |
| 개체명 인식 | `ner` | 문어/구어 |
| 동음이의어 분석 | `wsd` | 문어 |
| 다의어 분석 | `wsd_poly` | 문어 |
| 의존 구문분석 | `dparse` | 문어 |
| 의미역 인식 | `srl` | 문어 |

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 열기

## Vercel 배포

### 방법 1 — GitHub 연동 (권장)
1. 이 저장소를 GitHub에 push
2. [vercel.com](https://vercel.com) → New Project → GitHub 저장소 선택
3. 별도 설정 없이 Deploy 클릭

### 방법 2 — Vercel CLI
```bash
npm install -g vercel
vercel
```

## 사용법

1. [epretx.etri.re.kr](https://epretx.etri.re.kr) 에서 회원가입 후 API Key 발급
2. 웹페이지 상단 **API KEY** 필드에 입력
3. **분석 모드** (문어체/구어체) 선택
4. **분석 텍스트** 입력
5. 원하는 API 카드의 **▶ 실행** 버튼 클릭

> API Key는 서버(Next.js API Route)에서만 사용되며 외부에 노출되지 않습니다.

## 구조

```
app/
├── api/analyze/route.ts   # ETRI API 프록시 (CORS 우회)
├── page.tsx               # 메인 UI
├── layout.tsx
└── globals.css
```
