using SupportFlow.Conversation.Domain.Enums;
using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Conversation.Domain.Entities;

public class Message : BaseEntity, ITenantEntity
{
    private Message()
    {
    }

    public Message(
        Guid tenantId,
        Guid conversationId,
        SenderType senderType,
        string body,
        Guid? senderId = null,
        bool isAiGenerated = false)
    {
        TenantId = tenantId;
        ConversationId = conversationId;
        SenderType = senderType;
        Body = body.Trim();
        SenderId = senderId;
        IsAiGenerated = isAiGenerated;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid TenantId { get; set; }
    public Guid ConversationId { get; set; }
    public SenderType SenderType { get; set; }
    public Guid? SenderId { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsAiGenerated { get; set; }
    public DateTime CreatedAt { get; set; }

    public Conversation Conversation { get; set; } = null!;
    public ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
}
