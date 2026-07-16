using FluentValidation;

namespace SupportFlow.Conversation.Application.Conversations.Queries.GetConversation;

public sealed class GetConversationQueryValidator : AbstractValidator<GetConversationQuery>
{
    public GetConversationQueryValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
    }
}
