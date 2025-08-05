import React from 'react';
import { Bot, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '../services/openrouter';
import { clsx } from 'clsx';

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModels,
  onSelectionChange
}) => {
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(AVAILABLE_MODELS.map(model => model.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-slate-900">Select Models</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            Select All
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={clearAll}
            className="text-sm text-slate-600 hover:text-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AVAILABLE_MODELS.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          
          return (
            <button
              key={model.id}
              onClick={() => toggleModel(model.id)}
              className={clsx(
                'group p-5 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden',
                isSelected
                  ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-primary-100 shadow-md hover:shadow-lg'
                  : 'border-slate-200 bg-white/80 backdrop-blur-sm hover:border-primary-200 hover:bg-primary-50/50 shadow-sm hover:shadow-md'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={clsx('w-4 h-4 rounded-full shadow-sm', model.color)} />
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{model.name}</p>
                    <p className="text-sm text-slate-600">{model.provider}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="p-1 bg-primary-600 rounded-full">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex items-center space-x-2">
                <span className={clsx(
                  'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                  isSelected 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600'
                )}>
                  {model.supportsImages ? 'Text + Images' : 'Text Only'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Selected: {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};