type ChatWindowProps = {
  open: boolean;
  onClose: () => void;
};

export function ChatWindow({ open, onClose }: ChatWindowProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        right: 24,
        width: 360,
        height: 480,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px",
          background: "#4f46e5",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600 }}>SupportFlow</span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
      <div style={{ flex: 1, padding: 16, color: "#64748b", fontSize: 14 }}>
        Chat widget scaffold — Module 4
      </div>
    </div>
  );
}
