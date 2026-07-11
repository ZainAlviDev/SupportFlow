using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Queries.GetMe;

public sealed record GetMeQuery : IRequest<MeResponse>;
