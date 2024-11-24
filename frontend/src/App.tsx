import React from 'react';
import ChatContainer from './components/ChatContainer';
import History from './components/History';
import { Sidebar } from './components/Sidebar';
import { ChatHistory, VideoHistory, ApiResponse, Chat, Message } from './types';

interface SessionCache {
  [sessionId: string]: ChatHistory[];
}

function App() {
  const [chatHistory, setChatHistory] = React.useState<ChatHistory[]>([]);
  const [videoHistory, setVideoHistory] = React.useState<VideoHistory[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null);
  const [sessionCache, setSessionCache] = React.useState<SessionCache>({});

  const fetchHistories = async (sessionId?: string) => {
    try {
      setError(null);
      
      // If sessionId provided and cached, use cache
      if (sessionId && sessionCache[sessionId]) {
        console.log('Using cached messages for session:', sessionId);
        setChatHistory(sessionCache[sessionId]);
        return;
      }

      // If no sessionId and we have a complete cache, use it
      if (!sessionId && Object.keys(sessionCache).length > 0) {
        console.log('Using complete cache');
        const allMessages = Object.values(sessionCache).flat();
        setChatHistory(allMessages);
        return;
      }

      // Only fetch messages for specific session if provided
      const url = sessionId ? `/chat_history?session_id=${sessionId}` : '/chat_history';
      const chatResponse = await fetch(url);
      
      if (!chatResponse.ok) {
        throw new Error(`Failed to fetch chat history: ${chatResponse.status}`);
      }

      // Process chat history response
      const chatData = await chatResponse.json();
      const chatHistory = Array.isArray(chatData) ? chatData : [];
      
      // Group messages by session_id
      const groupedBySession = chatHistory.reduce((acc: { [key: string]: ChatHistory[] }, msg) => {
        const sessionId = msg.session_id || 'default';
        if (!acc[sessionId]) {
          acc[sessionId] = [];
        }
        acc[sessionId].push(msg);
        return acc;
      }, {});

      // Update cache with all sessions
      setSessionCache(prev => ({
        ...prev,
        ...groupedBySession
      }));

      // Convert to Chat objects
      const convertedChats = Object.entries(groupedBySession).map(([sessionId, messages]) => {
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.TIMESTAMP).getTime() - new Date(b.TIMESTAMP).getTime()
        );
        
        return {
          id: sessionId,
          title: sortedMessages[0]?.message?.slice(0, 30) || 'Untitled Chat',
          messages: sortedMessages.map(msg => ({
            type: msg.chat_type === 'text' ? 'user' : msg.chat_type as 'user' | 'bot' | 'error',
            content: msg.message || ''
          })),
          timestamp: sortedMessages[0]?.TIMESTAMP,
          session_id: sessionId
        };
      });

      console.log('Converted Chats:', convertedChats);

      // Update states
      setChatHistory(chatHistory);
      setChats(convertedChats);
      
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Failed to load chat history');
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      timestamp: new Date().toISOString()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      setError(null);
      const chat = chats.find(c => c.id === chatId);
      
      if (chat?.session_id) {
        // Check if we have cached messages for this session
        const cachedMessages = sessionCache[chat.session_id];
        
        // Set current chat ID immediately for UI update
        setCurrentChatId(chatId);
        
        if (cachedMessages) {
          // Use cached messages if available
          setChatHistory(cachedMessages);
        } else {
          // Fetch new messages if not in cache
          const response = await fetch(`/chat_history?session_id=${chat.session_id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch chat history');
          }
          
          const messages = await response.json();
          if (Array.isArray(messages)) {
            // Update cache with new messages
            setSessionCache(prev => ({
              ...prev,
              [chat.session_id]: messages
            }));
            setChatHistory(messages);
          }
        }
      } else {
        setCurrentChatId(chatId);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error switching chats:', error);
      setError('Failed to load chat messages. Please try again.');
    }
  };

  const handleMessageSent = (messages: Message[], chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: messages.map(msg => ({
                ...msg,
                type: msg.type === 'text' ? 'user' : msg.type // Ensure consistent type conversion
              })),
              title: messages[0]?.content.slice(0, 30) || chat.title 
            }
          : chat
      )
    );
    fetchHistories(chat?.session_id);
  };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;

  React.useEffect(() => {
    fetchHistories();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-300">
      <Sidebar 
        className="border-r" 
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://cdn.discordapp.com/attachments/1109371168147914752/1307892127791054878/clear_tree.png?ex=673fe976&is=673e97f6&hm=11dc4f696c3649b07b95b10eadd1d0747d19b7021704a32189492ccab073baa7&')] bg-cover bg-center">
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-8">
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-8">
                <ChatContainer 
                  key={currentChatId || 'new'} 
                  chatId={currentChatId}
                  initialMessages={currentChat?.messages || []}
                  onMessageSent={handleMessageSent}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;