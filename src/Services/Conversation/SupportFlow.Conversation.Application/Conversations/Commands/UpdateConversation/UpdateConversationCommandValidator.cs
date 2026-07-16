using FluentValidation;

namespace SupportFlow.Conversation.Application.Conversations.Commands.UpdateConversation;

public sealed class UpdateConversationCommandValidator : AbstractValidator<UpdateConversationCommand>
{
    public UpdateConversationCommandValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
        RuleFor(x => x)
            .Must(x =>
                !string.IsNullOrWhiteSpace(x.Status)
                || x.AssigneeId is not null
                || x.ClearAssignee
                || x.SnoozedUntil is not null
                || x.ClearSnooze
                || x.Tags is not null)
            .WithMessage("Provide at least one field to update.");
    }
}
