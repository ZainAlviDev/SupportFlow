using MediatR;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Application.ApiKeys.Commands.RevokeApiKey;

public sealed class RevokeApiKeyCommandHandler : IRequestHandler<RevokeApiKeyCommand>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IApiKeyService _apiKeyService;

    public RevokeApiKeyCommandHandler(ICurrentUserService currentUser, IApiKeyService apiKeyService)
    {
        _currentUser = currentUser;
        _apiKeyService = apiKeyService;
    }

    public async Task Handle(RevokeApiKeyCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        await _apiKeyService.RevokeAsync(
            _currentUser.TenantId.Value,
            request.ApiKeyId,
            _currentUser.UserId,
            cancellationToken);
    }
}
