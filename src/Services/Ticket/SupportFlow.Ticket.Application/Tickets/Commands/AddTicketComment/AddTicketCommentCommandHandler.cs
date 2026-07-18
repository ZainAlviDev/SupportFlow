using MediatR;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Commands.AddTicketComment;

public sealed class AddTicketCommentCommandHandler : IRequestHandler<AddTicketCommentCommand, TicketCommentDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketService _ticketService;

    public AddTicketCommentCommandHandler(ICurrentUserService currentUser, ITicketService ticketService)
    {
        _currentUser = currentUser;
        _ticketService = ticketService;
    }

    public Task<TicketCommentDto> Handle(AddTicketCommentCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedException("User context is required.");
        }

        return _ticketService.AddCommentAsync(
            _currentUser.TenantId.Value,
            request.TicketId,
            _currentUser.UserId.Value,
            request.Body,
            request.IsInternal,
            cancellationToken);
    }
}
