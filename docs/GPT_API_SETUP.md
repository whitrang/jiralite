# GPT API 연동 가이드

## 📋 개요

이 프로젝트에 OpenAI GPT API가 연동되어 있습니다. GPT를 사용하여 프로젝트 이름 생성, 이슈 설명 작성, 작업 분해 등 다양한 AI 기능을 구현할 수 있습니다.

## 🚀 설정 방법

### 1. OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 접속
2. 계정 생성 또는 로그인
3. "Create new secret key" 클릭하여 API 키 생성
4. 생성된 키를 복사 (한 번만 표시됩니다!)

### 2. 환경 변수 설정

`.env` 파일에 다음 내용을 추가하세요:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-your_actual_api_key_here
```

### 3. 개발 서버 재시작

```bash
npm run dev
```

## 📖 사용 방법

### 기본 사용 예시

```typescript
import { askGPT } from '@/lib/api/gpt';

// 간단한 질문
const response = await askGPT("프로젝트 이름 3개 추천해줘");
console.log(response);
```

### 시스템 메시지와 함께 사용

```typescript
import { askGPT } from '@/lib/api/gpt';

const response = await askGPT(
  "이 버그를 설명해줘: 로그인 버튼이 작동하지 않음",
  "당신은 프로젝트 관리 앱의 도움이 되는 어시스턴트입니다."
);
```

### 채팅 기록과 함께 사용

```typescript
import { chatCompletion, ChatMessage } from '@/lib/api/gpt';

const messages: ChatMessage[] = [
  { role: 'system', content: '당신은 개발 전문가입니다.' },
  { role: 'user', content: 'React에서 상태 관리를 어떻게 하나요?' },
  { role: 'assistant', content: 'React에서는 useState, useReducer 등을 사용합니다.' },
  { role: 'user', content: 'Context API는 언제 사용하나요?' }
];

const response = await chatCompletion(messages);
```

### 스트리밍 사용 (실시간 응답)

```typescript
import { streamChatCompletion, ChatMessage } from '@/lib/api/gpt';

const messages: ChatMessage[] = [
  { role: 'user', content: '긴 설명을 작성해주세요' }
];

await streamChatCompletion(
  messages,
  (chunk) => {
    // 각 청크가 도착할 때마다 실행
    console.log('받은 텍스트:', chunk);
    setResponse(prev => prev + chunk);
  }
);
```

### 모델 및 옵션 설정

```typescript
import { askGPT } from '@/lib/api/gpt';

const response = await askGPT(
  "복잡한 작업을 분해해줘",
  "당신은 프로젝트 매니저입니다.",
  {
    model: 'gpt-4',           // 더 강력한 모델 사용
    temperature: 0.9,          // 더 창의적인 응답 (0.0 ~ 1.0)
    max_tokens: 2000,          // 더 긴 응답 허용
  }
);
```

## 🎯 실제 활용 예시

### 1. 프로젝트 이름 생성

```typescript
const projectName = await askGPT(
  `다음 설명에 맞는 프로젝트 이름 5개를 추천해줘: ${description}`,
  "당신은 창의적인 네이밍 전문가입니다."
);
```

### 2. 이슈 자동 분류

```typescript
const category = await askGPT(
  `다음 이슈를 Bug, Feature, Enhancement 중 하나로 분류해줘: ${issueDescription}`,
  "당신은 이슈 분류 전문가입니다. 한 단어로만 답변하세요."
);
```

### 3. 작업 분해

```typescript
const tasks = await askGPT(
  `다음 기능을 개발하기 위한 세부 작업 목록을 만들어줘: ${featureDescription}`,
  "당신은 프로젝트 매니저입니다. 체크리스트 형식으로 답변하세요."
);
```

### 4. 코드 리뷰 요청

```typescript
const review = await askGPT(
  `다음 코드를 리뷰해줘:\n\n${code}`,
  "당신은 시니어 개발자입니다. 개선점과 버그를 찾아주세요."
);
```

## 📁 파일 구조

```
lib/
├── openai.ts              # OpenAI 클라이언트 설정
└── api/
    └── gpt.ts            # GPT API 함수들

components/
└── GPTChatExample.tsx    # 사용 예시 컴포넌트

app/(dashboard)/
└── gpt-test/
    └── page.tsx          # 테스트 페이지
```

## 🧪 테스트 페이지

GPT API를 테스트하려면:

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 접속: `http://localhost:3000/gpt-test`
3. 질문을 입력하고 "Ask GPT" 버튼 클릭

## 💰 비용 안내

- **gpt-4o-mini**: 저렴하고 빠름 (기본 설정)
  - Input: $0.150 / 1M tokens
  - Output: $0.600 / 1M tokens

- **gpt-4o**: 더 강력하지만 비쌈
  - Input: $2.50 / 1M tokens
  - Output: $10.00 / 1M tokens

- **gpt-4-turbo**: 균형잡힌 선택
  - Input: $10.00 / 1M tokens
  - Output: $30.00 / 1M tokens

모델 변경은 `lib/openai.ts`의 `GPT_CONFIG.model`에서 할 수 있습니다.

## 🔒 보안 주의사항

⚠️ **중요**: 현재 설정은 클라이언트 사이드에서 직접 OpenAI API를 호출합니다 (`dangerouslyAllowBrowser: true`).

**프로덕션 환경에서는:**
1. API 키를 클라이언트에 노출하지 마세요
2. Next.js API Routes를 통해 서버 사이드에서 호출하세요
3. 사용량 제한(rate limiting)을 구현하세요

### 서버 사이드 구현 예시

```typescript
// app/api/gpt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  // 여기서 인증 확인
  // 여기서 rate limiting 체크

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return NextResponse.json({
    result: response.choices[0]?.message?.content
  });
}
```

## 🆘 문제 해결

### API 키가 작동하지 않음
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작했는지 확인
- API 키가 `NEXT_PUBLIC_` 접두사를 가지고 있는지 확인

### "Insufficient credits" 오류
- OpenAI 계정에 크레딧이 있는지 확인
- [Billing 페이지](https://platform.openai.com/account/billing/overview)에서 확인

### CORS 오류
- 클라이언트 사이드 호출 시 `dangerouslyAllowBrowser: true` 설정 확인
- 프로덕션에서는 서버 사이드 API 사용 권장

## 📚 참고 자료

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [OpenAI Node.js Library](https://github.com/openai/openai-node)
