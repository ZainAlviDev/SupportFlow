using FluentValidation;

namespace SupportFlow.Ticket.Application.Tickets.Commands.AddTicketComment;

public sealed class AddTicketCommentCommandValidator : AbstractValidator<AddTicketCommentCommand>
{
    public AddTicketCommentCommandValidator()
    {
        RuleFor(x => x.TicketId).NotEmpty();
        RuleFor(x => x.Body).NotEmpty().MaximumLength(8000);
    }
}
