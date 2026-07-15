using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Queries.PreviewInvite;

public sealed record PreviewInviteQuery(string Token) : IRequest<InvitePreviewResponse>;
