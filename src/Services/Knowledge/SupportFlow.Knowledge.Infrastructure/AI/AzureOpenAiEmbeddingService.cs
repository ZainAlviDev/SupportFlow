using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Knowledge.Domain.Entities;

namespace SupportFlow.Knowledge.Infrastructure.AI;

public sealed class AzureOpenAiEmbeddingService : IEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly AzureOpenAiOptions _options;

    public AzureOpenAiEmbeddingService(
        HttpClient httpClient,
        IOptions<AzureOpenAiOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<float[]> CreateEmbeddingAsync(
        string text,
        CancellationToken cancellationToken)
    {
        if (HasAzureConfiguration())
        {
            var endpoint = _options.Endpoint.TrimEnd('/');
            var url = $"{endpoint}/openai/deployments/{Uri.EscapeDataString(_options.EmbeddingDeployment)}/embeddings?api-version={Uri.EscapeDataString(_options.ApiVersion)}";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("api-key", _options.ApiKey);
            request.Content = JsonContent.Create(new { input = text });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<EmbeddingResponse>(
                cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Azure OpenAI returned an empty embedding response.");

            var embedding = payload.Data.FirstOrDefault()?.Embedding
                ?? throw new InvalidOperationException("Azure OpenAI returned no embedding.");

            if (embedding.Length != ArticleChunk.EmbeddingDimensions)
            {
                throw new InvalidOperationException(
                    $"Embedding deployment returned {embedding.Length} dimensions; expected {ArticleChunk.EmbeddingDimensions}.");
            }

            return embedding;
        }

        if (!_options.UseDevelopmentFallback)
        {
            throw new InvalidOperationException("Azure OpenAI embedding configuration is missing.");
        }

        return CreateDevelopmentEmbedding(text);
    }

    private bool HasAzureConfiguration() =>
        Uri.TryCreate(_options.Endpoint, UriKind.Absolute, out _)
        && !string.IsNullOrWhiteSpace(_options.ApiKey)
        && !string.IsNullOrWhiteSpace(_options.EmbeddingDeployment);

    private static float[] CreateDevelopmentEmbedding(string text)
    {
        var vector = new float[ArticleChunk.EmbeddingDimensions];
        var words = text.Split(
            [' ', '\r', '\n', '\t', '.', ',', ';', ':', '!', '?', '(', ')', '[', ']'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var word in words)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(word.ToLowerInvariant()));
            var index = BitConverter.ToUInt32(bytes, 0) % ArticleChunk.EmbeddingDimensions;
            vector[index] += (bytes[4] & 1) == 0 ? 1f : -1f;
        }

        var magnitude = MathF.Sqrt(vector.Sum(value => value * value));
        if (magnitude == 0)
        {
            vector[0] = 1f;
            return vector;
        }

        for (var index = 0; index < vector.Length; index++)
        {
            vector[index] /= magnitude;
        }

        return vector;
    }

    private sealed record EmbeddingResponse(
        [property: JsonPropertyName("data")] IReadOnlyList<EmbeddingData> Data);

    private sealed record EmbeddingData(
        [property: JsonPropertyName("embedding")] float[] Embedding);
}
