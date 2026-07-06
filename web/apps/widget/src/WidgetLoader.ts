/** Widget loader — Shadow DOM mount in Module 4 */

export type WidgetConfig = {
  apiKey: string;
  position?: "bottom-right" | "bottom-left";
};

export function initWidget(config: WidgetConfig) {
  console.log("[SupportFlow Widget] init", config);
  // TODO Module 4: Shadow DOM + launcher button
}
