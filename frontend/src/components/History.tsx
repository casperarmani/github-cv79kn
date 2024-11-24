import { ChatHistory, VideoHistory } from '../types';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface HistoryProps {
  chatHistory: ChatHistory[];
  videoHistory: VideoHistory[];
}

function History({ chatHistory, videoHistory }: HistoryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {chatHistory.length > 0 ? (
              chatHistory.map((msg, index) => (
                <div key={index} className={`mb-4 p-3 rounded-lg ${
                  msg.chat_type === 'bot' ? 'bg-secondary/50' : 'bg-primary/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {msg.chat_type === 'bot' ? 'Chatbot' : 'You'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(msg.TIMESTAMP).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center p-4">
                No chat history available
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {videoHistory.length > 0 ? (
              videoHistory.map((analysis, index) => (
                <div key={index} className="mb-4">
                  <div className="text-xs text-muted-foreground">
                    {new Date(analysis.TIMESTAMP).toLocaleString()}
                  </div>
                  <div className="font-medium">
                    File: {analysis.upload_file_name}
                  </div>
                  <div className="text-sm">{analysis.analysis}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No video analysis history available
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default History;
