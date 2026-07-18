using MediatR;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Queries.ListTickets;

public sealed class ListTicketsQueryHandler : IRequestHandler<ListTicketsQuery, TicketListResult>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketService _ticketService;

    public ListTicketsQueryHandler(ICurrentUserService currentUser, ITicketService ticketService)
    {
        _currentUser = currentUser;
        _ticketService = ticketService;
    }

    public Task<TicketListResult> Handle(ListTicketsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _ticketService.ListAsync(
            _currentUser.TenantId.Value,
            request.Status,
            request.Priority,
            request.Assignee,
            _currentUser.UserId,
            request.CustomerId,
            request.Page,
            request.PageSize,
            cancellationToken);
    }
}
