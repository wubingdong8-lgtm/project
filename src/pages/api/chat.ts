import type { NextApiRequest, NextApiResponse } from 'next'; // 改用 Node 版的型別
import { type MessageList } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";
import { MAX_TOKEN, TEAMPERATURE } from "@/utils/constant";
import { retrieveContext } from '../../utils/rag'; // 引入 RAG

// 強制使用 Node.js Runtime (這樣 Pinecone 才能跑)
export const config = {
  runtime: "nodejs", 
};

type StreamPayload = {
  model: string;
  messages: MessageList;
  temperature?: number;
  stream: boolean;
  max_tokens?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 【修正輸入】Node.js 版直接用 req.body，不需要 await req.json()
  const { prompt, history = [], options = {} } = req.body;
  const { max_tokens, temperature } = options;

  // ==========================================
  // 🔥 RAG 邏輯
  // ==========================================
  const context = await retrieveContext(prompt);
  let systemPrompt = options.prompt || "你是一個有用的 AI 助手";

  if (context) {
    console.log("🔍 [RAG] 系統補充資料長度:", context.length);
    systemPrompt += `\n\n【系統補充 - 內部知識庫】：\n${context}\n\n請優先依據上述補充資訊回答使用者的問題。`;
  }
  // ==========================================

  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: prompt },
    ],
    stream: true,
    temperature: +temperature || TEAMPERATURE,
    max_tokens: +max_tokens || MAX_TOKEN,
  };

  // 2. 【修正輸出】設定 Headers 告訴瀏覽器這是一條串流 (Stream)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  try {
    // 呼叫 OpenAI 並取得串流
    const stream = await requestStream(data);
    
    // 3. 【修正串流寫入】將 Web Stream 轉發給 Next.js 的 res (Node.js Writable)
    const reader = stream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // 這裡的 value 是 Uint8Array，直接寫入 response
      res.write(value);
    }
  } catch (error) {
    console.error("Stream Error:", error);
    res.write("發生錯誤，請稍後再試");
  } finally {
    res.end(); // 結束連線
  }
}

// 👇 以下是 Helper Functions (微調適配 Node 環境) 👇

const requestStream = async(payload: StreamPayload) => {
  let counter = 0;
  // 確保 baseUrl 永遠有一個合法的預設值
  const rawBaseUrl = process.env.END_POINT?.trim();
  const baseUrl = (rawBaseUrl && rawBaseUrl !== "") ? rawBaseUrl : "https://api.openai.com";

  const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (resp.status !== 200) {
    throw new Error(`OpenAI API Error: ${resp.statusText}`);
  }

  // 這裡回傳標準的 ReadableStream
  return createStream(resp, counter);
};

const createStream = (response: Response, counter: number) => {
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;
          if(data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0]?.delta?.content || "";
            if(counter < 2 && (text.match(/\n/) || [].length)){
              return;
            }
            const q = encoder.encode(text);
            controller.enqueue(q);
            counter++;
          } catch (error){}
        }
      };

      const parser = createParser(onParse);

      // Node.js 的 fetch polyfill 產生的 body 也是 async iterable
      for await (const chunk of response.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });
};