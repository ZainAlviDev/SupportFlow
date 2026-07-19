namespace SupportFlow.Shared.Contracts.Workspaces;

public sealed record CreateWorkspaceRequest(string Name, string? Slug = null, string? Timezone = null);

public sealed record WidgetSettingsDto(
    string? PrimaryColor = null,
    string? Position = null,
    string? WelcomeMessage = null,
    bool? PreChatEnabled = null);

public sealed record BusinessHoursDayDto(
    string Day,
    bool IsOpen,
    string? Open = null,
    string? Close = null);

public sealed record BusinessHoursSettingsDto(
    bool? Enabled = null,
    string? Timezone = null,
    IReadOnlyList<BusinessHoursDayDto>? Days = null,
    string? OfflineMessage = null);

public sealed record UpdateWorkspaceRequest(
    string? Name = null,
    string? Timezone = null,
    string? SettingsJson = null,
    WidgetSettingsDto? Widget = null,
    BusinessHoursSettingsDto? BusinessHours = null);

public sealed record WorkspaceDto(
    Guid Id,
    string Name,
    string Slug,
    string Timezone,
    string Plan,
    string? SettingsJson,
    DateTime CreatedAt,
    WidgetSettingsDto? Widget = null,
    BusinessHoursSettingsDto? BusinessHours = null);
