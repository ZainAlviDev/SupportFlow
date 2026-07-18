using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.AI.Application.Common.Interfaces;

public interface ISuggestReplyService
{
    Task<SuggestReplyResponse> SuggestReplyAsync(
        SuggestReplyRequest request,
        CancellationToken cancellationToken);
}
