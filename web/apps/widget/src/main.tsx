import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { WidgetButton } from "./components/WidgetButton";
import { ChatWindow } from "./components/ChatWindow";

function WidgetApp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <WidgetButton onClick={() => setOpen(true)} />
      <ChatWindow open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <WidgetApp />
    </StrictMode>
  );
}
