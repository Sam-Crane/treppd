import { Sparkles } from 'lucide-react';

import { ChatWindow } from '@/components/chat/chat-window';
import { Badge, PageHeader } from '@/components/ui';

export const metadata = {
  title: 'AI Assistant — Treppd',
  description:
    'Ask questions about German immigration in plain English. Answers are grounded in verified sources from BAMF, Make-it-in-Germany, DAAD, and 11 city Ausländerbehörden.',
};

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Sparkles className="h-6 w-6" />}
        title="AI assistant — full view"
        description="Same assistant that opens from the Assistant button in the header, just in a dedicated page. Useful for long sessions where you want the full viewport."
        actions={<Badge variant="info">Verified sources only</Badge>}
      />

      {/* Cancel the default page padding so the chat can fill the remaining
          viewport. pb-24 compensates for the mobile bottom nav. */}
      <div className="-mx-4 -mb-24 overflow-hidden rounded-2xl border border-border-default bg-surface shadow-sm sm:-mx-6 md:-mb-10">
        <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
          <ChatWindow embedded />
        </div>
      </div>
    </div>
  );
}
