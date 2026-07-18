using MediatR;
using SupportFlow.Shared.Contracts.Tickets;

namespace SupportFlow.Ticket.Application.Tickets.Commands.AddTicketComment;

public sealed record AddTicketCommentCommand(Guid TicketId, string Body, bool IsInternal)
    : IRequest<TicketCommentDto>;
