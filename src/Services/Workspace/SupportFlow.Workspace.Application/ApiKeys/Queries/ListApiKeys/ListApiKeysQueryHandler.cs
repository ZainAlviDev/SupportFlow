using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Application.ApiKeys.Queries.ListApiKeys;

public sealed class ListApiKeysQueryHandler : IRequestHandler<ListApiKeysQuery, IReadOnlyList<ApiKeyDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IApiKeyService _apiKeyService;

    public ListApiKeysQueryHandler(ICurrentUserService currentUser, IApiKeyService apiKeyService)
    {
        _currentUser = currentUser;
        _apiKeyService = apiKeyService;
    }

    public Task<IReadOnlyList<ApiKeyDto>> Handle(ListApiKeysQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _apiKeyService.ListAsync(_currentUser.TenantId.Value, cancellationToken);
    }
}
