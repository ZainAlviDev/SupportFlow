/** Legacy helper — prefer window.sf('init', { apiKey }) via embed.tsx */
export type { WidgetInitOptions as WidgetConfig } from "./types";

export function initWidget(config: { apiKey: string }) {
  if (typeof window !== "undefined" && typeof window.sf === "function") {
    window.sf("init", config);
    return;
  }
  console.warn("[SupportFlow Widget] Call sf('init', config) after loading widget.js");
}
