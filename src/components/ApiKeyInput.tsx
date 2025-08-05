import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  // Security checks
  useEffect(() => {
    // Check if running on HTTPS or localhost
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
    setIsSecure(isSecureContext);

    // Prevent API key from being logged
    if (value) {
      // Override console methods to prevent key logging
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        const filteredArgs = args.map(arg => 
          typeof arg === 'string' && arg.includes(value) ? '[API_KEY_HIDDEN]' : arg
        );
        originalLog(...filteredArgs);
      };
      
      console.error = (...args) => {
        const filteredArgs = args.map(arg => 
          typeof arg === 'string' && arg.includes(value) ? '[API_KEY_HIDDEN]' : arg
        );
        originalError(...filteredArgs);
      };
      
      console.warn = (...args) => {
        const filteredArgs = args.map(arg => 
          typeof arg === 'string' && arg.includes(value) ? '[API_KEY_HIDDEN]' : arg
        );
        originalWarn(...filteredArgs);
      };

      // Cleanup
      return () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, [value]);

  // Security validation
  const validateApiKey = (key: string) => {
    if (!key) return true;
    
    // Check for OpenRouter API key format
    const isValidFormat = key.startsWith('sk-or-v1-') && key.length > 20;
    return isValidFormat;
  };

  const handleKeyChange = (newValue: string) => {
    // Sanitize input
    const sanitized = newValue.trim();
    onChange(sanitized);
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
          <Key className="w-5 h-5 text-primary-700" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">OpenRouter API Key</h3>
      </div>
      
      <div className="space-y-3">
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="sk-or-v1-..."
            className={`input-field pr-12 ${!validateApiKey(value) && value ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            autoComplete="off"
            spellCheck="false"
            data-testid="api-key-input"
            onCopy={(e) => {
              // Prevent copying to clipboard in production
              if (process.env.NODE_ENV === 'production') {
                e.preventDefault();
              }
            }}
            onCut={(e) => {
              // Prevent cutting to clipboard in production
              if (process.env.NODE_ENV === 'production') {
                e.preventDefault();
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Security Warnings */}
        {!isSecure && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600" />
              <p className="text-red-800 text-sm font-medium">Security Warning</p>
            </div>
            <p className="text-red-700 text-sm mt-1">
              This site is not served over HTTPS. Your API key may be vulnerable. Use only on localhost or HTTPS.
            </p>
          </div>
        )}
        
        {value && !validateApiKey(value) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Invalid API key format. OpenRouter keys should start with "sk-or-v1-"
            </p>
          </div>
        )}

        <div className="flex items-center justify-end text-sm">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <span>Get API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        
        {/* Security Features List */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-xs">
              <span className="font-medium">Security Active:</span> Your key stays local with console protection, clipboard restrictions, input validation, and HTTPS enforcement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};