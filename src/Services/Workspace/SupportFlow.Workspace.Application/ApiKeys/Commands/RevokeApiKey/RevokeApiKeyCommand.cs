using MediatR;

namespace SupportFlow.Workspace.Application.ApiKeys.Commands.RevokeApiKey;

public sealed record RevokeApiKeyCommand(Guid ApiKeyId) : IRequest;
