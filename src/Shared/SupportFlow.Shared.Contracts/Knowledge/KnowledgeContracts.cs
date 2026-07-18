namespace SupportFlow.Shared.Contracts.Knowledge;

public sealed record CreateKnowledgeArticleRequest(
    string Title,
    string Content,
    string? Category = null,
    bool Publish = false);

public sealed record UpdateKnowledgeArticleRequest(
    string Title,
    string Content,
    string? Category = null,
    string? Status = null);

public sealed record KnowledgeArticleDto(
    Guid Id,
    Guid TenantId,
    string Title,
    string Content,
    string? Category,
    string Status,
    int ChunkCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record SuggestReplyRequest(
    Guid ConversationId,
    string? Prompt = null);

public sealed record KnowledgeSourceDto(
    Guid ArticleId,
    string ArticleTitle,
    string Excerpt,
    double Distance);

public sealed record KnowledgeSearchRequest(string Query, int Limit = 5);

public sealed record SuggestReplyResponse(
    string Suggestion,
    IReadOnlyList<KnowledgeSourceDto> Sources);
