import { MessageSquare, Headphones, BookOpen, HelpCircle, Calendar, FileText } from 'lucide-react';
import type { StudioTool } from '~/Providers/NotebookLMContext';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

const studioTools = [
  { id: 'chat', icon: MessageSquare, label: 'com_ui_notebooklm_chat' },
  { id: 'audio-overview', icon: Headphones, label: 'com_ui_notebooklm_audio_overview' },
  { id: 'study-guide', icon: BookOpen, label: 'com_ui_notebooklm_study_guide' },
  { id: 'faq', icon: HelpCircle, label: 'com_ui_notebooklm_faq' },
  { id: 'timeline', icon: Calendar, label: 'com_ui_notebooklm_timeline' },
  { id: 'briefing-doc', icon: FileText, label: 'com_ui_notebooklm_briefing' },
] as const;

export default function StudioTools({
  activeStudioTool,
  setActiveStudioTool,
  notebookId,
  isLoading,
}: {
  activeStudioTool: StudioTool | null;
  setActiveStudioTool: (tool: StudioTool) => void;
  notebookId: string | null;
  isLoading: boolean;
}) {
  const localize = useLocalize();

  return (
    <div className="border-b border-border-light">
      <div className="flex overflow-x-auto">
        {studioTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeStudioTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveStudioTool(tool.id as StudioTool)}
              disabled={!notebookId || isLoading}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                'border-b-2 whitespace-nowrap',
                isActive
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
                (!notebookId || isLoading) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Icon size={16} />
              {localize(tool.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
