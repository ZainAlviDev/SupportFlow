using MediatR;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Commands.CreateTicket;

public sealed class CreateTicketCommandHandler : IRequestHandler<CreateTicketCommand, TicketDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketService _ticketService;

    public CreateTicketCommandHandler(ICurrentUserService currentUser, ITicketService ticketService)
    {
        _currentUser = currentUser;
        _ticketService = ticketService;
    }

    public Task<TicketDto> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _ticketService.CreateAsync(
            _currentUser.TenantId.Value,
            _currentUser.UserId,
            request.CustomerId,
            request.Subject,
            request.Description,
            request.Priority,
            request.ConversationId,
            request.AssigneeId,
            cancellationToken);
    }
}
