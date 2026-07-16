using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Common.Events;

public sealed record MessageSentNotification(MessageDto Message) : INotification;
