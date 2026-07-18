using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Customer.Domain.Entities;

public class CustomerNote : BaseEntity, ITenantEntity
{
    private CustomerNote()
    {
    }

    public CustomerNote(Guid tenantId, Guid customerId, Guid authorId, string body)
    {
        TenantId = tenantId;
        CustomerId = customerId;
        AuthorId = authorId;
        Body = body.Trim();
        CreatedAt = DateTime.UtcNow;
    }

    public Guid TenantId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid AuthorId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Customer? Customer { get; set; }
}
