import { LLMModel, Message, LLMResponse, PromptRequest, Attachment } from '../types';

export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'claude-opus-4.1',
    name: 'Claude 4.1 Opus',
    provider: 'Anthropic',
    apiModel: 'anthropic/claude-opus-4.1',
    supportsImages: true,
    supportsNonImageAttachments: true,
    color: 'bg-orange-500'
  },
  {
    id: 'grok-4',
    name: 'Grok 4',
    provider: 'xAI',
    apiModel: 'x-ai/grok-4',
    supportsImages: true,
    supportsNonImageAttachments: false,
    color: 'bg-purple-500'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    apiModel: 'google/gemini-2.5-pro',
    supportsImages: true,
    supportsNonImageAttachments: true,
    color: 'bg-blue-500'
  },
  {
    id: 'codestral-2508',
    name: 'Codestral',
    provider: 'Mistral',
    apiModel: 'mistralai/codestral-2508',
    supportsImages: false,
    supportsNonImageAttachments: false,
    color: 'bg-green-500'
  }
];

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

export class OpenRouterService {
  private sanitizeApiKey(apiKey: string): string {
    // Remove any potential injection attempts
    return apiKey.replace(/[^\w-]/g, '').trim();
  }

  private validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    // Check format and length
    const isValidFormat = apiKey.startsWith('sk-or-v1-') && apiKey.length > 20 && apiKey.length < 200;
    const hasValidChars = /^[a-zA-Z0-9-]+$/.test(apiKey);
    
    return isValidFormat && hasValidChars;
  }

  private async makeRequest(
    model: LLMModel,
    messages: Message[],
    apiKey: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Security validations
    const sanitizedKey = this.sanitizeApiKey(apiKey);
    if (!this.validateApiKey(sanitizedKey)) {
      return {
        modelId: model.id,
        content: '',
        error: 'Invalid API key format',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    }
    
    try {
      // Ensure HTTPS for API calls
      if (!OPENROUTER_BASE_URL.startsWith('https://')) {
        throw new Error('API endpoint must use HTTPS');
      }

      const response = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sanitizedKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Prompt Sandbox',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.apiModel,
          messages: this.sanitizeMessages(messages)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();

      return {
        modelId: model.id,
        content: data.choices?.[0]?.message?.content || 'No response received',
        timestamp: Date.now(),
        tokens: data.usage?.total_tokens,
        latency: endTime - startTime
      };
    } catch (error) {
      return {
        modelId: model.id,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    }
  }

  private sanitizeMessages(messages: Message[]): Message[] {
    return messages.map(message => ({
      ...message,
      content: typeof message.content === 'string' 
        ? this.sanitizeText(message.content)
        : Array.isArray(message.content)
        ? message.content.map(content => ({
            ...content,
            text: content.text ? this.sanitizeText(content.text) : content.text
          }))
        : message.content
    }));
  }

  private sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';
    
    // Remove potentially dangerous content
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  private async createMessages(request: PromptRequest): Promise<Message[]> {
    const messages: Message[] = [];

    // Add system message for context
    messages.push({
      role: 'system',
      content: 'You are a helpful AI assistant. Provide clear, accurate, and thoughtful responses.'
    });

    // Create user message with attachments
    if (request.attachments && request.attachments.length > 0) {
      const content: any[] = [
        {
          type: 'text',
          text: request.prompt
        }
      ];

      // Add attachments
      for (const attachment of request.attachments) {
        if (attachment.type === 'image') {
          // For images, use the base64 data URL
          content.push({
            type: 'image_url',
            image_url: {
              url: attachment.url
            }
          });
        } else if (attachment.file) {
          // For non-image files, handle based on file type
          try {
            let fileContent: string;
            const textBasedTypes = ['document', 'data', 'file'];
            const extension = attachment.name.split('.').pop()?.toLowerCase();
            const plainTextExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'py', 'java', 'cpp', 'c', 'h'];
            
            if (attachment.type === 'pdf') {
              fileContent = `PDF document: ${attachment.name} (${this.formatFileSize(attachment.file.size)})\n\nNote: This is a PDF file. To analyze its content, please copy and paste the text from the PDF, as browser-based PDF text extraction is not available.`;
            } else if (textBasedTypes.includes(attachment.type) || plainTextExtensions.includes(extension || '')) {
              // For text-based files, try to read as text
              fileContent = await this.readFileAsText(attachment.file);
              // Limit content length to avoid overwhelming the API
              if (fileContent.length > 10000) {
                fileContent = fileContent.substring(0, 10000) + '\n\n[Content truncated - file is too large]';
              }
            } else {
              fileContent = `Binary file: ${attachment.name} (${attachment.type}, ${this.formatFileSize(attachment.file.size)})\n\nNote: This appears to be a binary file that cannot be read as text. Please describe what you'd like me to analyze about this file.`;
            }
            content[0].text += `\n\n--- ${attachment.name} ---\n${fileContent}\n--- End of ${attachment.name} ---`;
          } catch (error) {
            content[0].text += `\n\nAttachment: ${attachment.name} (${attachment.type}) - Unable to read file content. Please copy and paste the content manually.`;
          }
        }
      }

      messages.push({
        role: 'user',
        content: content
      });
    } else {
      messages.push({
        role: 'user',
        content: request.prompt
      });
    }

    return messages;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateResponses(request: PromptRequest): Promise<LLMResponse[]> {
    const selectedModels = AVAILABLE_MODELS.filter(model => 
      request.models.includes(model.id)
    );

    if (selectedModels.length === 0) {
      throw new Error('No valid models selected');
    }

    // Filter out models that don't support images if image attachments are included
    const hasImageAttachments = request.attachments?.some(att => att.type === 'image') || false;
    const compatibleModels = hasImageAttachments 
      ? selectedModels.filter(model => model.supportsImages)
      : selectedModels;

    if (compatibleModels.length === 0) {
      throw new Error('No models support the requested features (image processing)');
    }

    const messages = await this.createMessages(request);

    // Create promises with staggered delays to avoid rate limiting
    const promises = compatibleModels.map((model, index) => {
      return new Promise<LLMResponse>((resolve) => {
        setTimeout(async () => {
          const response = await this.makeRequest(model, messages, request.apiKey);
          resolve(response);
        }, index * RATE_LIMIT_DELAY);
      });
    });

    // Wait for all requests to complete
    const responses = await Promise.all(promises);
    return responses;
  }

  getModelById(id: string): LLMModel | undefined {
    return AVAILABLE_MODELS.find(model => model.id === id);
  }

  getAllModels(): LLMModel[] {
    return AVAILABLE_MODELS;
  }
}