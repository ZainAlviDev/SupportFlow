using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;

namespace SupportFlow.Workspace.Infrastructure.Workspaces;

public static class WorkspaceSettingsMerger
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    private static readonly HashSet<string> AllowedPositions = new(StringComparer.OrdinalIgnoreCase)
    {
        "bottom-left",
        "bottom-right",
    };

    private static readonly string[] WeekDays =
    [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    public static string Merge(
        string? existingJson,
        string? rawSettingsJson,
        WidgetSettingsDto? widget,
        BusinessHoursSettingsDto? businessHours)
    {
        JsonObject root;

        if (!string.IsNullOrWhiteSpace(rawSettingsJson) && widget is null && businessHours is null)
        {
            try
            {
                root = JsonNode.Parse(rawSettingsJson) as JsonObject
                    ?? throw new ConflictException("settingsJson must be a JSON object.");
            }
            catch (JsonException)
            {
                throw new ConflictException("settingsJson must be valid JSON.");
            }

            ValidateRoot(root);
            return root.ToJsonString(JsonOptions);
        }

        try
        {
            root = string.IsNullOrWhiteSpace(existingJson)
                ? new JsonObject()
                : JsonNode.Parse(existingJson) as JsonObject ?? new JsonObject();
        }
        catch (JsonException)
        {
            root = new JsonObject();
        }

        if (widget is not null)
        {
            var widgetNode = root["widget"] as JsonObject ?? new JsonObject();
            ApplyWidget(widgetNode, widget);
            root["widget"] = widgetNode;
        }

        if (businessHours is not null)
        {
            var hoursNode = root["businessHours"] as JsonObject ?? new JsonObject();
            ApplyBusinessHours(hoursNode, businessHours);
            root["businessHours"] = hoursNode;
        }

        ValidateRoot(root);
        return root.ToJsonString(JsonOptions);
    }

    public static (WidgetSettingsDto Widget, BusinessHoursSettingsDto? BusinessHours) Parse(string? settingsJson)
    {
        var widget = new WidgetSettingsDto("#10b981", "bottom-right", "Hi! How can we help?", false);
        BusinessHoursSettingsDto? hours = null;

        if (string.IsNullOrWhiteSpace(settingsJson))
        {
            return (widget, hours);
        }

        try
        {
            using var doc = JsonDocument.Parse(settingsJson);
            if (doc.RootElement.TryGetProperty("widget", out var widgetEl))
            {
                widget = new WidgetSettingsDto(
                    widgetEl.TryGetProperty("primaryColor", out var color) ? color.GetString() ?? widget.PrimaryColor : widget.PrimaryColor,
                    widgetEl.TryGetProperty("position", out var position) ? position.GetString() ?? widget.Position : widget.Position,
                    widgetEl.TryGetProperty("welcomeMessage", out var welcome) ? welcome.GetString() ?? widget.WelcomeMessage : widget.WelcomeMessage,
                    widgetEl.TryGetProperty("preChatEnabled", out var preChat) && preChat.ValueKind is JsonValueKind.True or JsonValueKind.False
                        ? preChat.GetBoolean()
                        : widget.PreChatEnabled);
            }

            if (doc.RootElement.TryGetProperty("businessHours", out var hoursEl))
            {
                var days = new List<BusinessHoursDayDto>();
                if (hoursEl.TryGetProperty("days", out var daysEl) && daysEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var day in daysEl.EnumerateArray())
                    {
                        days.Add(new BusinessHoursDayDto(
                            day.TryGetProperty("day", out var dayName) ? dayName.GetString() ?? "" : "",
                            day.TryGetProperty("isOpen", out var isOpen) && isOpen.GetBoolean(),
                            day.TryGetProperty("open", out var open) ? open.GetString() : null,
                            day.TryGetProperty("close", out var close) ? close.GetString() : null));
                    }
                }

                hours = new BusinessHoursSettingsDto(
                    hoursEl.TryGetProperty("enabled", out var enabled) && enabled.GetBoolean(),
                    hoursEl.TryGetProperty("timezone", out var tz) ? tz.GetString() : null,
                    days,
                    hoursEl.TryGetProperty("offlineMessage", out var offline) ? offline.GetString() : null);
            }
        }
        catch (JsonException)
        {
            // Keep defaults when stored JSON is corrupt.
        }

        return (widget, hours);
    }

    private static void ApplyWidget(JsonObject node, WidgetSettingsDto widget)
    {
        if (widget.PrimaryColor is not null)
        {
            ValidateColor(widget.PrimaryColor);
            node["primaryColor"] = widget.PrimaryColor.Trim();
        }

        if (widget.Position is not null)
        {
            var position = widget.Position.Trim().ToLowerInvariant();
            if (!AllowedPositions.Contains(position))
            {
                throw new ConflictException("Widget position must be bottom-left or bottom-right.");
            }

            node["position"] = position;
        }

        if (widget.WelcomeMessage is not null)
        {
            var welcome = widget.WelcomeMessage.Trim();
            if (welcome.Length is < 1 or > 300)
            {
                throw new ConflictException("Welcome message must be between 1 and 300 characters.");
            }

            node["welcomeMessage"] = welcome;
        }

        if (widget.PreChatEnabled is not null)
        {
            node["preChatEnabled"] = widget.PreChatEnabled.Value;
        }
    }

    private static void ApplyBusinessHours(JsonObject node, BusinessHoursSettingsDto hours)
    {
        if (hours.Enabled is not null)
        {
            node["enabled"] = hours.Enabled.Value;
        }

        if (hours.Timezone is not null)
        {
            var timezone = hours.Timezone.Trim();
            if (timezone.Length is < 2 or > 100)
            {
                throw new ConflictException("Business hours timezone is invalid.");
            }

            node["timezone"] = timezone;
        }

        if (hours.OfflineMessage is not null)
        {
            var offline = hours.OfflineMessage.Trim();
            if (offline.Length > 500)
            {
                throw new ConflictException("Offline message must be at most 500 characters.");
            }

            node["offlineMessage"] = offline;
        }

        if (hours.Days is not null)
        {
            var daysArray = new JsonArray();
            foreach (var dayName in WeekDays)
            {
                var match = hours.Days.FirstOrDefault(d =>
                    string.Equals(d.Day, dayName, StringComparison.OrdinalIgnoreCase));

                var isOpen = match?.IsOpen ?? false;
                string? open = null;
                string? close = null;

                if (isOpen)
                {
                    open = ValidateTime(match?.Open, "open");
                    close = ValidateTime(match?.Close, "close");
                }

                daysArray.Add(new JsonObject
                {
                    ["day"] = dayName,
                    ["isOpen"] = isOpen,
                    ["open"] = open,
                    ["close"] = close,
                });
            }

            node["days"] = daysArray;
        }
    }

    private static void ValidateRoot(JsonObject root)
    {
        if (root["widget"] is JsonObject widgetNode)
        {
            if (widgetNode["primaryColor"] is JsonValue colorValue && colorValue.TryGetValue<string>(out var color))
            {
                ValidateColor(color);
            }

            if (widgetNode["position"] is JsonValue positionValue && positionValue.TryGetValue<string>(out var position)
                && !AllowedPositions.Contains(position))
            {
                throw new ConflictException("Widget position must be bottom-left or bottom-right.");
            }
        }
    }

    private static void ValidateColor(string color)
    {
        var trimmed = color.Trim();
        if (trimmed.Length is not 7 || trimmed[0] != '#')
        {
            throw new ConflictException("Primary color must be a hex value like #10b981.");
        }

        for (var i = 1; i < trimmed.Length; i++)
        {
            if (!Uri.IsHexDigit(trimmed[i]))
            {
                throw new ConflictException("Primary color must be a hex value like #10b981.");
            }
        }
    }

    private static string ValidateTime(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value)
            || !TimeSpan.TryParseExact(value.Trim(), @"hh\:mm", CultureInfo.InvariantCulture, out _))
        {
            throw new ConflictException($"Business hours {field} must use HH:mm format.");
        }

        return value.Trim();
    }
}
