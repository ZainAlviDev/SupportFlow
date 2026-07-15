import { z } from "zod";

export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export const workspaceSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .min(2, "Workspace name must be at least 2 characters")
    .max(200, "Workspace name must be at most 200 characters"),
  timezone: z
    .string()
    .trim()
    .min(1, "Select a timezone"),
});

export type WorkspaceSettingsFormValues = z.infer<typeof workspaceSettingsSchema>;
