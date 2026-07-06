import {
  ConversationList,
  ConversationThread,
  CustomerSidebar,
} from "@/components/inbox/ConversationList";

export default function InboxPage() {
  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-slate-200 bg-white">
        <ConversationList />
      </div>
      <div className="flex flex-1 flex-col bg-white">
        <ConversationThread />
      </div>
      <div className="w-80 border-l border-slate-200 bg-white">
        <CustomerSidebar />
      </div>
    </div>
  );
}
