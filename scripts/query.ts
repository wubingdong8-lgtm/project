// scripts/query.ts
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const runQuery = async () => {
  try {
    // ---------------------------------------------------------
    // 👇 修改這裡：把這個問題改成你的 .txt 文件裡真正有的內容
    const myQuestion = "請簡短介紹一下這份文件的重點是什麼？";
    // ---------------------------------------------------------

    console.log(`❓ 正在詢問：${myQuestion}`);
    console.log("🔍 正在 Pinecone 資料庫中搜尋相關內容...");

    // 1. 連線到 Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    // 2. 建立 Vector Store 連線 (注意：這裡是 fromExistingIndex，代表讀取現有的)
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex }
    );

    // 3. 搜尋最相關的 3 段文字
    const results = await vectorStore.similaritySearch(myQuestion, 3);
    
    if (results.length === 0) {
        console.log("⚠️ 找不到相關資料，請確認 Pinecone 裡面真的有數據。");
        return;
    }

    // 把搜尋到的資料串接起來變成 "Context (上下文)"
    const context = results.map(doc => doc.pageContent).join("\n\n");
    console.log("📄 找到相關參考資料 (前 100 字):", context.substring(0, 100) + "...");

    // 4. 呼叫 GPT 回答
    console.log("🤖 AI 正在思考...");
    const chat = new ChatOpenAI({
        modelName: "gpt-4o-mini", // 或 gpt-3.5-turbo
        temperature: 0.7,
    });

    const response = await chat.invoke([
        {
            role: "system",
            content: `你是一個專業助理。請根據以下提供的【參考資料】來回答使用者的問題。如果參考資料沒有答案，就誠實說不知道。\n\n【參考資料】：\n${context}`
        },
        {
            role: "user",
            content: myQuestion
        }
    ]);

    console.log("\n==========================================");
    console.log("✅ AI 的回答：");
    console.log(response.content);
    console.log("==========================================");

  } catch (error) {
    console.error("❌ 發生錯誤:", error);
  }
};

runQuery();