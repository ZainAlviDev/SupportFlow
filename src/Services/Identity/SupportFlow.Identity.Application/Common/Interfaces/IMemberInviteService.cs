using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Identity.Application.Common.Interfaces;

public interface IMemberInviteService
{
    Task<InviteMemberResponse> InviteAsync(InviteMemberRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<WorkspaceMemberDto>> ListMembersAsync(CancellationToken cancellationToken);

    Task<InvitePreviewResponse> PreviewInviteAsync(string token, CancellationToken cancellationToken);

    Task<LoginResponse> AcceptInviteAsync(AcceptInviteRequest request, CancellationToken cancellationToken);
}
