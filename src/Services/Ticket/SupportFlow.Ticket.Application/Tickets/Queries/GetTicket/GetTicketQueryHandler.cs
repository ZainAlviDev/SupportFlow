using MediatR;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Queries.GetTicket;

public sealed class GetTicketQueryHandler : IRequestHandler<GetTicketQuery, TicketDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketService _ticketService;

    public GetTicketQueryHandler(ICurrentUserService currentUser, ITicketService ticketService)
    {
        _currentUser = currentUser;
        _ticketService = ticketService;
    }

    public Task<TicketDto> Handle(GetTicketQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _ticketService.GetByIdAsync(_currentUser.TenantId.Value, request.TicketId, cancellationToken);
    }
}
