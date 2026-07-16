using FluentValidation;

namespace SupportFlow.Conversation.Application.Conversations.Commands.CreateConversation;

public sealed class CreateConversationCommandValidator : AbstractValidator<CreateConversationCommand>
{
    public CreateConversationCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.InitialMessage)
            .MaximumLength(8000)
            .When(x => !string.IsNullOrWhiteSpace(x.InitialMessage));
    }
}
