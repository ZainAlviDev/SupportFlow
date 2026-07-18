using MediatR;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Commands.UpdateTicket;

public sealed class UpdateTicketCommandHandler : IRequestHandler<UpdateTicketCommand, TicketDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketService _ticketService;

    public UpdateTicketCommandHandler(ICurrentUserService currentUser, ITicketService ticketService)
    {
        _currentUser = currentUser;
        _ticketService = ticketService;
    }

    public Task<TicketDto> Handle(UpdateTicketCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _ticketService.UpdateAsync(
            _currentUser.TenantId.Value,
            request.TicketId,
            _currentUser.UserId,
            request.Subject,
            request.Description,
            request.Priority,
            request.Status,
            request.AssigneeId,
            request.ClearAssignee,
            cancellationToken);
    }
}
