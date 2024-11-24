import React from 'react';
import { Send, Search, Loader2 } from 'lucide-react';

interface ChatInputProps {
  message: string;
  isLoading: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  message,
  isLoading,
  onMessageChange,
  onSubmit
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-6 border-t border-white/10">
      <div className="flex items-center bg-white/5 backdrop-blur-lg rounded-2xl px-4 py-3">
        <Search className="text-white/40 w-5 h-5" />
        <input
          type="text"
          value={message}
          onChange={onMessageChange}
          placeholder="I want to train my brain on..."
          className="bg-transparent text-white placeholder-white/40 flex-grow outline-none mx-3 text-sm"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="text-white/40 hover:text-white/80 transition-colors p-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
}