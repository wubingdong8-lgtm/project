export const MESSAGE_STORE = "ai_assistant_message";
export const SESSION_STORE = 'ai_assistant_session';
export const ASSISTANT_STORE ='ai_assistant';

export const MAX_TOKEN = 1000
export const TEAMPERATURE = 0.8

export const ASSISTANT_INIT = [
  {
    name: "AI 助手",
    prompt: "你是一個智慧的 AI 助手, 任務是詳細的回答用戶的每個問題",
    temperature: 0.7,
    max_log: 4,
    max_tokens: 800,
  },
];