using MediatR;
using SupportFlow.Shared.Contracts.Tickets;

namespace SupportFlow.Ticket.Application.Tickets.Commands.UpdateTicket;

public sealed record UpdateTicketCommand(
    Guid TicketId,
    string? Subject,
    string? Description,
    string? Priority,
    string? Status,
    Guid? AssigneeId,
    bool ClearAssignee) : IRequest<TicketDto>;
