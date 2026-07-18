using MediatR;
using SupportFlow.Shared.Contracts.Tickets;

namespace SupportFlow.Ticket.Application.Tickets.Queries.ListTicketComments;

public sealed record ListTicketCommentsQuery(Guid TicketId, bool IncludeInternal = true)
    : IRequest<IReadOnlyList<TicketCommentDto>>;
