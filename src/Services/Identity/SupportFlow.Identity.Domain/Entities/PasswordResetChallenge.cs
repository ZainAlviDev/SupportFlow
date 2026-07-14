using SupportFlow.Shared.Kernel.Entities;

namespace SupportFlow.Identity.Domain.Entities;

public class PasswordResetChallenge : BaseEntity
{
    public Guid UserId { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int Attempts { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public string? ResetTokenHash { get; set; }
    public DateTime? ResetTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
