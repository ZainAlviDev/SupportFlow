using MediatR;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Application.Tickets.Queries.ListTickets;

public sealed record ListTicketsQuery(
    string? Status,
    string? Priority,
    string? Assignee,
    Guid? CustomerId,
    int Page = 1,
    int PageSize = 20) : IRequest<TicketListResult>;
