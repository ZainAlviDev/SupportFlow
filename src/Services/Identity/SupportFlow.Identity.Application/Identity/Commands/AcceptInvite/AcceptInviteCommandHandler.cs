using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.AcceptInvite;

public sealed class AcceptInviteCommandHandler : IRequestHandler<AcceptInviteCommand, LoginResponse>
{
    private readonly IMemberInviteService _memberInviteService;

    public AcceptInviteCommandHandler(IMemberInviteService memberInviteService)
    {
        _memberInviteService = memberInviteService;
    }

    public Task<LoginResponse> Handle(AcceptInviteCommand request, CancellationToken cancellationToken)
    {
        return _memberInviteService.AcceptInviteAsync(
            new AcceptInviteRequest(
                request.Token,
                request.Password,
                request.FullName,
                request.PhoneNumber),
            cancellationToken);
    }
}
