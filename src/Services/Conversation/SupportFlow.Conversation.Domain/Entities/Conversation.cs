using SupportFlow.Conversation.Domain.Enums;
using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Conversation.Domain.Entities;

public class Conversation : AuditableEntity, ITenantEntity
{
    private Conversation()
    {
    }

    public Conversation(
        Guid tenantId,
        Guid customerId,
        ChannelType channel = ChannelType.WebChat,
        Guid? assigneeId = null)
    {
        TenantId = tenantId;
        CustomerId = customerId;
        Channel = channel;
        AssigneeId = assigneeId;
        ConversationStatus = ConversationStatus.Open;
        LastMessageAt = DateTime.UtcNow;
    }

    public Guid TenantId { get; set; }
    public Guid CustomerId { get; set; }
    public ConversationStatus ConversationStatus { get; set; }
    public Guid? AssigneeId { get; set; }
    public ChannelType Channel { get; set; }
    public DateTime? SnoozedUntil { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string? TagsJson { get; set; }

    public ICollection<Message> Messages { get; set; } = new List<Message>();

    public void RecordMessage(DateTime sentAt)
    {
        LastMessageAt = sentAt;
        UpdatedAt = sentAt;
    }

    public void ApplyUpdate(
        ConversationStatus? status,
        Guid? assigneeId,
        bool clearAssignee,
        DateTime? snoozedUntil,
        bool clearSnooze,
        string? tagsJson)
    {
        if (status is not null)
        {
            SetStatus(status.Value, snoozedUntil);
        }

        if (clearAssignee)
        {
            Unassign();
        }
        else if (assigneeId is not null)
        {
            Assign(assigneeId.Value);
        }

        if (clearSnooze && status is null)
        {
            ClearSnooze();
        }
        else if (snoozedUntil is not null && status is null)
        {
            SetStatus(ConversationStatus.Snoozed, snoozedUntil);
        }

        if (tagsJson is not null)
        {
            TagsJson = tagsJson;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void Assign(Guid assigneeId)
    {
        if (assigneeId == Guid.Empty)
        {
            throw new ArgumentException("Assignee id is required.", nameof(assigneeId));
        }

        AssigneeId = assigneeId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Unassign()
    {
        AssigneeId = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetStatus(ConversationStatus status, DateTime? snoozedUntil = null)
    {
        ConversationStatus = status;

        if (status == ConversationStatus.Snoozed)
        {
            SnoozedUntil = snoozedUntil ?? DateTime.UtcNow.AddHours(1);
        }
        else
        {
            SnoozedUntil = null;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearSnooze()
    {
        SnoozedUntil = null;
        if (ConversationStatus == ConversationStatus.Snoozed)
        {
            ConversationStatus = ConversationStatus.Open;
        }

        UpdatedAt = DateTime.UtcNow;
    }
}
