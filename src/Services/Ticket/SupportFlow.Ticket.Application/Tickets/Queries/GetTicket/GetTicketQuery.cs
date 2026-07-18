using MediatR;
using SupportFlow.Shared.Contracts.Tickets;

namespace SupportFlow.Ticket.Application.Tickets.Queries.GetTicket;

public sealed record GetTicketQuery(Guid TicketId) : IRequest<TicketDto>;
