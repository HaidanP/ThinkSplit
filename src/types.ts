export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  apiModel: string;
  supportsImages: boolean;
  supportsNonImageAttachments: boolean;
  color: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface LLMResponse {
  modelId: string;
  content: string;
  error?: string;
  timestamp: number;
  tokens?: number;
  latency?: number;
}

export interface Annotation {
  id: string;
  modelId: string;
  text: string;
  position: number;
  note: string;
  timestamp: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  file?: File; // Store original file for API calls
}

export interface PromptRequest {
  prompt: string;
  apiKey: string;
  models: string[];
  attachments?: Attachment[];
}