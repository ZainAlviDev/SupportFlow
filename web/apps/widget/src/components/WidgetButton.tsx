type WidgetButtonProps = {
  onClick: () => void;
  color: string;
  position: "bottom-right" | "bottom-left" | string;
  disabled?: boolean;
};

export function WidgetButton({ onClick, color, position, disabled }: WidgetButtonProps) {
  const isLeft = position === "bottom-left";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "fixed",
        bottom: 24,
        [isLeft ? "left" : "right"]: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: color,
        color: "white",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        fontSize: 22,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        zIndex: 2147483000,
        opacity: disabled ? 0.7 : 1,
      }}
      aria-label="Open chat"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-3.8 3.2c-.5.4-1.2.1-1.2-.5V6.5Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
