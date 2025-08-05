import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Upload, File, Image, FileText, Video, Music, MessageSquarePlus } from 'lucide-react';
import { PromptRequest, Attachment } from '../types';

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface PromptInputProps {
  onSubmit: (request: PromptRequest) => void;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, onAttachmentsChange, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    onSubmit({
      prompt: prompt.trim(),
      apiKey: '', // Will be filled by parent component
      models: [], // Will be filled by parent component
      attachments: attachments.length > 0 ? attachments : undefined
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    
    for (const file of Array.from(files)) {
      const fileType = getFileType(file.name);
      let fileUrl: string;
      
      if (fileType === 'image') {
        // Convert images to base64 for API
        fileUrl = await convertFileToBase64(file);
      } else {
        // For non-images, create blob URL for display but we'll handle differently in API
        fileUrl = URL.createObjectURL(file);
      }
      
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: fileType,
        url: fileUrl,
        size: file.size,
        file: file // Store the original file for API calls
      };
      newAttachments.push(attachment);
    }

    setAttachments(prev => {
      const updated = [...prev, ...newAttachments];
      onAttachmentsChange?.(updated);
      return updated;
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    // Revoke object URL to free memory
    const attachment = attachments.find(att => att.id === id);
    if (attachment && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      onAttachmentsChange?.(updated);
      return updated;
    });
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'tiff', 'tif'].includes(extension || '')) return 'image';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) return 'document';
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension || '')) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) return 'archive';
    if (['json', 'xml', 'csv', 'xlsx', 'xls'].includes(extension || '')) return 'data';
    return 'file';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4 text-blue-500" />;
      case 'pdf': 
      case 'document': return <FileText className="w-4 h-4 text-red-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      case 'audio': return <Music className="w-4 h-4 text-green-500" />;
      default: return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
          <MessageSquarePlus className="w-5 h-5 text-primary-700" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Enter Your Prompt</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here... Ask anything you'd like to compare across different LLMs."
            className="textarea-field min-h-[140px] pr-16"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
            {prompt.length} chars
          </div>
        </div>

        {/* Attachments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 shadow-sm hover:shadow-md border border-slate-200/60 hover:border-slate-300/60"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              <span>Browse Files</span>
            </button>

            {attachments.length > 0 && (
              <span className="text-sm text-slate-600">
                {attachments.length} file{attachments.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900 mb-2">Selected Files:</p>
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(attachment.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{attachment.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <span className="capitalize">{attachment.type}</span>
                        {attachment.size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(attachment.size)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-2"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              


            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Generating...' : 'Compare Responses'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};