using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Application.ApiKeys.Commands.CreateApiKey;

public sealed class CreateApiKeyCommandHandler : IRequestHandler<CreateApiKeyCommand, CreatedApiKeyDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IApiKeyService _apiKeyService;

    public CreateApiKeyCommandHandler(ICurrentUserService currentUser, IApiKeyService apiKeyService)
    {
        _currentUser = currentUser;
        _apiKeyService = apiKeyService;
    }

    public Task<CreatedApiKeyDto> Handle(CreateApiKeyCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _apiKeyService.CreateAsync(
            _currentUser.TenantId.Value,
            _currentUser.UserId,
            request.Name,
            request.AllowedDomains,
            cancellationToken);
    }
}
