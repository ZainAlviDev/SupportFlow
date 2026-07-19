using SupportFlow.Notification.Domain.Enums;
using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Notification.Domain.Entities;

public sealed class AppNotification : BaseEntity, ITenantEntity
{
    private AppNotification()
    {
    }

    public AppNotification(
        Guid tenantId,
        Guid userId,
        NotificationType type,
        string title,
        string body,
        string? resourceType = null,
        Guid? resourceId = null,
        string? idempotencyKey = null)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }

        TenantId = tenantId;
        UserId = userId;
        Type = type;
        Title = NormalizeRequired(title, nameof(title), 200);
        Body = NormalizeRequired(body, nameof(body), 2000);
        ResourceType = NormalizeOptional(resourceType, 100);
        ResourceId = resourceId;
        IdempotencyKey = NormalizeOptional(idempotencyKey, 200);
        IsRead = false;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ResourceType { get; set; }
    public Guid? ResourceId { get; set; }
    public string? IdempotencyKey { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public void MarkAsRead()
    {
        if (IsRead)
        {
            return;
        }

        IsRead = true;
        ReadAt = DateTime.UtcNow;
    }

    private static string NormalizeRequired(string value, string paramName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{paramName} is required.", paramName);
        }

        var normalized = value.Trim();
        if (normalized.Length > maxLength)
        {
            throw new ArgumentException($"{paramName} must be at most {maxLength} characters.", paramName);
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();
        if (normalized.Length > maxLength)
        {
            throw new ArgumentException($"Value must be at most {maxLength} characters.");
        }

        return normalized;
    }
}
