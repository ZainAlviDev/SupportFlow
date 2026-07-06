import { create } from "zustand";

type InboxState = {
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
};

export const useInboxStore = create<InboxState>((set) => ({
  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
}));
