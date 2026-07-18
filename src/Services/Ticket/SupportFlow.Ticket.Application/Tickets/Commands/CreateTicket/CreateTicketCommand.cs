using MediatR;
using SupportFlow.Shared.Contracts.Tickets;

namespace SupportFlow.Ticket.Application.Tickets.Commands.CreateTicket;

public sealed record CreateTicketCommand(
    Guid CustomerId,
    string Subject,
    string? Description,
    string? Priority,
    Guid? ConversationId,
    Guid? AssigneeId) : IRequest<TicketDto>;
