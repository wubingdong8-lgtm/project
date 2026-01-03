// scripts/ingest.ts

// 1. 引入新版切字工具 (需安裝 @langchain/textsplitters)
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// 2. 引入新版 Pinecone 整合工具 (需安裝 @langchain/pinecone)
// 這行是解決 "ERR_PACKAGE_PATH_NOT_EXPORTED" 的關鍵！
import { PineconeStore } from "@langchain/pinecone";

// 3. 其他必要套件
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const run = async () => {
  try {
    console.log("🚀 開始讀取 docs 資料夾...");

    const docsPath = "docs";
    // 檢查 docs 資料夾是否存在
    if (!fs.existsSync(docsPath)) {
        console.error("❌ 錯誤：找不到 'docs' 資料夾！請在專案根目錄建立它。");
        return;
    }

    const fileNames = fs.readdirSync(docsPath).filter(file => file.endsWith(".txt"));
    
    if (fileNames.length === 0) {
        console.error("❌ 錯誤：docs 資料夾裡面沒有 .txt 檔案！");
        return;
    }

    // 1. 讀取檔案 (使用 Node.js 原生 fs)
    const rawDocs: Document[] = [];
    for (const fileName of fileNames) {
        const filePath = path.join(docsPath, fileName);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        rawDocs.push(new Document({
            pageContent: fileContent,
            metadata: { source: fileName }
        }));
    }
    console.log(`📄 成功讀取 ${rawDocs.length} 份文件`);

    // 2. 切割文字
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(rawDocs);
    console.log(`✂️ 已切割為 ${splitDocs.length} 個片段`);

    // 3. 連線 Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    // 4. 上傳向量資料
    console.log("📡 正在上傳向量資料 (這可能需要幾秒鐘)...");
    
    await PineconeStore.fromDocuments(splitDocs, new OpenAIEmbeddings(), {
      pineconeIndex,
      maxConcurrency: 5,
    });

    console.log("✅ RAG 資料庫更新完成！");
  } catch (error) {
    console.error("❌ 發生錯誤:", error);
  }
};

run();