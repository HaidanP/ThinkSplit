import React, { useState } from 'react';
import { MessageSquare, Clock, Hash, AlertCircle, Plus, StickyNote } from 'lucide-react';
import { LLMResponse, Annotation } from '../types';
import { AVAILABLE_MODELS } from '../services/openrouter';
import { ResponseCard } from './ResponseCard';
import { AnnotationPanel } from './AnnotationPanel';

interface ResponseComparisonProps {
  responses: LLMResponse[];
}

export const ResponseComparison: React.FC<ResponseComparisonProps> = ({ responses }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(false);

  const successfulResponses = responses.filter(r => !r.error);
  const errorResponses = responses.filter(r => r.error);

  const addAnnotation = (annotation: Omit<Annotation, 'id' | 'timestamp'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const getModelById = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
  };

  const formatLatency = (latency?: number) => {
    if (!latency) return 'N/A';
    return latency < 1000 ? `${latency}ms` : `${(latency / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-slate-900">Response Comparison</h3>
          </div>
          
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <StickyNote className="w-4 h-4" />
            <span>{showAnnotations ? 'Hide' : 'Show'} Annotations</span>
            {annotations.length > 0 && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                {annotations.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{responses.length}</p>
            <p className="text-sm text-slate-600">Total Requests</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{successfulResponses.length}</p>
            <p className="text-sm text-slate-600">Successful</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{errorResponses.length}</p>
            <p className="text-sm text-slate-600">Errors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">
              {successfulResponses.length > 0 
                ? formatLatency(successfulResponses.reduce((sum, r) => sum + (r.latency || 0), 0) / successfulResponses.length)
                : 'N/A'
              }
            </p>
            <p className="text-sm text-slate-600">Avg Latency</p>
          </div>
        </div>
      </div>

      {/* Error Responses */}
      {errorResponses.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-900">Errors</h4>
          </div>
          <div className="space-y-3">
            {errorResponses.map((response) => {
              const model = getModelById(response.modelId);
              return (
                <div key={response.modelId} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${model?.color || 'bg-gray-500'}`} />
                    <span className="font-medium text-slate-900">{model?.name || response.modelId}</span>
                  </div>
                  <p className="text-sm text-red-700">{response.error}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Response Grid */}
      {successfulResponses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {successfulResponses.map((response) => (
            <ResponseCard
              key={response.modelId}
              response={response}
              annotations={annotations.filter(a => a.modelId === response.modelId)}
              onAddAnnotation={addAnnotation}
              showAnnotations={showAnnotations}
            />
          ))}
        </div>
      )}

      {/* Annotation Panel */}
      {showAnnotations && annotations.length > 0 && (
        <AnnotationPanel
          annotations={annotations}
          responses={successfulResponses}
          onRemoveAnnotation={removeAnnotation}
        />
      )}
    </div>
  );
};