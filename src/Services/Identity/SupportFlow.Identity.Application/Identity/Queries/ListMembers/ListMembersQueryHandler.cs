using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Identity.Application.Identity.Queries.ListMembers;

public sealed class ListMembersQueryHandler : IRequestHandler<ListMembersQuery, IReadOnlyList<WorkspaceMemberDto>>
{
    private readonly IMemberInviteService _memberInviteService;

    public ListMembersQueryHandler(IMemberInviteService memberInviteService)
    {
        _memberInviteService = memberInviteService;
    }

    public Task<IReadOnlyList<WorkspaceMemberDto>> Handle(
        ListMembersQuery request,
        CancellationToken cancellationToken)
    {
        return _memberInviteService.ListMembersAsync(cancellationToken);
    }
}
