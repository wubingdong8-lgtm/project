// 檔案位置：src/utils/rag.ts
import knowledgeBase from '../data/school_knowledge.json';

interface KnowledgeItem {
  keywords: string[];
  content: string;
}

export function retrieveContext(userQuery: string): string {
  const query = userQuery.toLowerCase();
  
  // 簡單的關鍵字搜尋
  const relevantDocs = knowledgeBase.filter((item: KnowledgeItem) => {
    return item.keywords.some(keyword => query.includes(keyword.toLowerCase()));
  });

  if (relevantDocs.length === 0) return "";

  // 為了節省 Token，我們只取前 2 筆最相關的
  return relevantDocs
    .slice(0, 2)
    .map(item => `【校園資訊】：${item.content}`)
    .join("\n");
}