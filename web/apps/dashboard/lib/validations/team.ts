import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  role: z.enum(["Admin", "Agent", "Viewer"], {
    required_error: "Select a role",
  }),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export const INVITE_ROLES = [
  {
    value: "Agent" as const,
    label: "Agent",
    description: "Reply to customers and manage assigned tickets.",
  },
  {
    value: "Admin" as const,
    label: "Admin",
    description: "Full access except ownership transfer.",
  },
  {
    value: "Viewer" as const,
    label: "Viewer",
    description: "Read-only access to conversations and tickets.",
  },
];
