import React, { useState, useEffect } from 'react';
import { Brain, Settings, Sparkles } from 'lucide-react';
import { PromptInput } from './components/PromptInput';
import { ModelSelector } from './components/ModelSelector';
import { ResponseComparison } from './components/ResponseComparison';
import { ApiKeyInput } from './components/ApiKeyInput';
import { LoadingState } from './components/LoadingState';
import { OpenRouterService, AVAILABLE_MODELS } from './services/openrouter';
import { LLMResponse, PromptRequest, Attachment } from './types';
import { securityManager } from './utils/security';

const openRouterService = new OpenRouterService();

function App() {
  const [apiKey, setApiKey] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['claude-opus-4.1', 'grok-4', 'gemini-2.5-pro', 'codestral-2508']);
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);

  // Auto-filter models based on attachments
  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setCurrentAttachments(attachments);
    
    if (attachments.length > 0) {
      // Check attachment types
      const hasNonImageAttachments = attachments.some(att => att.type !== 'image');
      const hasAnyAttachments = attachments.length > 0;
      
      let compatibleModels = selectedModels.filter(modelId => {
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        if (!model) return false;
        
        // Mistral doesn't support ANY attachments
        if (model.id === 'codestral-2508' && hasAnyAttachments) {
          return false;
        }
        
        // For non-image attachments, only keep models that support them
        if (hasNonImageAttachments) {
          return model.supportsNonImageAttachments;
        }
        
        // For image-only attachments, keep models that support images
        return model.supportsImages;
      });
      
      // If we filtered out some models, update the selection and show a message
      if (compatibleModels.length < selectedModels.length) {
        setSelectedModels(compatibleModels);
        const removedModels = selectedModels.filter(id => !compatibleModels.includes(id));
        const removedNames = removedModels.map(id => 
          AVAILABLE_MODELS.find(m => m.id === id)?.name || id
        ).join(', ');
        
        let reason = '';
        if (removedModels.includes('codestral-2508') && hasAnyAttachments) {
          reason = 'they don\'t support attachments';
        } else if (hasNonImageAttachments) {
          reason = 'they don\'t support non-image attachments';
        } else {
          reason = 'they don\'t support image attachments';
        }
        
        setError(`Note: ${removedNames} ${removedModels.length === 1 ? 'was' : 'were'} automatically deselected because ${reason}.`);
        
        // Clear the error after 5 seconds
        setTimeout(() => setError(''), 5000);
      }
    } else {
      // If no attachments, clear any previous error
      setError('');
    }
  };

  const handleSubmitPrompt = async (request: PromptRequest) => {
    if (!apiKey.trim()) {
      setError('Please enter your OpenRouter API key');
      return;
    }

    // Enhanced API key validation
    const validation = securityManager.validateApiKey(apiKey);
    if (!validation.isValid) {
      setError(`Invalid API key: ${validation.errors.join(', ')}`);
      return;
    }

    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponses([]);

    try {
      const requestWithAuth = {
        ...request,
        apiKey,
        models: selectedModels
      };

      const llmResponses = await openRouterService.generateResponses(requestWithAuth);
      setResponses(llmResponses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Brain className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Prompt Sandbox
              </h1>
              <p className="text-slate-600 font-medium">Compare LLM responses side-by-side</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Configuration Section */}
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/60 shadow-sm">
              <Settings className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="transform hover:scale-[1.02] transition-transform duration-200">
              <ApiKeyInput value={apiKey} onChange={setApiKey} />
            </div>
            <div className="transform hover:scale-[1.02] transition-transform duration-200">
              <ModelSelector
                selectedModels={selectedModels}
                onSelectionChange={setSelectedModels}
              />
            </div>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="transform hover:scale-[1.01] transition-all duration-300">
          <PromptInput 
            onSubmit={handleSubmitPrompt} 
            onAttachmentsChange={handleAttachmentsChange}
            isLoading={isLoading} 
          />
        </div>

        {/* Error/Info Display */}
        {error && (
          <div className={`animate-slide-up p-4 rounded-xl shadow-sm backdrop-blur-sm ${
            error.startsWith('Note:') 
              ? 'bg-blue-50/80 border border-blue-200/60' 
              : 'bg-red-50/80 border border-red-200/60'
          }`}>
            <p className={`font-medium ${
              error.startsWith('Note:') 
                ? 'text-blue-800' 
                : 'text-red-800'
            }`}>
              {error.startsWith('Note:') ? error : `Error: ${error}`}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-8">
            <LoadingState selectedModels={selectedModels} />
          </div>
        )}

        {/* Response Comparison */}
        {responses.length > 0 && (
          <div className="animate-fade-in">
            <ResponseComparison responses={responses} />
          </div>
        )}


      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200/60 bg-gradient-to-br from-white/80 via-slate-50/80 to-blue-50/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-3">
              Model Capabilities & Pricing
            </h3>
            <p className="text-slate-600">Compare features and costs across all available models</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="text-left p-6 font-bold text-slate-900">Model</th>
                  <th className="text-left p-6 font-bold text-slate-900">Provider</th>
                  <th className="text-center p-6 font-bold text-slate-900">Images</th>
                  <th className="text-center p-6 font-bold text-slate-900">Non-Images</th>
                  <th className="text-left p-6 font-bold text-slate-900">Best For</th>
                  <th className="text-right p-6 font-bold text-slate-900">Input Cost</th>
                  <th className="text-right p-6 font-bold text-slate-900">Output Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="font-medium text-slate-900">Claude 4.1 Opus</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">Anthropic</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Yes
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Yes
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">Complex reasoning, analysis, coding</td>
                  <td className="p-4 text-right text-slate-600">$15/1M tokens</td>
                  <td className="p-4 text-right text-slate-600">$75/1M tokens</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="font-medium text-slate-900">Grok 4</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">xAI</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Yes
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      ✗ No
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">Real-time info, creative tasks</td>
                  <td className="p-4 text-right text-slate-600">$5/1M tokens</td>
                  <td className="p-4 text-right text-slate-600">$15/1M tokens</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-slate-900">Gemini 2.5 Pro</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">Google</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Yes
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Yes
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">Multimodal tasks, large context</td>
                  <td className="p-4 text-right text-slate-600">$1.25/1M tokens</td>
                  <td className="p-4 text-right text-slate-600">$5/1M tokens</td>
                </tr>
                <tr>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-slate-900">Codestral</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">Mistral</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      ✗ No
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      ✗ No
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">Code generation, text only</td>
                  <td className="p-4 text-right text-slate-600">$1/1M tokens</td>
                  <td className="p-4 text-right text-slate-600">$3/1M tokens</td>
                </tr>
              </tbody>
            </table>
          </div>
          

        </div>
      </footer>

    </div>
  );
}

export default App;