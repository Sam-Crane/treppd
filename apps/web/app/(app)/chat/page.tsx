import { ChatWindow } from '@/components/chat/chat-window';

export const metadata = {
  title: 'AI Assistant — Treppd',
  description:
    'Ask questions about German immigration in plain English. Answers are grounded in verified sources from BAMF, Make-it-in-Germany, and DAAD.',
};

export default function ChatPage() {
  // The chat window owns the full viewport height inside the (app) layout
  // so the messages list can scroll independently from the page chrome.
  // We override the layout's default padding to give the chat its own canvas.
  return (
    <div className="-mx-4 sm:-mx-6 -my-8">
      <ChatWindow />
    </div>
  );
}
