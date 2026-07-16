using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Conversation.Application.Common.Events;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Conversation.Domain.Enums;
using SupportFlow.Conversation.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Conversations;
using SupportFlow.Shared.Kernel.Enums;
using ConversationEntity = SupportFlow.Conversation.Domain.Entities.Conversation;
using MessageEntity = SupportFlow.Conversation.Domain.Entities.Message;

namespace SupportFlow.Conversation.Infrastructure.Conversations;

public sealed class ConversationService : IConversationService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly ConversationDbContext _dbContext;
    private readonly IPublisher _publisher;

    public ConversationService(ConversationDbContext dbContext, IPublisher publisher)
    {
        _dbContext = dbContext;
        _publisher = publisher;
    }

    public async Task<ConversationListResult> ListAsync(
        Guid tenantId,
        string? status,
        string? assignee,
        Guid? currentUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Conversations
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId && !c.IsDeleted && c.Status == EntityStatus.Active);

        if (!string.IsNullOrWhiteSpace(status)
            && TryParseStatus(status, out var conversationStatus))
        {
            query = query.Where(c => c.ConversationStatus == conversationStatus);
        }

        if (!string.IsNullOrWhiteSpace(assignee))
        {
            if (string.Equals(assignee, "me", StringComparison.OrdinalIgnoreCase))
            {
                if (currentUserId is null)
                {
                    throw new UnauthorizedException("User context is required for assignee=me.");
                }

                query = query.Where(c => c.AssigneeId == currentUserId);
            }
            else if (string.Equals(assignee, "unassigned", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.AssigneeId == null);
            }
            else if (Guid.TryParse(assignee, out var assigneeId))
            {
                query = query.Where(c => c.AssigneeId == assigneeId);
            }
            else
            {
                throw new ConflictException("assignee must be 'me', 'unassigned', or a user id.");
            }
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(c => c.LastMessageAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new ConversationListResult(items.Select(MapConversation).ToList(), page, pageSize, total);
    }

    public async Task<ConversationDto> GetByIdAsync(
        Guid tenantId,
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var conversation = await FindConversationAsync(tenantId, conversationId, tracking: false, cancellationToken);
        return MapConversation(conversation);
    }

    public async Task<ConversationDto> CreateAsync(
        Guid tenantId,
        Guid? actorUserId,
        Guid customerId,
        string? channel,
        Guid? assigneeId,
        IReadOnlyList<string>? tags,
        string? initialMessage,
        CancellationToken cancellationToken)
    {
        var channelType = ParseChannel(channel);
        var conversation = new ConversationEntity(tenantId, customerId, channelType, assigneeId)
        {
            TagsJson = SerializeTags(tags)
        };

        _dbContext.Conversations.Add(conversation);

        MessageDto? initial = null;
        if (!string.IsNullOrWhiteSpace(initialMessage))
        {
            var message = new MessageEntity(
                tenantId,
                conversation.Id,
                SenderType.Agent,
                initialMessage,
                actorUserId);
            conversation.RecordMessage(message.CreatedAt);
            _dbContext.Messages.Add(message);
            initial = MapMessage(message);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = MapConversation(conversation);
        await _publisher.Publish(new ConversationUpdatedNotification(dto), cancellationToken);

        if (initial is not null)
        {
            await _publisher.Publish(new MessageSentNotification(initial), cancellationToken);
        }

        return dto;
    }

    public async Task<ConversationDto> UpdateAsync(
        Guid tenantId,
        Guid conversationId,
        string? status,
        Guid? assigneeId,
        bool clearAssignee,
        DateTime? snoozedUntil,
        bool clearSnooze,
        IReadOnlyList<string>? tags,
        CancellationToken cancellationToken)
    {
        var conversation = await FindConversationAsync(tenantId, conversationId, tracking: true, cancellationToken);

        ConversationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            parsedStatus = ParseRequiredStatus(status);
        }

        conversation.ApplyUpdate(
            parsedStatus,
            assigneeId,
            clearAssignee,
            snoozedUntil,
            clearSnooze,
            tags is null ? null : SerializeTags(tags));

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await PublishUpdatedAsync(conversation, cancellationToken);
    }

    public async Task<ConversationDto> AssignAsync(
        Guid tenantId,
        Guid conversationId,
        Guid assigneeId,
        Guid? actorUserId,
        CancellationToken cancellationToken)
    {
        var conversation = await FindConversationAsync(tenantId, conversationId, tracking: true, cancellationToken);
        conversation.Assign(assigneeId);

        var note = assigneeId == actorUserId
            ? "Conversation claimed by agent."
            : "Conversation assigned to an agent.";
        var systemMessage = AddSystemMessage(conversation, note, actorUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _publisher.Publish(new MessageSentNotification(MapMessage(systemMessage)), cancellationToken);
        return await PublishUpdatedAsync(conversation, cancellationToken);
    }

    public async Task<ConversationDto> UnassignAsync(
        Guid tenantId,
        Guid conversationId,
        Guid? actorUserId,
        CancellationToken cancellationToken)
    {
        var conversation = await FindConversationAsync(tenantId, conversationId, tracking: true, cancellationToken);
        conversation.Unassign();
        var systemMessage = AddSystemMessage(conversation, "Conversation unassigned.", actorUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _publisher.Publish(new MessageSentNotification(MapMessage(systemMessage)), cancellationToken);
        return await PublishUpdatedAsync(conversation, cancellationToken);
    }

    public async Task<ConversationDto> ChangeStatusAsync(
        Guid tenantId,
        Guid conversationId,
        string status,
        DateTime? snoozedUntil,
        Guid? actorUserId,
        CancellationToken cancellationToken)
    {
        var conversation = await FindConversationAsync(tenantId, conversationId, tracking: true, cancellationToken);
        var parsed = ParseRequiredStatus(status);

        if (parsed == ConversationStatus.Snoozed && snoozedUntil is null)
        {
            throw new ConflictException("SnoozedUntil is required when status is Snoozed.");
        }

        if (parsed == ConversationStatus.Snoozed && snoozedUntil <= DateTime.UtcNow)
        {
            throw new ConflictException("SnoozedUntil must be in the future.");
        }

        conversation.SetStatus(parsed, snoozedUntil);
        var systemMessage = AddSystemMessage(conversation, $"Status changed to {parsed}.", actorUserId);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _publisher.Publish(new MessageSentNotification(MapMessage(systemMessage)), cancellationToken);
        return await PublishUpdatedAsync(conversation, cancellationToken);
    }

    public async Task<MessageListResult> ListMessagesAsync(
        Guid tenantId,
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await EnsureConversationExistsAsync(tenantId, conversationId, cancellationToken);

        var query = _dbContext.Messages
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.TenantId == tenantId && m.ConversationId == conversationId);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new MessageListResult(items.Select(MapMessage).ToList(), page, pageSize, total);
    }

    public async Task<MessageDto> SendMessageAsync(
        Guid tenantId,
        Guid conversationId,
        Guid? senderId,
        string body,
        bool isAiGenerated,
        CancellationToken cancellationToken)
    {
        var conversation = await FindConversationAsync(tenantId, conversationId, tracking: true, cancellationToken);

        var senderType = isAiGenerated ? SenderType.AI : SenderType.Agent;
        var message = new MessageEntity(
            tenantId,
            conversationId,
            senderType,
            body,
            senderId,
            isAiGenerated);

        conversation.RecordMessage(message.CreatedAt);
        _dbContext.Messages.Add(message);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = MapMessage(message);
        await _publisher.Publish(new MessageSentNotification(dto), cancellationToken);
        await _publisher.Publish(new ConversationUpdatedNotification(MapConversation(conversation)), cancellationToken);
        return dto;
    }

    private MessageEntity AddSystemMessage(ConversationEntity conversation, string body, Guid? actorUserId)
    {
        var message = new MessageEntity(
            conversation.TenantId,
            conversation.Id,
            SenderType.System,
            body,
            actorUserId);
        conversation.RecordMessage(message.CreatedAt);
        _dbContext.Messages.Add(message);
        return message;
    }

    private async Task<ConversationDto> PublishUpdatedAsync(
        ConversationEntity conversation,
        CancellationToken cancellationToken)
    {
        var dto = MapConversation(conversation);
        await _publisher.Publish(new ConversationUpdatedNotification(dto), cancellationToken);
        return dto;
    }

    private async Task EnsureConversationExistsAsync(
        Guid tenantId,
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Conversations
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(
                c => c.Id == conversationId
                     && c.TenantId == tenantId
                     && !c.IsDeleted
                     && c.Status == EntityStatus.Active,
                cancellationToken);

        if (!exists)
        {
            throw new NotFoundException("Conversation was not found.");
        }
    }

    private async Task<ConversationEntity> FindConversationAsync(
        Guid tenantId,
        Guid conversationId,
        bool tracking,
        CancellationToken cancellationToken)
    {
        var query = tracking
            ? _dbContext.Conversations.IgnoreQueryFilters()
            : _dbContext.Conversations.IgnoreQueryFilters().AsNoTracking();
        var conversation = await query.FirstOrDefaultAsync(
            c => c.Id == conversationId
                 && c.TenantId == tenantId
                 && !c.IsDeleted
                 && c.Status == EntityStatus.Active,
            cancellationToken);

        return conversation ?? throw new NotFoundException("Conversation was not found.");
    }

    private static bool TryParseStatus(string status, out ConversationStatus parsed) =>
        Enum.TryParse(status.Trim(), ignoreCase: true, out parsed);

    private static ConversationStatus ParseRequiredStatus(string status)
    {
        if (!TryParseStatus(status, out var parsed))
        {
            throw new ConflictException("Status must be Open, Pending, Resolved, or Snoozed.");
        }

        return parsed;
    }

    private static ChannelType ParseChannel(string? channel)
    {
        if (string.IsNullOrWhiteSpace(channel))
        {
            return ChannelType.WebChat;
        }

        if (Enum.TryParse<ChannelType>(channel.Trim(), ignoreCase: true, out var parsed))
        {
            return parsed;
        }

        throw new ConflictException("Channel must be WebChat.");
    }

    private static string? SerializeTags(IReadOnlyList<string>? tags)
    {
        if (tags is null)
        {
            return null;
        }

        var cleaned = tags
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return JsonSerializer.Serialize(cleaned, JsonOptions);
    }

    private static IReadOnlyList<string> DeserializeTags(string? tagsJson)
    {
        if (string.IsNullOrWhiteSpace(tagsJson))
        {
            return Array.Empty<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(tagsJson, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }

    private static ConversationDto MapConversation(ConversationEntity conversation) =>
        new(
            conversation.Id,
            conversation.TenantId,
            conversation.CustomerId,
            conversation.ConversationStatus.ToString(),
            conversation.AssigneeId,
            conversation.Channel.ToString(),
            conversation.SnoozedUntil,
            conversation.LastMessageAt,
            DeserializeTags(conversation.TagsJson),
            conversation.CreatedAt,
            conversation.UpdatedAt);

    private static MessageDto MapMessage(MessageEntity message) =>
        new(
            message.Id,
            message.ConversationId,
            message.TenantId,
            message.SenderType.ToString(),
            message.SenderId,
            message.Body,
            message.IsAiGenerated,
            message.CreatedAt);
}
