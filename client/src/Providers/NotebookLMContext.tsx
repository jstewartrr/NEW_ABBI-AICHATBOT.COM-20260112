import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { TMessage, TAttachment } from 'librechat-data-provider';

export type NotebookLMSource = {
  type: 'message' | 'conversation';
  messageId?: string;
  conversationId: string;
  content: {
    text: string;
    attachments: TAttachment[];
    metadata: Record<string, unknown>;
  };
  timestamp: Date;
};

export type StudioTool =
  | 'chat'
  | 'audio-overview'
  | 'study-guide'
  | 'faq'
  | 'timeline'
  | 'briefing-doc';

interface NotebookLMContextType {
  // Panel state
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  // Source data (conversation/message sent to NotebookLM)
  sourceData: NotebookLMSource | null;
  setSourceData: (data: NotebookLMSource | null) => void;

  // NotebookLM session
  notebookId: string | null;
  setNotebookId: (id: string | null) => void;

  // Chat messages with NotebookLM
  chatHistory: TMessage[];
  addChatMessage: (message: TMessage) => void;
  clearChat: () => void;

  // Studio tools state
  activeStudioTool: StudioTool | null;
  setActiveStudioTool: (tool: StudioTool | null) => void;
}

const NotebookLMContext = createContext<NotebookLMContextType | undefined>(undefined);

export function NotebookLMProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceData, setSourceData] = useState<NotebookLMSource | null>(null);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<TMessage[]>([]);
  const [activeStudioTool, setActiveStudioTool] = useState<StudioTool | null>('chat');

  const addChatMessage = (message: TMessage) => {
    setChatHistory((prev) => [...prev, message]);
  };

  const clearChat = () => {
    setChatHistory([]);
    setNotebookId(null);
    setSourceData(null);
  };

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      sourceData,
      setSourceData,
      notebookId,
      setNotebookId,
      chatHistory,
      addChatMessage,
      clearChat,
      activeStudioTool,
      setActiveStudioTool,
    }),
    [isOpen, sourceData, notebookId, chatHistory, activeStudioTool],
  );

  return <NotebookLMContext.Provider value={value}>{children}</NotebookLMContext.Provider>;
}

export function useNotebookLM() {
  const context = useContext(NotebookLMContext);
  if (!context) {
    throw new Error('useNotebookLM must be used within NotebookLMProvider');
  }
  return context;
}
