import { create } from "zustand";

export type InboxStatusFilter = "all" | "Open" | "Pending" | "Resolved" | "Snoozed";
export type InboxAssigneeFilter = "all" | "me" | "unassigned";

type InboxState = {
  selectedConversationId: string | null;
  statusFilter: InboxStatusFilter;
  assigneeFilter: InboxAssigneeFilter;
  setSelectedConversationId: (id: string | null) => void;
  setStatusFilter: (status: InboxStatusFilter) => void;
  setAssigneeFilter: (assignee: InboxAssigneeFilter) => void;
};

export const useInboxStore = create<InboxState>((set) => ({
  selectedConversationId: null,
  statusFilter: "all",
  assigneeFilter: "all",
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setAssigneeFilter: (assigneeFilter) => set({ assigneeFilter }),
}));
