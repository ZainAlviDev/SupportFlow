export function canManageWorkspace(role?: string | null): boolean {
  const normalized = role?.trim().toLowerCase();
  return normalized === "owner" || normalized === "admin";
}
