import type { BusinessHoursDay, BusinessHoursSettings, WidgetSettings } from "@supportflow/api-client";

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DEFAULT_WIDGET_SETTINGS: Required<Pick<WidgetSettings, "primaryColor" | "position" | "welcomeMessage">> = {
  primaryColor: "#10b981",
  position: "bottom-right",
  welcomeMessage: "Hi! How can we help?",
};

export function normalizeWidgetSettings(input?: WidgetSettings | null): {
  primaryColor: string;
  position: "bottom-left" | "bottom-right";
  welcomeMessage: string;
} {
  const position =
    input?.position === "bottom-left" || input?.position === "bottom-right"
      ? input.position
      : "bottom-right";

  return {
    primaryColor: input?.primaryColor?.trim() || DEFAULT_WIDGET_SETTINGS.primaryColor,
    position,
    welcomeMessage: input?.welcomeMessage?.trim() || DEFAULT_WIDGET_SETTINGS.welcomeMessage,
  };
}

export function defaultBusinessHours(timezone = "UTC"): BusinessHoursSettings {
  return {
    enabled: false,
    timezone,
    offlineMessage: "We're currently offline. Leave a message and we'll get back to you.",
    days: WEEK_DAYS.map((day) => ({
      day,
      isOpen: day !== "Saturday" && day !== "Sunday",
      open: "09:00",
      close: "17:00",
    })),
  };
}

export function normalizeBusinessHours(
  input?: BusinessHoursSettings | null,
  fallbackTimezone = "UTC",
): BusinessHoursSettings {
  const base = defaultBusinessHours(input?.timezone?.trim() || fallbackTimezone);
  const byDay = new Map((input?.days ?? []).map((day) => [day.day.toLowerCase(), day]));

  const days: BusinessHoursDay[] = WEEK_DAYS.map((day) => {
    const existing = byDay.get(day.toLowerCase());
    return {
      day,
      isOpen: existing?.isOpen ?? false,
      open: existing?.open ?? "09:00",
      close: existing?.close ?? "17:00",
    };
  });

  return {
    enabled: input?.enabled ?? false,
    timezone: input?.timezone?.trim() || fallbackTimezone,
    offlineMessage:
      input?.offlineMessage?.trim()
      || base.offlineMessage
      || "We're currently offline. Leave a message and we'll get back to you.",
    days,
  };
}

export function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}
