using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Identity.Application.Identity.Commands.InviteMember;

public sealed record InviteMemberCommand(string Email, string Role) : IRequest<InviteMemberResponse>;
