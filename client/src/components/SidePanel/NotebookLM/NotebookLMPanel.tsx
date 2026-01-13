import { useCallback, useEffect, useState } from 'react';
import { BookText } from 'lucide-react';
import { useNotebookLM } from '~/Providers/NotebookLMContext';
import { useLocalize } from '~/hooks';
import NotebookLMChat from './NotebookLMChat';
import StudioTools from './StudioTools';
import SourceViewer from './SourceViewer';

export default function NotebookLMPanel() {
  const localize = useLocalize();
  const {
    sourceData,
    notebookId,
    setNotebookId,
    activeStudioTool,
    setActiveStudioTool,
  } = useNotebookLM();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize NotebookLM session when source data is set
  useEffect(() => {
    if (sourceData && !isInitialized && !notebookId) {
      initializeNotebook();
    }
  }, [sourceData, isInitialized, notebookId]);

  const initializeNotebook = useCallback(async () => {
    if (!sourceData) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call NotebookLM MCP tool to create notebook with source
      // For now, generate a mock notebook ID
      const mockNotebookId = `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setNotebookId(mockNotebookId);
      setIsInitialized(true);

      // Uncomment when MCP tool is available:
      // const response = await fetch('/api/mcp/call-tool', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     serverName: 'NotebookLM',
      //     toolName: 'create_notebook',
      //     arguments: {
      //       title: `ABBI Chat - ${sourceData.conversationId}`,
      //       sources: [
      //         {
      //           type: 'text',
      //           content: sourceData.content.text,
      //           metadata: sourceData.content.metadata,
      //         },
      //         ...sourceData.content.attachments.map((att) => ({
      //           type: getAttachmentType(att),
      //           content: att.filepath,
      //           metadata: {
      //             filename: att.filename,
      //             messageId: att.messageId,
      //           },
      //         })),
      //       ],
      //     },
      //   }),
      // });
      // const result = await response.json();
      // if (result.notebookId) {
      //   setNotebookId(result.notebookId);
      //   setIsInitialized(true);
      // }
    } catch (error) {
      console.error('Failed to initialize NotebookLM:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sourceData, setNotebookId]);

  if (!sourceData) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <BookText className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
          <p className="text-text-secondary">{localize('com_ui_notebooklm_no_source')}</p>
          <p className="mt-2 text-sm text-text-tertiary">
            Click the NotebookLM button on any message to get started
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <BookText className="mx-auto mb-4 h-12 w-12 animate-pulse text-text-secondary" />
          <p className="text-text-secondary">Initializing NotebookLM session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="border-b border-border-light p-3">
        <h3 className="font-semibold">{localize('com_ui_notebooklm_panel')}</h3>
        {notebookId && (
          <p className="text-xs text-text-secondary">Notebook ID: {notebookId.slice(0, 16)}...</p>
        )}
      </div>

      {/* Studio Tools Tabs */}
      <StudioTools
        activeStudioTool={activeStudioTool}
        setActiveStudioTool={setActiveStudioTool}
        notebookId={notebookId}
        isLoading={isLoading}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeStudioTool === 'chat' && <NotebookLMChat notebookId={notebookId} />}
        {activeStudioTool !== 'chat' && (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-text-secondary">
              Studio tool: <strong>{activeStudioTool}</strong>
              <br />
              <span className="text-sm">(Implementation in progress)</span>
            </p>
          </div>
        )}
      </div>

      {/* Source Info Footer */}
      <SourceViewer sourceData={sourceData} />
    </div>
  );
}
