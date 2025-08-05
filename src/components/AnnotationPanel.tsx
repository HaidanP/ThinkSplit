import React from 'react';
import { StickyNote, Trash2, Calendar } from 'lucide-react';
import { Annotation, LLMResponse } from '../types';
import { AVAILABLE_MODELS } from '../services/openrouter';

interface AnnotationPanelProps {
  annotations: Annotation[];
  responses: LLMResponse[];
  onRemoveAnnotation: (id: string) => void;
}

export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  annotations,
  responses,
  onRemoveAnnotation
}) => {
  const getModelById = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const groupedAnnotations = annotations.reduce((groups, annotation) => {
    const modelId = annotation.modelId;
    if (!groups[modelId]) {
      groups[modelId] = [];
    }
    groups[modelId].push(annotation);
    return groups;
  }, {} as Record<string, Annotation[]>);

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <StickyNote className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-slate-900">All Annotations</h3>
        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
          {annotations.length}
        </span>
      </div>

      {annotations.length === 0 ? (
        <div className="text-center py-8">
          <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No annotations yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Select text in any response to add annotations
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAnnotations).map(([modelId, modelAnnotations]) => {
            const model = getModelById(modelId);
            return (
              <div key={modelId} className="space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                  <div className={`w-3 h-3 rounded-full ${model?.color || 'bg-gray-500'}`} />
                  <h4 className="font-medium text-slate-900">{model?.name || modelId}</h4>
                  <span className="text-sm text-slate-500">
                    ({modelAnnotations.length} annotation{modelAnnotations.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="space-y-3">
                  {modelAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900 mb-2">
                            "{annotation.text}"
                          </p>
                          <p className="text-yellow-700 mb-3">{annotation.note}</p>
                          <div className="flex items-center space-x-2 text-xs text-yellow-600">
                            <Calendar className="w-3 h-3" />
                            <span>{formatTimestamp(annotation.timestamp)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveAnnotation(annotation.id)}
                          className="p-1 text-yellow-600 hover:text-red-600 transition-colors"
                          title="Remove annotation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};