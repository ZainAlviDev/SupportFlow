using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Conversation.Domain.Entities;

public class MessageAttachment : BaseEntity, ITenantEntity
{
    private MessageAttachment()
    {
    }

    public MessageAttachment(
        Guid tenantId,
        Guid messageId,
        string fileName,
        string blobUrl,
        string mimeType,
        long sizeBytes)
    {
        TenantId = tenantId;
        MessageId = messageId;
        FileName = fileName.Trim();
        BlobUrl = blobUrl.Trim();
        MimeType = mimeType.Trim();
        SizeBytes = sizeBytes;
    }

    public Guid TenantId { get; set; }
    public Guid MessageId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }

    public Message Message { get; set; } = null!;
}
