import type { NextRequest } from "next/server";
import { type MessageList } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";
import { MAX_TOKEN, TEAMPERATURE } from "@/utils/constant";
// 👇 1. 新增這一行 import
import { retrieveContext } from '../../utils/rag';

type StreamPayload = {
  model: string;
  messages: MessageList;
  temperature?: number;
  stream: boolean;
  max_tokens?: number;
}

export default async function handler(req: NextRequest,) {
  const { prompt, history = [], options = {} } = await req.json();
  const { max_tokens, temperature } = options

  // ==========================================
  // 🔥【插入位置】RAG 邏輯從這裡開始
  // ==========================================

  // 1. 拿使用者的問題 (prompt) 去找資料
  const context = retrieveContext(prompt);

  // 2. 準備 System Prompt (原本是直接用 options.prompt)
  let systemPrompt = options.prompt || "你是一個有用的 AI 助手";

  // 3. 如果有找到資料，就加到後面
  if (context) {
    // 可以在 Vercel 後台 logs 看到有沒有成功
    console.log("🔍 [RAG] 檢索到的資料:", context); 
    
    systemPrompt += `\n\n【系統補充 - 學校內部資訊】：\n${context}\n\n請優先依據上述補充資訊回答使用者的問題。`;
  }

  // ==========================================
  // 🔥【插入位置】RAG 邏輯結束
  // ==========================================

  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        // 👇 4. 這裡原本是 content: options.prompt，改成我們加工過的變數
        content: systemPrompt, 
      },
      ...history,
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
    temperature: +temperature || TEAMPERATURE,
    max_tokens: +max_tokens || MAX_TOKEN,
  };

  const stream = await requestStream(data);
  return new Response(stream);
}

// ... (下方的 requestStream 和 createStream 都不用動，維持原樣即可) ...

const requestStream = async(payload: StreamPayload) => {
  let counter = 0;
  const resp = await fetch(`${process.env.END_POINT}/v1/chat/completions`, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (resp.status !== 200) {
    return resp.body;
  }
  return createStream(resp, counter);
};

const createStream = (response: Response, counter: number) => {
  const decoder = new TextDecoder("utf-8"); // 轉換成文字
  const encoder = new TextEncoder(); //轉換成二進制
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
              return; //遇到換行不處理
            }
            const q = encoder.encode(text);
            controller.enqueue(q);
            counter++;
          } catch (error){}
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of response.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });
};

export const config = {
  runtime: "edge",
};