import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useNotebookLM } from '~/Providers/NotebookLMContext';
import { useLocalize } from '~/hooks';
import type { TMessage } from 'librechat-data-provider';

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function MessageBubble({ message }: { message: TMessage }) {
  const isUser = message.isCreatedByUser;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-green-600 text-white'
            : 'bg-surface-secondary text-text-primary'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        {message.metadata?.citations && (
          <div className="mt-2 pt-2 border-t border-opacity-20 border-white">
            <p className="text-xs opacity-75">
              Sources: {(message.metadata.citations as string[]).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotebookLMChat({ notebookId }: { notebookId: string | null }) {
  const localize = useLocalize();
  const { chatHistory, addChatMessage } = useNotebookLM();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || !notebookId || isLoading) {
      return;
    }

    const userMessage: TMessage = {
      messageId: generateId(),
      text: input,
      isCreatedByUser: true,
      conversationId: notebookId,
      createdAt: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Call NotebookLM chat MCP tool
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantMessage: TMessage = {
        messageId: generateId(),
        text: `This is a simulated response to: "${input}"\n\nThe NotebookLM MCP integration will be connected once the server URL is configured in librechat.yaml.`,
        isCreatedByUser: false,
        conversationId: notebookId,
        createdAt: new Date().toISOString(),
        metadata: {
          citations: ['Source 1', 'Source 2'],
        },
      };

      addChatMessage(assistantMessage);

      // Uncomment when MCP tool is available:
      // const response = await fetch('/api/mcp/call-tool', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     serverName: 'NotebookLM',
      //     toolName: 'chat',
      //     arguments: {
      //       notebookId,
      //       message: input,
      //       history: chatHistory.map((m) => ({
      //         role: m.isCreatedByUser ? 'user' : 'assistant',
      //         content: m.text,
      //       })),
      //     },
      //   }),
      // });
      // const result = await response.json();
      // const assistantMessage: TMessage = {
      //   messageId: generateId(),
      //   text: result.response,
      //   isCreatedByUser: false,
      //   conversationId: notebookId,
      //   createdAt: new Date().toISOString(),
      //   metadata: {
      //     citations: result.citations,
      //     sources: result.sources,
      //   },
      // };
      // addChatMessage(assistantMessage);
    } catch (error) {
      console.error('Failed to send message to NotebookLM:', error);
      const errorMessage: TMessage = {
        messageId: generateId(),
        text: 'Failed to send message. Please try again.',
        isCreatedByUser: false,
        conversationId: notebookId,
        createdAt: new Date().toISOString(),
        error: true,
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!notebookId) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        Initializing NotebookLM session...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center text-text-secondary">
            <p>{localize('com_ui_notebooklm_chat_empty')}</p>
            <p className="mt-2 text-sm">Ask questions about your sources</p>
          </div>
        )}
        {chatHistory.map((message) => (
          <MessageBubble key={message.messageId} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-secondary rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce animation-delay-200">●</span>
                <span className="animate-bounce animation-delay-400">●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-light p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask NotebookLM..."
            className="flex-1 resize-none rounded-lg border border-border-medium p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
