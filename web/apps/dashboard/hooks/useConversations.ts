/** Placeholder — wire to TanStack Query in Module 3 */

export function useConversations() {
  return {
    conversations: [] as { id: string; subject: string; status: string }[],
    isLoading: false,
  };
}
