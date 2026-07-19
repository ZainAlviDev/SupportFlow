import { describe, expect, it } from "vitest";
import {
  isHexColor,
  normalizeBusinessHours,
  normalizeWidgetSettings,
} from "../lib/workspaceSettings";

describe("workspaceSettings helpers", () => {
  it("normalizes widget settings with defaults", () => {
    const widget = normalizeWidgetSettings({});
    expect(widget.primaryColor).toBe("#10b981");
    expect(widget.position).toBe("bottom-right");
    expect(widget.welcomeMessage.length).toBeGreaterThan(0);
  });

  it("keeps valid launcher positions only", () => {
    expect(normalizeWidgetSettings({ position: "bottom-left" }).position).toBe("bottom-left");
    expect(normalizeWidgetSettings({ position: "top" }).position).toBe("bottom-right");
  });

  it("fills missing business-hour days", () => {
    const hours = normalizeBusinessHours({
      enabled: true,
      days: [{ day: "Monday", isOpen: true, open: "08:00", close: "12:00" }],
    });
    expect(hours.days).toHaveLength(7);
    expect(hours.days?.[0]?.open).toBe("08:00");
    expect(hours.days?.[1]?.day).toBe("Tuesday");
  });

  it("validates hex colors", () => {
    expect(isHexColor("#10b981")).toBe(true);
    expect(isHexColor("10b981")).toBe(false);
  });
});
