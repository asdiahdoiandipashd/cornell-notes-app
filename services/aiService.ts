import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIProviderType =
  | "builtin"
  | "openai"
  | "deepseek"
  | "kimi"
  | "claude"
  | "gemini"
  | "custom";

export type AIProviderConfig = {
  type: AIProviderType;
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type AIProviderPreset = {
  type: AIProviderType;
  label: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  placeholder: string;
  needsApiKey: boolean;
};

export const AI_PROVIDERS: AIProviderPreset[] = [
  {
    type: "builtin",
    label: "内置 AI",
    description: "免费使用，无需配置",
    defaultBaseUrl: "",
    defaultModel: "",
    placeholder: "",
    needsApiKey: false,
  },
  {
    type: "openai",
    label: "OpenAI",
    description: "GPT-4o / GPT-4o-mini",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholder: "sk-...",
    needsApiKey: true,
  },
  {
    type: "deepseek",
    label: "DeepSeek",
    description: "DeepSeek-V3 / DeepSeek-R1",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    placeholder: "sk-...",
    needsApiKey: true,
  },
  {
    type: "kimi",
    label: "Kimi (月之暗面)",
    description: "Moonshot 系列模型",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    placeholder: "sk-...",
    needsApiKey: true,
  },
  {
    type: "claude",
    label: "Claude (Anthropic)",
    description: "Claude Sonnet / Haiku",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    placeholder: "sk-ant-...",
    needsApiKey: true,
  },
  {
    type: "gemini",
    label: "Gemini (Google)",
    description: "Gemini 2.0 Flash / Pro",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    placeholder: "AIza...",
    needsApiKey: true,
  },
  {
    type: "custom",
    label: "自定义 API",
    description: "OpenAI 兼容接口",
    defaultBaseUrl: "",
    defaultModel: "",
    placeholder: "your-api-key",
    needsApiKey: true,
  },
];

const STORAGE_KEY = "@cornell_ai_config_v1";

const SYSTEM_PROMPT = `你是一个专业的学习助手，精通康奈尔笔记法(Cornell Note-Taking System)。
你的任务是根据用户提供的课堂笔记内容，完成以下两项工作：

1. **提取关键问题和关键词**：从笔记中提炼出核心概念、关键术语和思考问题。每个问题或关键词单独一行。问题应该有助于复习和自测。

2. **生成总结**：用简洁的语言概括笔记的核心内容，突出要点和它们之间的联系。总结应当帮助学生在复习时快速回顾本节课的主要内容。

请以JSON格式返回结果：
{
  "cues": "关键词或问题，每行一个",
  "summary": "总结内容"
}

注意：
- 关键词/问题应该是精炼的，每个3-15字为宜
- 总结应该是完整连贯的段落，100-200字为宜
- 保持学术性和准确性
- 使用与笔记相同的语言（中文或英文）`;

export function getDefaultConfig(): AIProviderConfig {
  return {
    type: "builtin",
    apiKey: "",
    baseUrl: "",
    modelName: "",
  };
}

export async function loadAIConfig(): Promise<AIProviderConfig> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return getDefaultConfig();
}

export async function saveAIConfig(config: AIProviderConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getPresetForType(type: AIProviderType): AIProviderPreset {
  return AI_PROVIDERS.find((p) => p.type === type) ?? AI_PROVIDERS[0];
}

type AnalyzeResult = { cues: string; summary: string };

async function callBuiltinAPI(
  notes: string,
  title?: string
): Promise<AnalyzeResult> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error("内置 AI 服务不可用");
  const res = await fetch(`https://${domain}/api/ai/analyze-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, title }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `请求失败 (${res.status})`);
  }
  return res.json();
}

async function callOpenAICompatible(
  config: AIProviderConfig,
  notes: string,
  title?: string
): Promise<AnalyzeResult> {
  const userMessage = title
    ? `笔记标题：${title}\n\n笔记内容：\n${notes}`
    : `笔记内容：\n${notes}`;

  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const body: Record<string, unknown> = {
    model: config.modelName,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  };

  if (config.type === "openai" && config.modelName.startsWith("gpt-5")) {
    body.max_completion_tokens = 8192;
  } else {
    body.max_tokens = 8192;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg =
      (errBody as Record<string, Record<string, string>>)?.error?.message ||
      `API 请求失败 (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 未返回有效内容");

  const parsed = JSON.parse(content);
  if (!parsed.cues || !parsed.summary) throw new Error("AI 返回内容不完整");
  return { cues: parsed.cues, summary: parsed.summary };
}

async function callClaudeAPI(
  config: AIProviderConfig,
  notes: string,
  title?: string
): Promise<AnalyzeResult> {
  const userMessage = title
    ? `笔记标题：${title}\n\n笔记内容：\n${notes}`
    : `笔记内容：\n${notes}`;

  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.modelName,
      max_tokens: 8192,
      system: SYSTEM_PROMPT + "\n\n请务必只返回JSON，不要包含任何其他文字。",
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg =
      (errBody as Record<string, Record<string, string>>)?.error?.message ||
      `API 请求失败 (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const textBlock = data.content?.find(
    (b: Record<string, string>) => b.type === "text"
  );
  if (!textBlock?.text) throw new Error("AI 未返回有效内容");

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 返回格式异常");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.cues || !parsed.summary) throw new Error("AI 返回内容不完整");
  return { cues: parsed.cues, summary: parsed.summary };
}

export async function analyzeNotes(
  config: AIProviderConfig,
  notes: string,
  title?: string
): Promise<AnalyzeResult> {
  if (config.type === "builtin") {
    return callBuiltinAPI(notes, title);
  }
  if (config.type === "claude") {
    return callClaudeAPI(config, notes, title);
  }
  return callOpenAICompatible(config, notes, title);
}
