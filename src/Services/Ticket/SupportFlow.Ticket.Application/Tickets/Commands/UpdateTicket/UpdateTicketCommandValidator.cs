using FluentValidation;
using SupportFlow.Ticket.Domain.Enums;

namespace SupportFlow.Ticket.Application.Tickets.Commands.UpdateTicket;

public sealed class UpdateTicketCommandValidator : AbstractValidator<UpdateTicketCommand>
{
    public UpdateTicketCommandValidator()
    {
        RuleFor(x => x.TicketId).NotEmpty();
        RuleFor(x => x.Subject).MaximumLength(300).When(x => x.Subject is not null);
        RuleFor(x => x.Description).MaximumLength(8000).When(x => x.Description is not null);
        RuleFor(x => x.Priority)
            .Must(p => p is null || Enum.TryParse<TicketPriority>(p, true, out _))
            .WithMessage("Priority must be Low, Medium, High, or Urgent.");
        RuleFor(x => x.Status)
            .Must(s => s is null || Enum.TryParse<TicketStatus>(s, true, out _))
            .WithMessage("Status must be New, Open, Pending, Resolved, or Closed.");
    }
}
