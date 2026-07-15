using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Identity.Application.Identity.Queries.ListMembers;

public sealed record ListMembersQuery : IRequest<IReadOnlyList<WorkspaceMemberDto>>;
