using FluentValidation;

namespace SupportFlow.Conversation.Application.Conversations.Commands.ChangeConversationStatus;

public sealed class ChangeConversationStatusCommandValidator : AbstractValidator<ChangeConversationStatusCommand>
{
    public ChangeConversationStatusCommandValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
        RuleFor(x => x.Status).NotEmpty();
    }
}
