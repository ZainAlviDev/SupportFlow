using FluentValidation;

namespace SupportFlow.Ticket.Application.Tickets.Commands.CreateTicket;

public sealed class CreateTicketCommandValidator : AbstractValidator<CreateTicketCommand>
{
    public CreateTicketCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(8000).When(x => x.Description is not null);
        RuleFor(x => x.Priority)
            .Must(p => p is null || Enum.TryParse<Domain.Enums.TicketPriority>(p, true, out _))
            .WithMessage("Priority must be Low, Medium, High, or Urgent.");
    }
}
