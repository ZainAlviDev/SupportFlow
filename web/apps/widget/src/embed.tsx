import { createRoot, type Root } from "react-dom/client";
import { StrictMode } from "react";
import { WidgetApp } from "./components/WidgetApp";
import type { WidgetInitOptions } from "./types";

type SfCommand = "init";

type SfQueueItem = [SfCommand, WidgetInitOptions];

declare global {
  interface Window {
    SupportFlow?: string;
    sf?: ((command: SfCommand, options: WidgetInitOptions) => void) & {
      q?: SfQueueItem[];
    };
  }
}

let root: Root | null = null;
let host: HTMLElement | null = null;

function mount(options: WidgetInitOptions) {
  if (!options?.apiKey) {
    console.error("[SupportFlow Widget] apiKey is required");
    return;
  }

  if (!host) {
    host = document.createElement("div");
    host.id = "supportflow-widget-root";
    document.body.appendChild(host);
  }

  if (!root) {
    root = createRoot(host);
  }

  root.render(
    <StrictMode>
      <WidgetApp options={options} />
    </StrictMode>,
  );
}

function sf(command: SfCommand, options: WidgetInitOptions) {
  if (command === "init") {
    mount(options);
    return;
  }
  console.warn("[SupportFlow Widget] Unknown command", command);
}

function boot() {
  const existing = window.sf;
  window.sf = sf as typeof window.sf;

  const queue = existing?.q ?? [];
  for (const item of queue) {
    if (Array.isArray(item) && item[0] === "init") {
      sf("init", item[1]);
    }
  }
}

boot();

export { sf, mount };
export type { WidgetInitOptions };
