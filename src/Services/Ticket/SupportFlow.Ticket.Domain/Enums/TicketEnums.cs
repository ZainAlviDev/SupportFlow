namespace SupportFlow.Ticket.Domain.Enums;

public enum TicketStatus
{
    New = 0,
    Open = 1,
    Pending = 2,
    Resolved = 3,
    Closed = 4
}

public enum TicketPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}
