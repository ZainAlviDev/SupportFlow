using MediatR;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Queries.ListTicketComments;

public sealed class ListTicketCommentsQueryHandler
    : IRequestHandler<ListTicketCommentsQuery, IReadOnlyList<TicketCommentDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketService _ticketService;

    public ListTicketCommentsQueryHandler(ICurrentUserService currentUser, ITicketService ticketService)
    {
        _currentUser = currentUser;
        _ticketService = ticketService;
    }

    public Task<IReadOnlyList<TicketCommentDto>> Handle(
        ListTicketCommentsQuery request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _ticketService.ListCommentsAsync(
            _currentUser.TenantId.Value,
            request.TicketId,
            request.IncludeInternal,
            cancellationToken);
    }
}
