# Prompt Sandbox

A cost-effective side-by-side comparison tool for testing Large Language Model responses to identical prompts. Uses a single OpenRouter API key to access multiple models including exclusive access to Grok 4 and Claude 4.1 Opus. Designed for developers, researchers, students, and companies evaluating models without multiple API subscriptions.

## Features

- **Single API Integration**: Access 4 different models through one OpenRouter API key
- **Cost Efficiency**: No multiple API subscriptions needed - pay per token across all models
- **Exclusive Model Access**: Direct access to Grok 4 (xAI) and Claude 4.1 Opus (Anthropic)
- **File Attachment Testing**: Upload files to test multimodal capabilities
- **Response Annotation**: Add notes to specific parts of model outputs
- **Rate Limiting**: Prevents API quota exhaustion with request delays

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Usage

1. **Enter your OpenRouter API Key** in the configuration section
2. **Select Models** you want to compare (at least one required)
3. **Write your prompt** in the text area
4. **Optional**: Include an image URL for vision-capable models
5. **Click "Compare Responses"** and wait for the results
6. **Analyze and Annotate** the responses by selecting text and adding notes

## Use Cases

- **Model Comparison**: Test how different models handle the same input
- **Prompt Testing**: Find which prompt variations work best across models
- **Cost Analysis**: Compare token usage and response quality per dollar spent
- **Model Selection**: Determine which model fits your specific task requirements
- **Research**: Study response patterns across different model architectures

## Available Models

| Model | Provider | Supports Images | Notes |
|-------|----------|----------------|-------|
| Claude 4.1 Opus | Anthropic | ✅ | Exclusive via OpenRouter |
| Grok 4 | xAI | ✅ | Exclusive via OpenRouter |
| Gemini 2.5 Pro | Google | ✅ | Latest version access |
| Codestral | Mistral | ❌ | Code-focused model |

**Cost Advantage**: Instead of maintaining separate API keys and billing accounts with Anthropic ($20/month), xAI, Google, and Mistral, use one OpenRouter account with pay-per-use pricing across all models.

## Who This Is For

- **Developers** comparing model performance before choosing one for production
- **Researchers** studying LLM behavior without multiple API subscriptions  
- **Students** learning about different models on a budget
- **Companies** evaluating models cost-effectively before committing to enterprise plans

## Technical Details

### Request Handling
- Concurrent API calls with 1-second delays between requests
- Model filtering based on file type compatibility
- Error handling for failed API calls

### Annotation System
- Click and drag text selection
- Local storage for annotations
- Export annotations as JSON

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **API**: OpenRouter (unified LLM access)

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── ApiKeyInput.tsx     # API key configuration
│   ├── ModelSelector.tsx   # Model selection
│   ├── PromptInput.tsx     # Prompt input with image support
│   ├── LoadingState.tsx    # Loading indicators
│   ├── ResponseComparison.tsx  # Main comparison view
│   ├── ResponseCard.tsx    # Individual model response
│   └── AnnotationPanel.tsx # Annotation management
├── services/           # API services
│   └── openrouter.ts      # OpenRouter API integration
├── types.ts           # TypeScript type definitions
├── App.tsx           # Main application component
└── main.tsx         # Application entry point
```

## Security

- Client-side API key storage with encryption
- Input sanitization and validation
- HTTPS enforcement for secure connections
- No server-side data persistence

## Contributing

Contributions welcome for:
- Additional model integrations
- Analysis export formats
- Performance optimizations
- Security enhancements
# ThinkSplit - Update Tue Aug  5 17:20:54 EDT 2025
