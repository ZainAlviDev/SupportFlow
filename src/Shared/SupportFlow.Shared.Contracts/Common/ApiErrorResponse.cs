namespace SupportFlow.Shared.Contracts.Common;

public sealed record ApiErrorDetail(string Field, string Message);

public sealed record ApiErrorBody(
    string Code,
    string Message,
    IReadOnlyList<ApiErrorDetail>? Details = null);

public sealed record ApiErrorResponse(ApiErrorBody Error);
