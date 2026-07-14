using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.GetRecoveryOptions;

public sealed class GetRecoveryOptionsCommandHandler
    : IRequestHandler<GetRecoveryOptionsCommand, RecoveryOptionsResponse>
{
    private readonly IPasswordResetService _passwordResetService;

    public GetRecoveryOptionsCommandHandler(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    public Task<RecoveryOptionsResponse> Handle(
        GetRecoveryOptionsCommand request,
        CancellationToken cancellationToken)
    {
        return _passwordResetService.GetRecoveryOptionsAsync(request.Email, cancellationToken);
    }
}
