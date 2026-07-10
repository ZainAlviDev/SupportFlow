type WidgetButtonProps = {
  onClick: () => void;
};

export function WidgetButton({ onClick }: WidgetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#4f46e5",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontSize: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
      aria-label="Open chat"
    >
      💬
    </button>
  );
}
