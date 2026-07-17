using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.ApiKeys.Queries.ListApiKeys;

public sealed record ListApiKeysQuery : IRequest<IReadOnlyList<ApiKeyDto>>;
