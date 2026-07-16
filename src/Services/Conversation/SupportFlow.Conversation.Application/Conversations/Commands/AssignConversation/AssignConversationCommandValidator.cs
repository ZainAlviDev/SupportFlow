using FluentValidation;

namespace SupportFlow.Conversation.Application.Conversations.Commands.AssignConversation;

public sealed class AssignConversationCommandValidator : AbstractValidator<AssignConversationCommand>
{
    public AssignConversationCommandValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
    }
}
