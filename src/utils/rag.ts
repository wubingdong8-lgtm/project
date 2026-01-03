import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

// 這是一個非同步函式，專門負責去資料庫撈資料
export async function retrieveContext(query: string) {
  try {
    console.log("🔍 [RAG] 開始檢索:", query);

    // 1. 連線 Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    // 2. 準備向量搜尋
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      }),
      { pineconeIndex }
    );

    // 3. 搜尋最相關的 3 筆資料
    const results = await vectorStore.similaritySearch(query, 3);

    // 4. 如果沒找到資料
    if (results.length === 0) {
      console.log("⚠️ [RAG] 找不到相關資料");
      return "";
    }

    // 5. 整理資料成純文字
    const contextText = results.map((doc) => doc.pageContent).join("\n\n");
    console.log(`✅ [RAG] 成功檢索到 ${results.length} 筆資料`);
    
    return contextText;

  } catch (error) {
    console.error("❌ [RAG] 檢索失敗:", error);
    // 如果資料庫掛了，回傳空字串讓 AI 憑運氣回答，不要讓程式崩潰
    return "";
  }
}