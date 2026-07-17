using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.ApiKeys.Commands.CreateApiKey;

public sealed record CreateApiKeyCommand(string Name, IReadOnlyList<string>? AllowedDomains)
    : IRequest<CreatedApiKeyDto>;
