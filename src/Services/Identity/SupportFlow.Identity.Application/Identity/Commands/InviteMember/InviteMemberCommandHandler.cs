using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Identity.Application.Identity.Commands.InviteMember;

public sealed class InviteMemberCommandHandler : IRequestHandler<InviteMemberCommand, InviteMemberResponse>
{
    private readonly IMemberInviteService _memberInviteService;

    public InviteMemberCommandHandler(IMemberInviteService memberInviteService)
    {
        _memberInviteService = memberInviteService;
    }

    public Task<InviteMemberResponse> Handle(InviteMemberCommand request, CancellationToken cancellationToken)
    {
        return _memberInviteService.InviteAsync(
            new InviteMemberRequest(request.Email, request.Role),
            cancellationToken);
    }
}
