using FluentValidation;

namespace SupportFlow.Conversation.Application.Conversations.Commands.UnassignConversation;

public sealed class UnassignConversationCommandValidator : AbstractValidator<UnassignConversationCommand>
{
    public UnassignConversationCommandValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
    }
}
