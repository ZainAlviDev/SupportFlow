using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.SendMessage;

public sealed record SendMessageCommand(
    Guid ConversationId,
    string Body,
    bool IsAiGenerated) : IRequest<MessageDto>;
