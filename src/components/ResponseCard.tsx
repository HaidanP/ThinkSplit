import React, { useState } from 'react';
import { Clock, Hash, Plus, MessageSquare, Copy, Check } from 'lucide-react';
import { marked } from 'marked';
import { LLMResponse, Annotation } from '../types';
import { AVAILABLE_MODELS } from '../services/openrouter';

interface ResponseCardProps {
  response: LLMResponse;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  showAnnotations: boolean;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({
  response,
  annotations,
  onAddAnnotation,
  showAnnotations
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [annotationNote, setAnnotationNote] = useState('');
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const model = AVAILABLE_MODELS.find(m => m.id === response.modelId);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      setShowAnnotationForm(true);
    }
  };

  const handleAddAnnotation = () => {
    if (selectedText && annotationNote.trim()) {
      onAddAnnotation({
        modelId: response.modelId,
        text: selectedText,
        position: response.content.indexOf(selectedText),
        note: annotationNote.trim()
      });
      
      setSelectedText('');
      setAnnotationNote('');
      setShowAnnotationForm(false);
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatLatency = (latency?: number) => {
    if (!latency) return 'N/A';
    return latency < 1000 ? `${latency}ms` : `${(latency / 1000).toFixed(1)}s`;
  };

  const renderMarkdown = (text: string) => {
    // Configure marked options for clean rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    
    return marked(text);
  };

  const highlightAnnotations = (html: string) => {
    if (!showAnnotations || annotations.length === 0) {
      return html;
    }

    let highlightedHtml = html;
    annotations.forEach((annotation, index) => {
      const highlightClass = `annotation-highlight-${index}`;
      highlightedHtml = highlightedHtml.replace(
        annotation.text,
        `<span class="bg-yellow-200 px-1 rounded cursor-help ${highlightClass}" title="${annotation.note}">${annotation.text}</span>`
      );
    });

    return highlightedHtml;
  };

  return (
    <div className="card h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${model?.color || 'bg-gray-500'}`} />
          <div>
            <h4 className="font-semibold text-slate-900">{model?.name || response.modelId}</h4>
            <p className="text-sm text-slate-600">{model?.provider}</p>
          </div>
        </div>
        
        <button
          onClick={handleCopyResponse}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Copy response"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 mb-4 text-sm text-slate-600 flex-shrink-0">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{formatLatency(response.latency)}</span>
        </div>
        {response.tokens && (
          <div className="flex items-center space-x-1">
            <Hash className="w-4 h-4" />
            <span>{response.tokens} tokens</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-4 h-4" />
          <span>{response.content.length} chars</span>
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          className="flex-1 bg-slate-50 rounded-lg p-4 cursor-text overflow-y-auto prose prose-sm max-w-none"
          onMouseUp={handleTextSelection}
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          <div dangerouslySetInnerHTML={{ 
            __html: showAnnotations 
              ? highlightAnnotations(renderMarkdown(response.content))
              : renderMarkdown(response.content)
          }} />
        </div>
      </div>

      {/* Annotation Form */}
      {showAnnotationForm && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
          <div className="flex items-start space-x-2 mb-3">
            <Plus className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-2">Add Annotation</p>
              <p className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded mb-2">
                "{selectedText}"
              </p>
              <textarea
                value={annotationNote}
                onChange={(e) => setAnnotationNote(e.target.value)}
                placeholder="Add your note about this text..."
                className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAnnotationForm(false);
                setSelectedText('');
                setAnnotationNote('');
              }}
              className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAnnotation}
              disabled={!annotationNote.trim()}
              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>
      )}

      {/* Existing Annotations */}
      {showAnnotations && annotations.length > 0 && (
        <div className="mt-4 space-y-2 flex-shrink-0">
          <p className="text-sm font-medium text-slate-900">Annotations ({annotations.length})</p>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="font-medium text-yellow-900 mb-1">"{annotation.text}"</p>
                <p className="text-yellow-700">{annotation.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};