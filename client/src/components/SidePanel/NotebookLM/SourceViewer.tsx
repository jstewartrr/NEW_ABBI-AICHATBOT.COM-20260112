import { FileText, MessageSquare } from 'lucide-react';
import type { NotebookLMSource } from '~/Providers/NotebookLMContext';

export default function SourceViewer({ sourceData }: { sourceData: NotebookLMSource | null }) {
  if (!sourceData) {
    return null;
  }

  const { type, content, timestamp } = sourceData;
  const attachmentCount = content.attachments.length;

  return (
    <div className="border-t border-border-light bg-surface-secondary p-3">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        {type === 'message' ? (
          <MessageSquare size={14} />
        ) : (
          <FileText size={14} />
        )}
        <span className="font-medium">
          {type === 'message' ? 'Single Message' : 'Full Conversation'}
        </span>
        {attachmentCount > 0 && (
          <>
            <span>•</span>
            <span>{attachmentCount} attachment{attachmentCount > 1 ? 's' : ''}</span>
          </>
        )}
        <span>•</span>
        <span>{new Date(timestamp).toLocaleTimeString()}</span>
      </div>
      {content.text && (
        <p className="mt-2 truncate text-xs text-text-tertiary">
          {content.text.substring(0, 100)}
          {content.text.length > 100 ? '...' : ''}
        </p>
      )}
    </div>
  );
}
