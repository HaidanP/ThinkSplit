import React from 'react';
import { Loader2, Clock } from 'lucide-react';
import { AVAILABLE_MODELS } from '../services/openrouter';

interface LoadingStateProps {
  selectedModels: string[];
}

export const LoadingState: React.FC<LoadingStateProps> = ({ selectedModels }) => {
  const models = AVAILABLE_MODELS.filter(model => selectedModels.includes(model.id));

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
        <h3 className="font-semibold text-slate-900">Generating Responses</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model, index) => (
            <div
              key={model.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${model.color}`} />
                <span className="font-medium text-slate-900">{model.name}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Processing...</span>
              </div>
              
              <div className="mt-3 bg-white rounded-md p-3">
                <div className="animate-pulse space-y-2">
                  <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 pt-4 border-t border-slate-200">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            Requests are staggered to avoid rate limiting. This may take a few moments...
          </span>
        </div>
      </div>
    </div>
  );
};