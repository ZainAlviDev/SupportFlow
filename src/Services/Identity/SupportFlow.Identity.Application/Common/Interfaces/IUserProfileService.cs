using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? TenantId { get; }
}

public interface IUserProfileService
{
    Task<MeResponse> GetMeAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken);
}
