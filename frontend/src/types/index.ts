export interface Message {
  type: 'user' | 'bot' | 'error';
  content: string;
  timestamp?: string;
  sessionId?: string;
}

export interface ChatHistory {
  TIMESTAMP: string;
  chat_type: 'user' | 'bot';
  message: string;
  id?: string;
}

export interface VideoHistory {
  TIMESTAMP: string;
  upload_file_name: string;
  analysis: string;
  id?: string;
  video_duration?: string;
  video_format?: string;
}

export interface ApiResponse<T> {
  history: T[];
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
  session_id?: string;
}