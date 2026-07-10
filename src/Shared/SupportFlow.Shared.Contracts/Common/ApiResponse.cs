namespace SupportFlow.Shared.Contracts.Common;

public sealed record ApiResponse<T>(T Data, object? Meta = null)
{
    public static ApiResponse<T> Success(T data, object? meta = null) => new(data, meta);
}
