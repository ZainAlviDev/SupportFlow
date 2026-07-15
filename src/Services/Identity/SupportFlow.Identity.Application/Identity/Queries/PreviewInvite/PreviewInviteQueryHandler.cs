using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Queries.PreviewInvite;

public sealed class PreviewInviteQueryHandler : IRequestHandler<PreviewInviteQuery, InvitePreviewResponse>
{
    private readonly IMemberInviteService _memberInviteService;

    public PreviewInviteQueryHandler(IMemberInviteService memberInviteService)
    {
        _memberInviteService = memberInviteService;
    }

    public Task<InvitePreviewResponse> Handle(PreviewInviteQuery request, CancellationToken cancellationToken)
    {
        return _memberInviteService.PreviewInviteAsync(request.Token, cancellationToken);
    }
}
