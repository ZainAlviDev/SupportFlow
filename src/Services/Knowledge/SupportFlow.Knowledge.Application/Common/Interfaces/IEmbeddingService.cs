namespace SupportFlow.Knowledge.Application.Common.Interfaces;

public interface IEmbeddingService
{
    Task<float[]> CreateEmbeddingAsync(string text, CancellationToken cancellationToken);
}
